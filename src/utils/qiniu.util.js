const qiniu = require('qiniu');
const fs = require('fs');
const path = require('path');
const { logger } = require("../middleware/logger.middleware");

class QiniuUtil {
    static logger = logger("qiniu");
    static mac = null;
    static config = null;
    static bucketManager = null;
    static uploadToken = null;

    /**
     * Initialize Qiniu configuration
     * 初始化七牛云配置
     * @param {Object} options - Configuration options
     * @param {string} options.accessKey - Qiniu access key
     * @param {string} options.secretKey - Qiniu secret key
     * @param {string} options.bucket - Bucket name
     * @param {string} options.domain - CDN domain (optional)
     * @param {string} options.region - Region (optional, default: 'z0')
     * @param {boolean} options.useHttps - Use HTTPS (optional, default: true)
     */
    static init(options) {
        try {
            if (!options.accessKey || !options.secretKey || !options.bucket) {
                throw new Error('Access key, secret key, and bucket are required for Qiniu initialization');
            }

            this.config = {
                accessKey: options.accessKey,
                secretKey: options.secretKey,
                bucket: options.bucket,
                domain: options.domain || '',
                region: options.region || 'z0',
                useHttps: options.useHttps !== false
            };

            // Create MAC instance
            this.mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey);

            // Create bucket manager
            const config = new qiniu.conf.Config();
            config.zone = qiniu.zone[this.config.region.toUpperCase()];
            config.useHttpsDomain = this.config.useHttps;
            this.bucketManager = new qiniu.rs.BucketManager(this.mac, config);

            this.logger.info('Qiniu initialized successfully', {
                bucket: this.config.bucket,
                region: this.config.region,
                useHttps: this.config.useHttps
            });

            return true;
        } catch (error) {
            this.logger.error('Error initializing Qiniu', { error: error.message });
            throw new Error(`Failed to initialize Qiniu: ${error.message}`);
        }
    }

    /**
     * Generate upload token
     * 生成上传令牌
     * @param {Object} options - Token options
     * @param {string} options.key - File key (optional)
     * @param {number} options.expires - Token expiration in seconds (default: 3600)
     * @param {Object} options.policy - Upload policy (optional)
     * @returns {string} Upload token
     */
    static generateUploadToken(options = {}) {
        try {
            if (!this.mac || !this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            const { key, expires = 3600, policy = {} } = options;

            const putPolicy = new qiniu.rs.PutPolicy({
                scope: key ? `${this.config.bucket}:${key}` : this.config.bucket,
                expires: expires,
                ...policy
            });

            this.uploadToken = putPolicy.uploadToken(this.mac);

            this.logger.info('Upload token generated successfully', {
                key,
                expires,
                hasPolicy: Object.keys(policy).length > 0
            });

            return this.uploadToken;
        } catch (error) {
            this.logger.error('Error generating upload token', { error: error.message });
            throw new Error(`Failed to generate upload token: ${error.message}`);
        }
    }

    /**
     * Upload file from buffer
     * 从缓冲区上传文件
     * @param {Buffer} buffer - File buffer
     * @param {string} key - File key
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    static async uploadBuffer(buffer, key, options = {}) {
        try {
            if (!this.mac || !this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Buffer is required for upload');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            const uploadToken = options.token || this.generateUploadToken({ key });
            const config = new qiniu.conf.Config();
            config.zone = qiniu.zone[this.config.region.toUpperCase()];
            config.useHttpsDomain = this.config.useHttps;

            const formUploader = new qiniu.form_up.FormUploader(config);
            const putExtra = new qiniu.form_up.PutExtra();

            return new Promise((resolve, reject) => {
                formUploader.put(uploadToken, key, buffer, putExtra, (respErr, respBody, respInfo) => {
                    if (respErr) {
                        this.logger.error('Upload buffer failed', { error: respErr.message, key });
                        reject(new Error(`Upload failed: ${respErr.message}`));
                        return;
                    }

                    if (respInfo.statusCode === 200) {
                        const result = {
                            success: true,
                            key: respBody.key,
                            hash: respBody.hash,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType,
                            url: this.getPublicUrl(key)
                        };

                        this.logger.info('File uploaded successfully from buffer', {
                            key,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Upload buffer failed with status', {
                            statusCode: respInfo.statusCode,
                            body: respBody,
                            key
                        });
                        reject(new Error(`Upload failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error uploading buffer', { error: error.message, key });
            throw new Error(`Failed to upload buffer: ${error.message}`);
        }
    }

    /**
     * Upload file from local path
     * 从本地路径上传文件
     * @param {string} filePath - Local file path
     * @param {string} key - File key (optional, will use filename if not provided)
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    static async uploadFile(filePath, key = null, options = {}) {
        try {
            if (!this.mac || !this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const fileKey = key || path.basename(filePath);
            const uploadToken = options.token || this.generateUploadToken({ key: fileKey });
            const config = new qiniu.conf.Config();
            config.zone = qiniu.zone[this.config.region.toUpperCase()];
            config.useHttpsDomain = this.config.useHttps;

            const formUploader = new qiniu.form_up.FormUploader(config);
            const putExtra = new qiniu.form_up.PutExtra();

            return new Promise((resolve, reject) => {
                formUploader.putFile(uploadToken, fileKey, filePath, putExtra, (respErr, respBody, respInfo) => {
                    if (respErr) {
                        this.logger.error('Upload file failed', { error: respErr.message, filePath, key: fileKey });
                        reject(new Error(`Upload failed: ${respErr.message}`));
                        return;
                    }

                    if (respInfo.statusCode === 200) {
                        const result = {
                            success: true,
                            key: respBody.key,
                            hash: respBody.hash,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType,
                            url: this.getPublicUrl(fileKey)
                        };

                        this.logger.info('File uploaded successfully', {
                            filePath,
                            key: fileKey,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Upload file failed with status', {
                            statusCode: respInfo.statusCode,
                            body: respBody,
                            filePath,
                            key: fileKey
                        });
                        reject(new Error(`Upload failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error uploading file', { error: error.message, filePath, key });
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Upload file from stream
     * 从流上传文件
     * @param {Stream} stream - File stream
     * @param {string} key - File key
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    static async uploadStream(stream, key, options = {}) {
        try {
            if (!this.mac || !this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            const uploadToken = options.token || this.generateUploadToken({ key });
            const config = new qiniu.conf.Config();
            config.zone = qiniu.zone[this.config.region.toUpperCase()];
            config.useHttpsDomain = this.config.useHttps;

            const formUploader = new qiniu.form_up.FormUploader(config);
            const putExtra = new qiniu.form_up.PutExtra();

            return new Promise((resolve, reject) => {
                formUploader.putStream(uploadToken, key, stream, putExtra, (respErr, respBody, respInfo) => {
                    if (respErr) {
                        this.logger.error('Upload stream failed', { error: respErr.message, key });
                        reject(new Error(`Upload failed: ${respErr.message}`));
                        return;
                    }

                    if (respInfo.statusCode === 200) {
                        const result = {
                            success: true,
                            key: respBody.key,
                            hash: respBody.hash,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType,
                            url: this.getPublicUrl(key)
                        };

                        this.logger.info('File uploaded successfully from stream', {
                            key,
                            fsize: respBody.fsize,
                            mimeType: respBody.mimeType
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Upload stream failed with status', {
                            statusCode: respInfo.statusCode,
                            body: respBody,
                            key
                        });
                        reject(new Error(`Upload failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error uploading stream', { error: error.message, key });
            throw new Error(`Failed to upload stream: ${error.message}`);
        }
    }

    /**
     * Download file to local path
     * 下载文件到本地路径
     * @param {string} key - File key
     * @param {string} localPath - Local file path
     * @param {Object} options - Download options
     * @returns {Promise<Object>} Download result
     */
    static async downloadFile(key, localPath, options = {}) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            if (!localPath) {
                throw new Error('Local path is required');
            }

            // Ensure directory exists
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const publicUrl = this.getPublicUrl(key);
            const config = new qiniu.conf.Config();
            config.zone = qiniu.zone[this.config.region.toUpperCase()];
            config.useHttpsDomain = this.config.useHttps;

            return new Promise((resolve, reject) => {
                this.bucketManager.download(this.config.bucket, key, localPath, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Download file failed', { error: err.message, key, localPath });
                        reject(new Error(`Download failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const stats = fs.statSync(localPath);
                        const result = {
                            success: true,
                            key,
                            localPath,
                            size: stats.size,
                            url: publicUrl
                        };

                        this.logger.info('File downloaded successfully', {
                            key,
                            localPath,
                            size: stats.size
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Download file failed with status', {
                            statusCode: info.statusCode,
                            key,
                            localPath
                        });
                        reject(new Error(`Download failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error downloading file', { error: error.message, key, localPath });
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }

    /**
     * Get file info
     * 获取文件信息
     * @param {string} key - File key
     * @returns {Promise<Object>} File info
     */
    static async getFileInfo(key) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            return new Promise((resolve, reject) => {
                this.bucketManager.stat(this.config.bucket, key, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Get file info failed', { error: err.message, key });
                        reject(new Error(`Get file info failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            key: ret.key,
                            fsize: ret.fsize,
                            hash: ret.hash,
                            mimeType: ret.mimeType,
                            putTime: ret.putTime,
                            url: this.getPublicUrl(key)
                        };

                        this.logger.info('File info retrieved successfully', {
                            key,
                            fsize: ret.fsize,
                            mimeType: ret.mimeType
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Get file info failed with status', {
                            statusCode: info.statusCode,
                            key
                        });
                        reject(new Error(`Get file info failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error getting file info', { error: error.message, key });
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }

    /**
     * Delete file
     * 删除文件
     * @param {string} key - File key
     * @returns {Promise<Object>} Delete result
     */
    static async deleteFile(key) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            return new Promise((resolve, reject) => {
                this.bucketManager.delete(this.config.bucket, key, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Delete file failed', { error: err.message, key });
                        reject(new Error(`Delete failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            key
                        };

                        this.logger.info('File deleted successfully', { key });
                        resolve(result);
                    } else {
                        this.logger.error('Delete file failed with status', {
                            statusCode: info.statusCode,
                            key
                        });
                        reject(new Error(`Delete failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error deleting file', { error: error.message, key });
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Copy file
     * 复制文件
     * @param {string} sourceKey - Source file key
     * @param {string} targetKey - Target file key
     * @param {Object} options - Copy options
     * @returns {Promise<Object>} Copy result
     */
    static async copyFile(sourceKey, targetKey, options = {}) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!sourceKey || !targetKey) {
                throw new Error('Source key and target key are required');
            }

            const { force = false } = options;

            return new Promise((resolve, reject) => {
                this.bucketManager.copy(this.config.bucket, sourceKey, this.config.bucket, targetKey, { force }, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Copy file failed', { error: err.message, sourceKey, targetKey });
                        reject(new Error(`Copy failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            sourceKey,
                            targetKey,
                            url: this.getPublicUrl(targetKey)
                        };

                        this.logger.info('File copied successfully', { sourceKey, targetKey });
                        resolve(result);
                    } else {
                        this.logger.error('Copy file failed with status', {
                            statusCode: info.statusCode,
                            sourceKey,
                            targetKey
                        });
                        reject(new Error(`Copy failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error copying file', { error: error.message, sourceKey, targetKey });
            throw new Error(`Failed to copy file: ${error.message}`);
        }
    }

    /**
     * Move file (rename)
     * 移动文件（重命名）
     * @param {string} sourceKey - Source file key
     * @param {string} targetKey - Target file key
     * @param {Object} options - Move options
     * @returns {Promise<Object>} Move result
     */
    static async moveFile(sourceKey, targetKey, options = {}) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!sourceKey || !targetKey) {
                throw new Error('Source key and target key are required');
            }

            const { force = false } = options;

            return new Promise((resolve, reject) => {
                this.bucketManager.move(this.config.bucket, sourceKey, this.config.bucket, targetKey, { force }, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Move file failed', { error: err.message, sourceKey, targetKey });
                        reject(new Error(`Move failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            sourceKey,
                            targetKey,
                            url: this.getPublicUrl(targetKey)
                        };

                        this.logger.info('File moved successfully', { sourceKey, targetKey });
                        resolve(result);
                    } else {
                        this.logger.error('Move file failed with status', {
                            statusCode: info.statusCode,
                            sourceKey,
                            targetKey
                        });
                        reject(new Error(`Move failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error moving file', { error: error.message, sourceKey, targetKey });
            throw new Error(`Failed to move file: ${error.message}`);
        }
    }

    /**
     * List files in bucket
     * 列出存储桶中的文件
     * @param {Object} options - List options
     * @param {string} options.prefix - File prefix filter
     * @param {string} options.marker - Pagination marker
     * @param {number} options.limit - Number of files to return (max 1000)
     * @param {string} options.delimiter - Delimiter for folder-like listing
     * @returns {Promise<Object>} List result
     */
    static async listFiles(options = {}) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            const { prefix = '', marker = '', limit = 1000, delimiter = '' } = options;

            return new Promise((resolve, reject) => {
                this.bucketManager.listPrefix(this.config.bucket, { prefix, marker, limit, delimiter }, (err, ret, info) => {
                    if (err) {
                        this.logger.error('List files failed', { error: err.message, options });
                        reject(new Error(`List files failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            items: ret.items || [],
                            marker: ret.marker || '',
                            commonPrefixes: ret.commonPrefixes || [],
                            hasMore: !!ret.marker
                        };

                        this.logger.info('Files listed successfully', {
                            count: result.items.length,
                            hasMore: result.hasMore,
                            prefix
                        });

                        resolve(result);
                    } else {
                        this.logger.error('List files failed with status', {
                            statusCode: info.statusCode,
                            options
                        });
                        reject(new Error(`List files failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error listing files', { error: error.message, options });
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Get public URL for file
     * 获取文件的公开访问URL
     * @param {string} key - File key
     * @param {Object} options - URL options
     * @param {string} options.domain - Custom domain (optional)
     * @param {boolean} options.useHttps - Use HTTPS (optional)
     * @returns {string} Public URL
     */
    static getPublicUrl(key, options = {}) {
        try {
            if (!this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            const domain = options.domain || this.config.domain;
            if (!domain) {
                throw new Error('Domain not configured. Please set domain in init() or options.');
            }

            const useHttps = options.useHttps !== undefined ? options.useHttps : this.config.useHttps;
            const protocol = useHttps ? 'https' : 'http';
            const url = `${protocol}://${domain}/${key}`;

            this.logger.info('Public URL generated', { key, domain, useHttps });
            return url;
        } catch (error) {
            this.logger.error('Error generating public URL', { error: error.message, key });
            throw new Error(`Failed to generate public URL: ${error.message}`);
        }
    }

    /**
     * Generate private download URL
     * 生成私有下载URL
     * @param {string} key - File key
     * @param {Object} options - URL options
     * @param {number} options.expires - URL expiration in seconds (default: 3600)
     * @param {string} options.domain - Custom domain (optional)
     * @param {boolean} options.useHttps - Use HTTPS (optional)
     * @returns {string} Private download URL
     */
    static generatePrivateUrl(key, options = {}) {
        try {
            if (!this.mac || !this.config) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!key) {
                throw new Error('File key is required');
            }

            const { expires = 3600, domain, useHttps } = options;
            const baseUrl = this.getPublicUrl(key, { domain, useHttps });

            const deadline = Math.floor(Date.now() / 1000) + expires;
            const privateUrl = qiniu.util.generateAccessToken(this.mac, baseUrl, deadline);

            this.logger.info('Private URL generated', { key, expires, deadline });
            return privateUrl;
        } catch (error) {
            this.logger.error('Error generating private URL', { error: error.message, key });
            throw new Error(`Failed to generate private URL: ${error.message}`);
        }
    }

    /**
     * Batch operations
     * 批量操作
     * @param {Array} operations - Array of operations
     * @returns {Promise<Object>} Batch result
     */
    static async batchOperations(operations) {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            if (!Array.isArray(operations) || operations.length === 0) {
                throw new Error('Operations array is required');
            }

            if (operations.length > 1000) {
                throw new Error('Maximum 1000 operations allowed per batch');
            }

            return new Promise((resolve, reject) => {
                this.bucketManager.batch(operations, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Batch operations failed', { error: err.message, operationCount: operations.length });
                        reject(new Error(`Batch operations failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            results: ret || [],
                            operationCount: operations.length
                        };

                        this.logger.info('Batch operations completed', {
                            operationCount: operations.length,
                            successCount: result.results.filter(r => r.code === 200).length
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Batch operations failed with status', {
                            statusCode: info.statusCode,
                            operationCount: operations.length
                        });
                        reject(new Error(`Batch operations failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error in batch operations', { error: error.message, operationCount: operations.length });
            throw new Error(`Failed to perform batch operations: ${error.message}`);
        }
    }

    /**
     * Get bucket statistics
     * 获取存储桶统计信息
     * @returns {Promise<Object>} Bucket statistics
     */
    static async getBucketStats() {
        try {
            if (!this.bucketManager) {
                throw new Error('Qiniu not initialized. Call init() first.');
            }

            return new Promise((resolve, reject) => {
                this.bucketManager.getBucketInfo(this.config.bucket, (err, ret, info) => {
                    if (err) {
                        this.logger.error('Get bucket stats failed', { error: err.message });
                        reject(new Error(`Get bucket stats failed: ${err.message}`));
                        return;
                    }

                    if (info.statusCode === 200) {
                        const result = {
                            success: true,
                            bucket: ret.bucket,
                            region: ret.region,
                            private: ret.private,
                            createdAt: ret.createdAt,
                            ...ret
                        };

                        this.logger.info('Bucket stats retrieved successfully', {
                            bucket: ret.bucket,
                            region: ret.region
                        });

                        resolve(result);
                    } else {
                        this.logger.error('Get bucket stats failed with status', {
                            statusCode: info.statusCode
                        });
                        reject(new Error(`Get bucket stats failed with status ${info.statusCode}`));
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error getting bucket stats', { error: error.message });
            throw new Error(`Failed to get bucket stats: ${error.message}`);
        }
    }

    /**
 * Check if file exists
 * 检查文件是否存在
 * @param {string} key - File key
 * @returns {Promise<boolean>} True if file exists
 */
    static async fileExists(key) {
        try {
            await this.getFileInfo(key);
            return true;
        } catch (error) {
            if (error.message.includes('status 612') || error.message.includes('File not found')) {
                return false; // File not found
            }
            throw error;
        }
    }

    /**
     * Get file size
     * 获取文件大小
     * @param {string} key - File key
     * @returns {Promise<number>} File size in bytes
     */
    static async getFileSize(key) {
        try {
            const info = await this.getFileInfo(key);
            return info.fsize;
        } catch (error) {
            this.logger.error('Error getting file size', { error: error.message, key });
            throw new Error(`Failed to get file size: ${error.message}`);
        }
    }

    /**
     * Get file MIME type
     * 获取文件MIME类型
     * @param {string} key - File key
     * @returns {Promise<string>} MIME type
     */
    static async getFileMimeType(key) {
        try {
            const info = await this.getFileInfo(key);
            return info.mimeType;
        } catch (error) {
            this.logger.error('Error getting file MIME type', { error: error.message, key });
            throw new Error(`Failed to get file MIME type: ${error.message}`);
        }
    }

    /**
     * Clean up old files
     * 清理旧文件
     * @param {Object} options - Cleanup options
     * @param {string} options.prefix - File prefix filter
     * @param {number} options.daysOld - Delete files older than this many days
     * @param {number} options.limit - Maximum number of files to delete per batch
     * @returns {Promise<Object>} Cleanup result
     */
    static async cleanupOldFiles(options = {}) {
        try {
            const { prefix = '', daysOld = 30, limit = 100 } = options;
            const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
            const cutoffSeconds = Math.floor(cutoffTime / 1000);

            let marker = '';
            let totalDeleted = 0;
            let totalProcessed = 0;

            while (true) {
                const listResult = await this.listFiles({ prefix, marker, limit });
                const filesToDelete = listResult.items.filter(file => file.putTime < cutoffSeconds);

                if (filesToDelete.length === 0) {
                    break;
                }

                const deleteOperations = filesToDelete.map(file => ({
                    op: 'delete',
                    bucket: this.config.bucket,
                    key: file.key
                }));

                const batchResult = await this.batchOperations(deleteOperations);
                const deletedCount = batchResult.results.filter(r => r.code === 200).length;

                totalDeleted += deletedCount;
                totalProcessed += filesToDelete.length;

                this.logger.info('Cleanup batch completed', {
                    deleted: deletedCount,
                    total: filesToDelete.length,
                    totalDeleted,
                    totalProcessed
                });

                if (!listResult.hasMore) {
                    break;
                }

                marker = listResult.marker;
            }

            const result = {
                success: true,
                totalDeleted,
                totalProcessed,
                daysOld,
                prefix
            };

            this.logger.info('Cleanup completed', result);
            return result;
        } catch (error) {
            this.logger.error('Error cleaning up old files', { error: error.message, options });
            throw new Error(`Failed to cleanup old files: ${error.message}`);
        }
    }
}

module.exports = QiniuUtil;
