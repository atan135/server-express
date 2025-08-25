const axios = require('axios');
const FormData = require('form-data');
const { logger } = require("../middleware/logger.middleware");

class HttpUtil {
  static logger = logger("http");

  /**
   * Default configuration for Axios
   */
  static defaultConfig = {
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500, // Don't reject if status is less than 500
    headers: {
      'User-Agent': 'HttpUtil/1.0.0',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  };

  /**
   * Create an Axios instance with custom configuration
   * @param {Object} config - Custom configuration
   * @returns {Object} - Axios instance
   */
  static createInstance(config = {}) {
    const instanceConfig = {
      ...this.defaultConfig,
      ...config
    };

    const instance = axios.create(instanceConfig);

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        this.logger.info(`HTTP ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        this.logger.info(`HTTP ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(`HTTP ${error.response.status} ${error.config.method?.toUpperCase()} ${error.config.url}: ${error.message}`);
        } else if (error.request) {
          this.logger.error(`HTTP Request failed: ${error.message}`);
        } else {
          this.logger.error(`HTTP Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Make HTTP GET request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async get(url, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.get(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`GET request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP POST request with JSON data
   * @param {string} url - Request URL
   * @param {Object} data - JSON data to send
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async postJson(url, data = {}, config = {}) {
    try {
      const instance = this.createInstance({
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        }
      });
      
      const response = await instance.post(url, data);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`POST JSON request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP POST request with form data
   * @param {string} url - Request URL
   * @param {Object} formData - Form data object
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async postForm(url, formData = {}, config = {}) {
    try {
      const form = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Buffer) {
            form.append(key, value);
          } else {
            form.append(key, String(value));
          }
        }
      });

      const instance = this.createInstance({
        ...config,
        headers: {
          ...config.headers,
          ...form.getHeaders()
        }
      });
      
      const response = await instance.post(url, form);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`POST Form request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP POST request with multipart form data (file upload)
   * @param {string} url - Request URL
   * @param {Object} formData - Form data object
   * @param {Object} files - Files to upload { fieldName: filePath or Buffer }
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async postMultipart(url, formData = {}, files = {}, config = {}) {
    try {
      const form = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, String(value));
        }
      });

      // Add files
      Object.entries(files).forEach(([fieldName, file]) => {
        if (file) {
          if (typeof file === 'string') {
            // File path
            form.append(fieldName, require('fs').createReadStream(file));
          } else if (Buffer.isBuffer(file)) {
            // Buffer
            form.append(fieldName, file, { filename: `${fieldName}.dat` });
          } else if (file.path) {
            // File object with path
            form.append(fieldName, require('fs').createReadStream(file.path));
          }
        }
      });

      const instance = this.createInstance({
        ...config,
        headers: {
          ...config.headers,
          ...form.getHeaders()
        }
      });
      
      const response = await instance.post(url, form);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`POST Multipart request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Data to send
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async put(url, data = {}, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.put(url, data);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`PUT request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Data to send
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async patch(url, data = {}, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.patch(url, data);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`PATCH request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP DELETE request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async delete(url, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.delete(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`DELETE request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP HEAD request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response headers
   */
  static async head(url, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.head(url);
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`HEAD request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP OPTIONS request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async options(url, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.options(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`OPTIONS request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make HTTP request with custom method
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Data to send
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Response data
   */
  static async request(method, url, data = null, config = {}) {
    try {
      const instance = this.createInstance(config);
      const response = await instance.request({
        method: method.toLowerCase(),
        url,
        data,
        ...config
      });
      
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
    } catch (error) {
      this.logger.error(`${method.toUpperCase()} request failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make multiple HTTP requests concurrently
   * @param {Array} requests - Array of request configurations
   * @returns {Promise<Array>} - Array of responses
   */
  static async all(requests) {
    try {
      const instance = this.createInstance();
      const promises = requests.map(req => {
        const { method, url, data, config } = req;
        return instance.request({
          method: method.toLowerCase(),
          url,
          data,
          ...config
        });
      });
      
      const responses = await Promise.all(promises);
      return responses.map(response => ({
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      }));
    } catch (error) {
      this.logger.error('Concurrent requests failed:', error.message);
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {Function} requestFn - Request function to retry
   * @param {Object} options - Retry options
   * @param {number} options.maxRetries - Maximum number of retries
   * @param {number} options.delay - Delay between retries in ms
   * @param {Function} options.shouldRetry - Function to determine if should retry
   * @returns {Promise<Object>} - Response data
   */
  static async retry(requestFn, options = {}) {
    const { maxRetries = 3, delay = 1000, shouldRetry = null } = options;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Check if we should retry
        if (shouldRetry && !shouldRetry(error)) {
          break;
        }

        // Default retry logic: retry on network errors or 5xx status codes
        if (!shouldRetry) {
          if (error.response && error.response.status < 500) {
            break; // Don't retry on client errors (4xx)
          }
        }

        this.logger.warn(`Request attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Download file from URL
   * @param {string} url - File URL
   * @param {string} destination - Destination file path
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Download result
   */
  static async download(url, destination, config = {}) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure destination directory exists
      const dir = path.dirname(destination);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const instance = this.createInstance({
        ...config,
        responseType: 'stream'
      });

      const response = await instance.get(url);
      
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destination);
        
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          resolve({
            success: true,
            destination,
            size: fs.statSync(destination).size,
            status: response.status,
            headers: response.headers
          });
        });
        
        writer.on('error', reject);
        response.data.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Download failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Upload file to URL
   * @param {string} url - Upload URL
   * @param {string} filePath - Path to file to upload
   * @param {string} fieldName - Form field name for file
   * @param {Object} additionalData - Additional form data
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Upload result
   */
  static async upload(url, filePath, fieldName = 'file', additionalData = {}, config = {}) {
    try {
      const fs = require('fs');
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const formData = {
        ...additionalData,
        [fieldName]: fs.createReadStream(filePath)
      };

      return await this.postMultipart(url, formData, {}, config);
    } catch (error) {
      this.logger.error(`Upload failed for ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Set default headers for all requests
   * @param {Object} headers - Headers to set
   */
  static setDefaultHeaders(headers) {
    this.defaultConfig.headers = {
      ...this.defaultConfig.headers,
      ...headers
    };
  }

  /**
   * Set default timeout for all requests
   * @param {number} timeout - Timeout in milliseconds
   */
  static setDefaultTimeout(timeout) {
    this.defaultConfig.timeout = timeout;
  }

  /**
   * Set default base URL for all requests
   * @param {string} baseURL - Base URL
   */
  static setDefaultBaseURL(baseURL) {
    this.defaultConfig.baseURL = baseURL;
  }

  /**
   * Add request interceptor
   * @param {Function} onFulfilled - Success handler
   * @param {Function} onRejected - Error handler
   */
  static addRequestInterceptor(onFulfilled, onRejected) {
    return axios.interceptors.request.use(onFulfilled, onRejected);
  }

  /**
   * Add response interceptor
   * @param {Function} onFulfilled - Success handler
   * @param {Function} onRejected - Error handler
   */
  static addResponseInterceptor(onFulfilled, onRejected) {
    return axios.interceptors.response.use(onFulfilled, onRejected);
  }

  /**
   * Remove request interceptor
   * @param {number} id - Interceptor ID
   */
  static removeRequestInterceptor(id) {
    axios.interceptors.request.eject(id);
  }

  /**
   * Remove response interceptor
   * @param {number} id - Interceptor ID
   */
  static removeResponseInterceptor(id) {
    axios.interceptors.response.eject(id);
  }
}

module.exports = HttpUtil;
