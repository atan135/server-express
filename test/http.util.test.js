// Mock axios module
jest.mock('axios', () => ({
  create: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
}));

// Mock form-data
const mockFormDataInstance = {
  append: jest.fn(),
  getHeaders: jest.fn(() => ({ 'content-type': 'multipart/form-data' }))
};

jest.mock('form-data', () => {
  return jest.fn(() => mockFormDataInstance);
});

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  statSync: jest.fn()
}));

// Mock logger middleware
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

const HttpUtil = require('../src/utils/http.util');

// Get mocked modules
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

describe('HttpUtil', () => {
  let mockInstance;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset FormData mock
    mockFormDataInstance.append.mockClear();
    mockFormDataInstance.getHeaders.mockReturnValue({ 'content-type': 'multipart/form-data' });
    
    // Create mock axios instance
    mockInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    axios.create.mockReturnValue(mockInstance);

    // Create mock response
    mockResponse = {
      data: { success: true, message: 'Test response' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { method: 'GET', url: 'https://api.example.com/test' }
    };

    // Set default mock responses
    mockInstance.get.mockResolvedValue(mockResponse);
    mockInstance.post.mockResolvedValue(mockResponse);
    mockInstance.put.mockResolvedValue(mockResponse);
    mockInstance.patch.mockResolvedValue(mockResponse);
    mockInstance.delete.mockResolvedValue(mockResponse);
    mockInstance.head.mockResolvedValue(mockResponse);
    mockInstance.options.mockResolvedValue(mockResponse);
    mockInstance.request.mockResolvedValue(mockResponse);

    // Mock fs methods
    fs.existsSync.mockImplementation((path) => {
      // Return true for specific test paths, false for directories
      if (path === '/path/to/file.txt' || path === '/path/to/document.pdf') {
        return true;
      }
      return false; // Directory doesn't exist initially
    });
    fs.mkdirSync.mockImplementation(() => {});
    fs.createReadStream.mockReturnValue({ path: '/test/file.txt' });
    fs.createWriteStream.mockReturnValue({
      pipe: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return fs.createWriteStream();
      })
    });
    fs.statSync.mockReturnValue({ size: 1024 });
  });

  describe('Configuration', () => {
    test('should have default configuration', () => {
      expect(HttpUtil.defaultConfig).toHaveProperty('timeout', 30000);
      expect(HttpUtil.defaultConfig).toHaveProperty('maxRedirects', 5);
      expect(HttpUtil.defaultConfig).toHaveProperty('headers');
      expect(HttpUtil.defaultConfig).toHaveProperty('validateStatus');
    });

    test('should create instance with custom config', () => {
      const customConfig = { timeout: 60000, baseURL: 'https://api.example.com' };
      HttpUtil.createInstance(customConfig);
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
          baseURL: 'https://api.example.com'
        })
      );
    });

    test('should set default headers', () => {
      const newHeaders = { 'Authorization': 'Bearer token', 'X-Custom': 'value' };
      HttpUtil.setDefaultHeaders(newHeaders);
      
      expect(HttpUtil.defaultConfig.headers).toMatchObject(newHeaders);
    });

    test('should set default timeout', () => {
      HttpUtil.setDefaultTimeout(45000);
      expect(HttpUtil.defaultConfig.timeout).toBe(45000);
    });

    test('should set default base URL', () => {
      HttpUtil.setDefaultBaseURL('https://api.example.com');
      expect(HttpUtil.defaultConfig.baseURL).toBe('https://api.example.com');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Create instance for each test
      HttpUtil.createInstance();
    });

    test('should make GET request', async () => {
      const result = await HttpUtil.get('https://api.example.com/test');
      
      expect(mockInstance.get).toHaveBeenCalledWith('https://api.example.com/test');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status,
        statusText: mockResponse.statusText
      });
    });

    test('should make POST JSON request', async () => {
      const data = { name: 'test', value: 123 };
      const result = await HttpUtil.postJson('https://api.example.com/test', data);
      
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/test', data);
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make POST form request', async () => {
      const formData = { name: 'test', email: 'test@example.com' };
      const result = await HttpUtil.postForm('https://api.example.com/test', formData);
      
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
      expect(mockFormDataInstance.append).toHaveBeenCalledWith('name', 'test');
      expect(mockFormDataInstance.append).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make POST multipart request', async () => {
      const formData = { name: 'test' };
      const files = { file: '/path/to/file.txt' };
      const result = await HttpUtil.postMultipart('https://api.example.com/upload', formData, files);
      
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/upload', expect.any(Object));
      expect(mockFormDataInstance.append).toHaveBeenCalledWith('name', 'test');
      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.txt');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make PUT request', async () => {
      const data = { id: 1, name: 'updated' };
      const result = await HttpUtil.put('https://api.example.com/test/1', data);
      
      expect(mockInstance.put).toHaveBeenCalledWith('https://api.example.com/test/1', data);
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make PATCH request', async () => {
      const data = { name: 'patched' };
      const result = await HttpUtil.patch('https://api.example.com/test/1', data);
      
      expect(mockInstance.patch).toHaveBeenCalledWith('https://api.example.com/test/1', data);
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make DELETE request', async () => {
      const result = await HttpUtil.delete('https://api.example.com/test/1');
      
      expect(mockInstance.delete).toHaveBeenCalledWith('https://api.example.com/test/1');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make HEAD request', async () => {
      const result = await HttpUtil.head('https://api.example.com/test');
      
      expect(mockInstance.head).toHaveBeenCalledWith('https://api.example.com/test');
      expect(result).toMatchObject({
        status: mockResponse.status,
        headers: mockResponse.headers
      });
    });

    test('should make OPTIONS request', async () => {
      const result = await HttpUtil.options('https://api.example.com/test');
      
      expect(mockInstance.options).toHaveBeenCalledWith('https://api.example.com/test');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should make custom method request', async () => {
      const data = { custom: 'data' };
      const result = await HttpUtil.request('CUSTOM', 'https://api.example.com/test', data);
      
      expect(mockInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'custom',
          url: 'https://api.example.com/test',
          data
        })
      );
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });
  });

  describe('Concurrent Requests', () => {
    test('should make multiple requests concurrently', async () => {
      const requests = [
        { method: 'GET', url: 'https://api.example.com/test1' },
        { method: 'POST', url: 'https://api.example.com/test2', data: { test: 'data' } },
        { method: 'PUT', url: 'https://api.example.com/test3', data: { update: 'data' } }
      ];

      const results = await HttpUtil.all(requests);
      
      expect(results).toHaveLength(3);
      expect(mockInstance.request).toHaveBeenCalledTimes(3);
      results.forEach(result => {
        expect(result).toMatchObject({
          data: mockResponse.data,
          status: mockResponse.status
        });
      });
    });
  });

  describe('Retry Logic', () => {
    test('should retry failed requests', async () => {
      const mockRequestFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      const result = await HttpUtil.retry(mockRequestFn, { maxRetries: 3, delay: 100 });
      
      expect(mockRequestFn).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    test('should not retry on client errors (4xx)', async () => {
      const error = new Error('Client error');
      error.response = { status: 400 };
      
      const mockRequestFn = jest.fn().mockRejectedValue(error);

      await expect(HttpUtil.retry(mockRequestFn, { maxRetries: 3 }))
        .rejects.toThrow('Client error');
      
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });

    test('should respect custom retry logic', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue(new Error('Custom error'));
      const shouldRetry = jest.fn().mockReturnValue(false);

      await expect(HttpUtil.retry(mockRequestFn, { shouldRetry }))
        .rejects.toThrow('Custom error');
      
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    test('should download file', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn()
      };
      
      mockInstance.get.mockResolvedValue({
        ...mockResponse,
        data: mockStream
      });

      const result = await HttpUtil.download('https://example.com/file.txt', '/downloads/file.txt');
      
      expect(mockInstance.get).toHaveBeenCalledWith('https://example.com/file.txt');
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(result).toMatchObject({
        success: true,
        destination: '/downloads/file.txt'
      });
    });

    test('should upload file', async () => {
      const result = await HttpUtil.upload(
        'https://api.example.com/upload',
        '/path/to/file.txt',
        'file',
        { name: 'test' }
      );
      
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file.txt');
      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.txt');
      expect(result).toMatchObject({
        data: mockResponse.data,
        status: mockResponse.status
      });
    });

    test('should handle file not found during upload', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(HttpUtil.upload(
        'https://api.example.com/upload',
        '/nonexistent/file.txt'
      )).rejects.toThrow('File not found: /nonexistent/file.txt');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      HttpUtil.createInstance();
    });

    test('should handle GET request errors', async () => {
      const error = new Error('Network error');
      mockInstance.get.mockRejectedValue(error);

      await expect(HttpUtil.get('https://api.example.com/test'))
        .rejects.toThrow('Network error');
    });

    test('should handle POST JSON request errors', async () => {
      const error = new Error('Server error');
      mockInstance.post.mockRejectedValue(error);

      await expect(HttpUtil.postJson('https://api.example.com/test', {}))
        .rejects.toThrow('Server error');
    });

    test('should handle form data with null values', async () => {
      const formData = { name: 'test', email: null, age: undefined };
      await HttpUtil.postForm('https://api.example.com/test', formData);
      
      expect(mockFormDataInstance.append).toHaveBeenCalledWith('name', 'test');
      expect(mockFormDataInstance.append).not.toHaveBeenCalledWith('email', null);
      expect(mockFormDataInstance.append).not.toHaveBeenCalledWith('age', undefined);
    });

    test('should handle multipart with buffer files', async () => {
      const buffer = Buffer.from('test data');
      const files = { file: buffer };
      
      await HttpUtil.postMultipart('https://api.example.com/upload', {}, files);
      
      expect(mockFormDataInstance.append).toHaveBeenCalledWith('file', buffer, { filename: 'file.dat' });
    });
  });

  describe('Interceptors', () => {
    test('should add request interceptor', () => {
      const onFulfilled = jest.fn();
      const onRejected = jest.fn();
      
      HttpUtil.addRequestInterceptor(onFulfilled, onRejected);
      
      expect(axios.interceptors.request.use).toHaveBeenCalledWith(onFulfilled, onRejected);
    });

    test('should add response interceptor', () => {
      const onFulfilled = jest.fn();
      const onRejected = jest.fn();
      
      HttpUtil.addResponseInterceptor(onFulfilled, onRejected);
      
      expect(axios.interceptors.response.use).toHaveBeenCalledWith(onFulfilled, onRejected);
    });

    test('should remove request interceptor', () => {
      const id = 123;
      HttpUtil.removeRequestInterceptor(id);
      
      expect(axios.interceptors.request.eject).toHaveBeenCalledWith(id);
    });

    test('should remove response interceptor', () => {
      const id = 456;
      HttpUtil.removeResponseInterceptor(id);
      
      expect(axios.interceptors.response.eject).toHaveBeenCalledWith(id);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      HttpUtil.createInstance();
    });

    test('should handle empty form data', async () => {
      await HttpUtil.postForm('https://api.example.com/test', {});
      
      expect(mockFormDataInstance.append).not.toHaveBeenCalled();
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
    });

    test('should handle empty multipart data', async () => {
      await HttpUtil.postMultipart('https://api.example.com/test', {}, {});
      
      expect(mockFormDataInstance.append).not.toHaveBeenCalled();
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
    });

    test('should handle custom request configuration', async () => {
      const customConfig = {
        headers: { 'X-Custom': 'value' },
        timeout: 60000,
        auth: { username: 'user', password: 'pass' }
      };

      await HttpUtil.get('https://api.example.com/test', customConfig);
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining(customConfig)
      );
    });

    test('should handle response without data', async () => {
      const responseWithoutData = {
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: { method: 'DELETE', url: 'https://api.example.com/test' }
      };

      mockInstance.delete.mockResolvedValue(responseWithoutData);
      
      const result = await HttpUtil.delete('https://api.example.com/test');
      
      expect(result).toMatchObject({
        status: 204,
        statusText: 'No Content'
      });
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete HTTP workflow', async () => {
      // Set default configuration
      HttpUtil.setDefaultHeaders({ 'X-API-Key': 'test-key' });
      HttpUtil.setDefaultTimeout(45000);
      
      // Make various requests
      const getResult = await HttpUtil.get('https://api.example.com/users');
      const postResult = await HttpUtil.postJson('https://api.example.com/users', { name: 'John' });
      const putResult = await HttpUtil.put('https://api.example.com/users/1', { name: 'John Updated' });
      const deleteResult = await HttpUtil.delete('https://api.example.com/users/1');
      
      // Verify all requests were made
      expect(mockInstance.get).toHaveBeenCalledWith('https://api.example.com/users');
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/users', { name: 'John' });
      expect(mockInstance.put).toHaveBeenCalledWith('https://api.example.com/users/1', { name: 'John Updated' });
      expect(mockInstance.delete).toHaveBeenCalledWith('https://api.example.com/users/1');
      
      // Verify all responses have expected structure
      [getResult, postResult, putResult, deleteResult].forEach(result => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('headers');
      });
    });

    test('should handle file upload workflow', async () => {
      // Upload file
      const uploadResult = await HttpUtil.upload(
        'https://api.example.com/upload',
        '/path/to/document.pdf',
        'document',
        { title: 'Test Document', category: 'pdf' }
      );
      
      // Verify file operations
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/document.pdf');
      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/document.pdf');
      
      // Verify form data was created (the order might vary due to object spread)
      // The upload method calls postMultipart with formData as the third parameter
      // Verify the total number of form data fields
      expect(mockFormDataInstance.append).toHaveBeenCalledTimes(3);
      
      // Verify the basic structure of the calls
      const calls = mockFormDataInstance.append.mock.calls;
      expect(calls).toHaveLength(3);
      expect(calls[0][0]).toBe('title');
      expect(calls[0][1]).toBe('Test Document');
      expect(calls[1][0]).toBe('category');
      expect(calls[1][1]).toBe('pdf');
      expect(calls[2][0]).toBe('document');
      // The third call should have a file object, but we can't easily test its structure in the mock
      
      // Verify upload request was made
      expect(mockInstance.post).toHaveBeenCalledWith('https://api.example.com/upload', expect.any(Object));
      
      // Verify response structure
      expect(uploadResult).toHaveProperty('data');
      expect(uploadResult).toHaveProperty('status');
    });
  });
});
