# HTTP Utility Documentation

## Overview

The `HttpUtil` class provides a comprehensive interface for making HTTP requests using Axios. It offers methods for all HTTP methods, form handling, file operations, retry logic, and concurrent requests with proper error handling and logging.

## Features

### HTTP Methods
- **GET**: Simple GET requests
- **POST**: POST requests with JSON, form data, or multipart form data
- **PUT**: Update resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources
- **HEAD**: Get response headers only
- **OPTIONS**: Get available methods
- **Custom Methods**: Support for any HTTP method

### Data Handling
- **JSON**: Automatic JSON serialization/deserialization
- **Form Data**: URL-encoded form submissions
- **Multipart**: File uploads with form data
- **Custom Headers**: Configurable request headers
- **Streaming**: File download and upload support

### Advanced Features
- **Retry Logic**: Automatic retry with configurable options
- **Concurrent Requests**: Make multiple requests simultaneously
- **Interceptors**: Request and response interceptors
- **Configuration Management**: Global and per-request configuration
- **Error Handling**: Comprehensive error handling and logging

## Test Coverage

The test suite covers:
- **Configuration**: 5 test cases
- **HTTP Methods**: 10 test cases
- **Concurrent Requests**: 1 test case
- **Retry Logic**: 3 test cases
- **File Operations**: 3 test cases
- **Error Handling**: 4 test cases
- **Interceptors**: 4 test cases
- **Edge Cases**: 4 test cases
- **Integration Tests**: 2 test cases

**Total: 36 test cases**

## Usage Examples

### Basic Setup

```javascript
const HttpUtil = require('./src/utils/http.util');

// Set global configuration
HttpUtil.setDefaultHeaders({ 'X-API-Key': 'your-api-key' });
HttpUtil.setDefaultTimeout(45000);
HttpUtil.setDefaultBaseURL('https://api.example.com');
```

### HTTP Methods

#### GET Request
```javascript
// Simple GET request
const response = await HttpUtil.get('https://api.example.com/users');

// GET with custom configuration
const response = await HttpUtil.get('https://api.example.com/users', {
  headers: { 'Authorization': 'Bearer token' },
  timeout: 10000
});

console.log(response.data); // Response data
console.log(response.status); // HTTP status code
console.log(response.headers); // Response headers
```

#### POST JSON Request
```javascript
// POST with JSON data
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const response = await HttpUtil.postJson('https://api.example.com/users', userData);

if (response.status === 201) {
  console.log('User created:', response.data);
}
```

#### POST Form Request
```javascript
// POST with form data
const formData = {
  username: 'johndoe',
  password: 'secret123',
  remember: true
};

const response = await HttpUtil.postForm('https://api.example.com/login', formData);

if (response.status === 200) {
  console.log('Login successful:', response.data);
}
```

#### POST Multipart Request (File Upload)
```javascript
// Upload file with additional form data
const formData = {
  title: 'My Document',
  description: 'Important document'
};

const files = {
  document: '/path/to/document.pdf',
  image: '/path/to/image.jpg'
};

const response = await HttpUtil.postMultipart(
  'https://api.example.com/upload',
  formData,
  files
);

console.log('Upload successful:', response.data);
```

#### PUT Request
```javascript
// Update existing resource
const updateData = {
  name: 'John Updated',
  email: 'john.updated@example.com'
};

const response = await HttpUtil.put('https://api.example.com/users/123', updateData);

if (response.status === 200) {
  console.log('User updated:', response.data);
}
```

#### DELETE Request
```javascript
// Delete resource
const response = await HttpUtil.delete('https://api.example.com/users/123');

if (response.status === 204) {
  console.log('User deleted successfully');
}
```

### File Operations

#### Download File
```javascript
// Download file from URL
const result = await HttpUtil.download(
  'https://example.com/document.pdf',
  '/downloads/document.pdf'
);

if (result.success) {
  console.log(`File downloaded to ${result.destination}`);
  console.log(`File size: ${result.size} bytes`);
}
```

#### Upload File
```javascript
// Upload single file
const result = await HttpUtil.upload(
  'https://api.example.com/upload',
  '/path/to/document.pdf',
  'document',
  { category: 'pdf', tags: 'important' }
);

console.log('Upload successful:', result.data);
```

### Advanced Features

#### Retry Logic
```javascript
// Retry failed requests automatically
const response = await HttpUtil.retry(
  () => HttpUtil.get('https://api.example.com/unreliable-endpoint'),
  {
    maxRetries: 3,
    delay: 1000,
    shouldRetry: (error) => {
      // Custom retry logic
      return error.response?.status >= 500;
    }
  }
);
```

#### Concurrent Requests
```javascript
// Make multiple requests simultaneously
const requests = [
  { method: 'GET', url: 'https://api.example.com/users' },
  { method: 'GET', url: 'https://api.example.com/posts' },
  { method: 'GET', url: 'https://api.example.com/comments' }
];

const results = await HttpUtil.all(requests);

results.forEach((result, index) => {
  console.log(`Request ${index + 1}:`, result.status, result.data);
});
```

#### Custom HTTP Methods
```javascript
// Make custom HTTP method request
const response = await HttpUtil.request(
  'PURGE',
  'https://api.example.com/cache',
  null,
  { headers: { 'X-Cache-Control': 'purge' } }
);
```

### Configuration Management

#### Global Configuration
```javascript
// Set default headers for all requests
HttpUtil.setDefaultHeaders({
  'Authorization': 'Bearer your-token',
  'X-Client-Version': '1.0.0',
  'Accept-Language': 'en-US'
});

// Set default timeout
HttpUtil.setDefaultTimeout(30000);

// Set default base URL
HttpUtil.setDefaultBaseURL('https://api.example.com/v1');
```

#### Per-Request Configuration
```javascript
// Override configuration for specific request
const response = await HttpUtil.get('/users', {
  timeout: 10000,
  headers: { 'X-Special': 'value' },
  auth: { username: 'user', password: 'pass' }
});
```

### Interceptors

#### Request Interceptor
```javascript
// Add request interceptor
const requestId = HttpUtil.addRequestInterceptor(
  (config) => {
    // Add request ID to headers
    config.headers['X-Request-ID'] = generateRequestId();
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Remove interceptor later
HttpUtil.removeRequestInterceptor(requestId);
```

#### Response Interceptor
```javascript
// Add response interceptor
const responseId = HttpUtil.addResponseInterceptor(
  (response) => {
    // Log response time
    console.log(`Response time: ${Date.now() - response.config.startTime}ms`);
    return response;
  },
  (error) => {
    // Handle specific error types
    if (error.response?.status === 401) {
      // Redirect to login
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

## Configuration Options

### Default Configuration
```javascript
{
  timeout: 30000,                    // Request timeout in milliseconds
  maxRedirects: 5,                   // Maximum redirects to follow
  validateStatus: (status) => status < 500,  // Status validation function
  headers: {                          // Default headers
    'User-Agent': 'HttpUtil/1.0.0',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  }
}
```

### Request Configuration
```javascript
{
  headers: {},                        // Request headers
  timeout: 30000,                    // Request timeout
  baseURL: '',                       // Base URL for requests
  auth: {},                          // Authentication credentials
  params: {},                        // URL parameters
  responseType: 'json',              // Response type
  maxRedirects: 5,                   // Max redirects
  validateStatus: null,              // Status validation
  onUploadProgress: null,            // Upload progress callback
  onDownloadProgress: null           // Download progress callback
}
```

## Error Handling

### Error Types
```javascript
try {
  const response = await HttpUtil.get('https://api.example.com/test');
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Server error:', error.response.status, error.response.data);
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network error:', error.message);
  } else {
    // Error in request setup
    console.error('Request error:', error.message);
  }
}
```

### Custom Error Handling
```javascript
// Handle specific HTTP status codes
const response = await HttpUtil.get('https://api.example.com/test')
  .catch(error => {
    if (error.response?.status === 404) {
      return { data: null, status: 404 };
    }
    throw error;
  });
```

## Performance Considerations

- **Connection Pooling**: Axios handles connection pooling automatically
- **Request Batching**: Use `HttpUtil.all()` for multiple concurrent requests
- **Streaming**: File operations use streams for memory efficiency
- **Timeout Management**: Set appropriate timeouts for different endpoints
- **Retry Logic**: Implement retry for unreliable endpoints

## Security Features

- **HTTPS Support**: Full HTTPS support with certificate validation
- **Authentication**: Support for various authentication methods
- **Header Security**: Automatic content-type and user-agent headers
- **Input Validation**: Form data validation and sanitization
- **Error Sanitization**: Sensitive information is not logged

## Dependencies

- **axios**: HTTP client library
- **form-data**: Form data handling
- **log4js**: Logging middleware

## Running Tests

```bash
# Run all HTTP utility tests
npm test test/http.util.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Important Notes

1. **Async/Await**: All methods return promises and should be awaited
2. **Error Handling**: Always implement proper error handling
3. **File Operations**: Ensure proper file paths and permissions
4. **Memory Management**: Large file uploads/downloads use streams
5. **Configuration**: Set appropriate timeouts for your use case

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout or check network connectivity
2. **File Upload Failures**: Verify file paths and permissions
3. **Authentication Errors**: Check API keys and tokens
4. **Network Errors**: Verify URL and network connectivity
5. **Memory Issues**: Use streams for large files

### Debug Mode

Enable verbose logging by setting the log level:

```javascript
// In your logger configuration
LOG_LEVEL=debug
```

## Contributing

When adding new features to the HTTP utility:

1. Add comprehensive tests for new functionality
2. Update this documentation
3. Follow the existing code style and error handling patterns
4. Ensure proper input validation and sanitization
5. Test with various HTTP endpoints and data types
