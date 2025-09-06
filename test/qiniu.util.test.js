const QiniuUtil = require('../src/utils/qiniu.util');
const fs = require('fs');
const path = require('path');

// Mock the qiniu module
jest.mock('qiniu', () => ({
    auth: {
        digest: {
            Mac: jest.fn()
        }
    },
    conf: {
        Config: jest.fn(() => ({
            zone: 'z0',
            useHttpsDomain: true
        }))
    },
    zone: {
        Z0: 'z0'
    },
    rs: {
        PutPolicy: jest.fn(),
        BucketManager: jest.fn(() => ({
            stat: jest.fn(),
            delete: jest.fn(),
            copy: jest.fn(),
            move: jest.fn(),
            listPrefix: jest.fn(),
            getBucketInfo: jest.fn(),
            download: jest.fn(),
            batch: jest.fn()
        }))
    },
    form_up: {
        FormUploader: jest.fn(() => ({
            put: jest.fn(),
            putFile: jest.fn(),
            putStream: jest.fn()
        })),
        PutExtra: jest.fn()
    },
    util: {
        generateAccessToken: jest.fn()
    }
}));

describe('QiniuUtil', () => {
    const mockConfig = {
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
        bucket: 'test-bucket',
        domain: 'test-domain.com',
        region: 'z0',
        useHttps: true
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset static properties
        QiniuUtil.mac = null;
        QiniuUtil.config = null;
        QiniuUtil.bucketManager = null;
        QiniuUtil.uploadToken = null;
    });

    describe('init', () => {
        test('should initialize Qiniu with valid config', () => {
            const result = QiniuUtil.init(mockConfig);

            expect(result).toBe(true);
            expect(QiniuUtil.config).toEqual(mockConfig);
            expect(QiniuUtil.mac).toBeDefined();
            expect(QiniuUtil.bucketManager).toBeDefined();
        });

        test('should throw error when required config is missing', () => {
            expect(() => {
                QiniuUtil.init({});
            }).toThrow('Access key, secret key, and bucket are required for Qiniu initialization');
        });

        test('should throw error when accessKey is missing', () => {
            expect(() => {
                QiniuUtil.init({
                    secretKey: 'test-secret',
                    bucket: 'test-bucket'
                });
            }).toThrow('Access key, secret key, and bucket are required for Qiniu initialization');
        });
    });

    describe('generateUploadToken', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should generate upload token with default options', () => {
            const mockToken = 'mock-upload-token';
            const mockPutPolicy = {
                uploadToken: jest.fn().mockReturnValue(mockToken)
            };
            require('qiniu').rs.PutPolicy.mockImplementation(() => mockPutPolicy);

            const result = QiniuUtil.generateUploadToken();

            expect(result).toBe(mockToken);
            expect(QiniuUtil.uploadToken).toBe(mockToken);
        });

        test('should generate upload token with custom options', () => {
            const mockToken = 'mock-upload-token';
            const mockPutPolicy = {
                uploadToken: jest.fn().mockReturnValue(mockToken)
            };
            require('qiniu').rs.PutPolicy.mockImplementation(() => mockPutPolicy);

            const options = {
                key: 'test-file.jpg',
                expires: 7200,
                policy: { returnBody: '{"key":"$(key)"}' }
            };

            const result = QiniuUtil.generateUploadToken(options);

            expect(result).toBe(mockToken);
            expect(require('qiniu').rs.PutPolicy).toHaveBeenCalledWith({
                scope: 'test-bucket:test-file.jpg',
                expires: 7200,
                returnBody: '{"key":"$(key)"}'
            });
        });

        test('should throw error when not initialized', () => {
            QiniuUtil.mac = null;
            QiniuUtil.config = null;

            expect(() => {
                QiniuUtil.generateUploadToken();
            }).toThrow('Qiniu not initialized. Call init() first.');
        });
    });

    describe('uploadBuffer', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should upload buffer successfully', async () => {
            const mockBuffer = Buffer.from('test data');
            const mockKey = 'test-file.txt';
            const mockResponse = {
                key: mockKey,
                hash: 'mock-hash',
                fsize: mockBuffer.length,
                mimeType: 'text/plain'
            };

            const mockFormUploader = {
                put: jest.fn((token, key, buffer, extra, callback) => {
                    callback(null, mockResponse, { statusCode: 200 });
                })
            };
            require('qiniu').form_up.FormUploader.mockImplementation(() => mockFormUploader);

            const result = await QiniuUtil.uploadBuffer(mockBuffer, mockKey);

            expect(result.success).toBe(true);
            expect(result.key).toBe(mockKey);
            expect(result.hash).toBe('mock-hash');
            expect(result.fsize).toBe(mockBuffer.length);
            expect(result.url).toContain('test-domain.com');
        });

        test('should throw error when buffer is not provided', async () => {
            await expect(QiniuUtil.uploadBuffer(null, 'test-key')).rejects.toThrow('Buffer is required for upload');
        });

        test('should throw error when key is not provided', async () => {
            const mockBuffer = Buffer.from('test data');
            await expect(QiniuUtil.uploadBuffer(mockBuffer, '')).rejects.toThrow('File key is required');
        });
    });

    describe('uploadFile', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should upload file successfully', async () => {
            const mockFilePath = 'test-file.txt';
            const mockKey = 'uploaded-file.txt';
            const mockResponse = {
                key: mockKey,
                hash: 'mock-hash',
                fsize: 100,
                mimeType: 'text/plain'
            };

            // Mock fs.existsSync
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            const mockFormUploader = {
                putFile: jest.fn((token, key, filePath, extra, callback) => {
                    callback(null, mockResponse, { statusCode: 200 });
                })
            };
            require('qiniu').form_up.FormUploader.mockImplementation(() => mockFormUploader);

            const result = await QiniuUtil.uploadFile(mockFilePath, mockKey);

            expect(result.success).toBe(true);
            expect(result.key).toBe(mockKey);
            expect(result.url).toContain('test-domain.com');
        });

        test('should throw error when file does not exist', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            await expect(QiniuUtil.uploadFile('nonexistent.txt')).rejects.toThrow('File not found: nonexistent.txt');
        });
    });

    describe('getFileInfo', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should get file info successfully', async () => {
            const mockKey = 'test-file.txt';
            const mockResponse = {
                key: mockKey,
                fsize: 100,
                hash: 'mock-hash',
                mimeType: 'text/plain',
                putTime: 1234567890
            };

            const mockBucketManager = {
                stat: jest.fn((bucket, key, callback) => {
                    callback(null, mockResponse, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.getFileInfo(mockKey);

            expect(result.success).toBe(true);
            expect(result.key).toBe(mockKey);
            expect(result.fsize).toBe(100);
            expect(result.url).toContain('test-domain.com');
        });

        test('should throw error when key is not provided', async () => {
            await expect(QiniuUtil.getFileInfo('')).rejects.toThrow('File key is required');
        });
    });

    describe('deleteFile', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should delete file successfully', async () => {
            const mockKey = 'test-file.txt';

            const mockBucketManager = {
                delete: jest.fn((bucket, key, callback) => {
                    callback(null, {}, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.deleteFile(mockKey);

            expect(result.success).toBe(true);
            expect(result.key).toBe(mockKey);
        });
    });

    describe('getPublicUrl', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should generate public URL with default config', () => {
            const key = 'test-file.jpg';
            const url = QiniuUtil.getPublicUrl(key);

            expect(url).toBe('https://test-domain.com/test-file.jpg');
        });

        test('should generate public URL with custom options', () => {
            const key = 'test-file.jpg';
            const options = {
                domain: 'custom-domain.com',
                useHttps: false
            };
            const url = QiniuUtil.getPublicUrl(key, options);

            expect(url).toBe('http://custom-domain.com/test-file.jpg');
        });

        test('should throw error when domain is not configured', () => {
            QiniuUtil.config.domain = '';

            expect(() => {
                QiniuUtil.getPublicUrl('test-file.jpg');
            }).toThrow('Domain not configured. Please set domain in init() or options.');
        });
    });

    describe('generatePrivateUrl', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should generate private URL', () => {
            const key = 'test-file.jpg';
            const mockPrivateUrl = 'https://test-domain.com/test-file.jpg?token=mock-token';

            require('qiniu').util.generateAccessToken.mockReturnValue(mockPrivateUrl);

            const result = QiniuUtil.generatePrivateUrl(key, { expires: 3600 });

            expect(result).toBe(mockPrivateUrl);
            expect(require('qiniu').util.generateAccessToken).toHaveBeenCalled();
        });
    });

    describe('listFiles', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should list files successfully', async () => {
            const mockResponse = {
                items: [
                    { key: 'file1.txt', fsize: 100, hash: 'hash1' },
                    { key: 'file2.txt', fsize: 200, hash: 'hash2' }
                ],
                marker: 'next-marker'
            };

            const mockBucketManager = {
                listPrefix: jest.fn((bucket, options, callback) => {
                    callback(null, mockResponse, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.listFiles({ prefix: 'test/', limit: 10 });

            expect(result.success).toBe(true);
            expect(result.items).toHaveLength(2);
            expect(result.hasMore).toBe(true);
        });
    });

    describe('fileExists', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should return true when file exists', async () => {
            const mockBucketManager = {
                stat: jest.fn((bucket, key, callback) => {
                    callback(null, { key: 'test.txt' }, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.fileExists('test.txt');
            expect(result).toBe(true);
        });

        test('should return false when file does not exist', async () => {
            const mockBucketManager = {
                stat: jest.fn((bucket, key, callback) => {
                    const error = new Error('File not found');
                    callback(error, null, { statusCode: 612 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.fileExists('nonexistent.txt');
            expect(result).toBe(false);
        });
    });

    describe('getFileSize', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should get file size successfully', async () => {
            const mockBucketManager = {
                stat: jest.fn((bucket, key, callback) => {
                    callback(null, { key: 'test.txt', fsize: 1024 }, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.getFileSize('test.txt');
            expect(result).toBe(1024);
        });
    });

    describe('getFileMimeType', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should get file MIME type successfully', async () => {
            const mockBucketManager = {
                stat: jest.fn((bucket, key, callback) => {
                    callback(null, { key: 'test.jpg', mimeType: 'image/jpeg' }, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.getFileMimeType('test.jpg');
            expect(result).toBe('image/jpeg');
        });
    });

    describe('batchOperations', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should perform batch operations successfully', async () => {
            const operations = [
                { op: 'delete', key: 'file1.txt' },
                { op: 'delete', key: 'file2.txt' }
            ];

            const mockResponse = [
                { code: 200, data: {} },
                { code: 200, data: {} }
            ];

            const mockBucketManager = {
                batch: jest.fn((ops, callback) => {
                    callback(null, mockResponse, { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.batchOperations(operations);

            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(2);
            expect(result.operationCount).toBe(2);
        });

        test('should throw error when operations array is empty', async () => {
            await expect(QiniuUtil.batchOperations([])).rejects.toThrow('Operations array is required');
        });

        test('should throw error when too many operations', async () => {
            const operations = new Array(1001).fill({ op: 'delete', key: 'file.txt' });
            await expect(QiniuUtil.batchOperations(operations)).rejects.toThrow('Maximum 1000 operations allowed per batch');
        });
    });

    describe('cleanupOldFiles', () => {
        beforeEach(() => {
            QiniuUtil.init(mockConfig);
        });

        test('should cleanup old files successfully', async () => {
            const oldTime = Math.floor((Date.now() - 40 * 24 * 60 * 60 * 1000) / 1000); // 40 days ago
            const recentTime = Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000); // 10 days ago

            const mockFiles = [
                { key: 'old-file1.txt', putTime: oldTime },
                { key: 'old-file2.txt', putTime: oldTime },
                { key: 'recent-file.txt', putTime: recentTime }
            ];

            const mockBucketManager = {
                listPrefix: jest.fn((bucket, options, callback) => {
                    callback(null, { items: mockFiles, marker: '' }, { statusCode: 200 });
                }),
                batch: jest.fn((ops, callback) => {
                    // Verify the operations are in the correct format
                    expect(ops).toHaveLength(2);
                    expect(ops[0]).toEqual({
                        op: 'delete',
                        bucket: 'test-bucket',
                        key: 'old-file1.txt'
                    });
                    expect(ops[1]).toEqual({
                        op: 'delete',
                        bucket: 'test-bucket',
                        key: 'old-file2.txt'
                    });
                    callback(null, [{ code: 200 }, { code: 200 }], { statusCode: 200 });
                })
            };
            QiniuUtil.bucketManager = mockBucketManager;

            const result = await QiniuUtil.cleanupOldFiles({ daysOld: 30 });

            expect(result.success).toBe(true);
            expect(result.totalDeleted).toBe(2);
            expect(result.totalProcessed).toBe(2);
        });
    });
});
