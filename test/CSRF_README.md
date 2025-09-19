# CSRF Protection Implementation

## Overview

This project implements comprehensive Cross-Site Request Forgery (CSRF) protection using a custom middleware built on top of the `csrf` package. CSRF protection prevents malicious websites from making unauthorized requests on behalf of authenticated users.

## Features

- **Token Generation**: Secure CSRF token generation for each session
- **Token Validation**: Comprehensive token verification before processing requests
- **Session Management**: Token storage and cleanup with expiration
- **Multiple Token Sources**: Support for tokens in headers, body, and query parameters
- **Automatic Cleanup**: Expired token cleanup to prevent memory leaks
- **Statistics**: Monitoring and debugging capabilities
- **Frontend Utilities**: Helper functions for client-side integration

## Installation

The CSRF protection is already integrated into the project. Dependencies:

```bash
npm install csrf
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# CSRF Secret (change in production)
CSRF_SECRET=your-csrf-secret-key-change-in-production
```

### Middleware Setup

The CSRF middleware is automatically imported and configured in `src/middleware/csrf.middleware.js`.

## API Endpoints

### 1. Get CSRF Token

**Endpoint:** `GET /api/auth/csrf-token`

**Description:** Generate a new CSRF token for the current session.

**Response:**
```json
{
  "errcode": 0,
  "errmsg": "CSRF token generated successfully",
  "csrfToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "session-123"
}
```

### 2. CSRF Statistics

**Endpoint:** `GET /api/auth/csrf-stats`

**Description:** Get CSRF token statistics (requires authentication).

**Response:**
```json
{
  "errcode": 0,
  "errmsg": "CSRF stats retrieved successfully",
  "stats": {
    "activeTokens": 5,
    "expiredTokens": 2,
    "totalTokens": 7,
    "tokenExpiration": 86400000
  }
}
```

## Usage Examples

### Backend Integration

#### 1. Basic Route Protection

```javascript
const csrfMiddleware = require('./src/middleware/csrf.middleware');

// Protect a route
router.post('/api/sensitive-action', csrfMiddleware.protect(), (req, res) => {
  // Your route logic here
  res.json({ message: 'Action completed successfully' });
});
```

#### 2. Token Generation Endpoint

```javascript
// Add to your routes
router.get('/api/auth/csrf-token', csrfMiddleware.generateTokenEndpoint());
```

#### 3. Manual Token Operations

```javascript
const csrfMiddleware = require('./src/middleware/csrf.middleware');

// Generate token
const sessionId = 'user-session-123';
const token = csrfMiddleware.generateToken(sessionId);

// Verify token
const isValid = csrfMiddleware.verifyToken(sessionId, token);

// Revoke token
csrfMiddleware.revokeToken(sessionId);
```

### Frontend Integration

#### 1. JavaScript/Node.js Client

```javascript
const CSRFUtil = require('./src/utils/csrf.util');

// Get CSRF token
async function getCSRFToken() {
  try {
    const response = await CSRFUtil.getCSRFToken('http://localhost:3000');
    console.log('CSRF Token:', response.csrfToken);
    return response.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
  }
}

// Make authenticated request
async function makeAuthenticatedRequest(url, data, csrfToken) {
  try {
    const response = await CSRFUtil.authenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }, csrfToken);
    
    return await response.json();
  } catch (error) {
    console.error('Error making request:', error);
  }
}
```

#### 2. Browser/HTML Forms

```html
<!-- Include CSRF token in form -->
<form action="/api/auth/login" method="POST">
  <input type="hidden" name="_csrf" value="YOUR_CSRF_TOKEN">
  <input type="text" name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Password">
  <button type="submit">Login</button>
</form>
```

#### 3. AJAX Requests

```javascript
// Get CSRF token first
fetch('/api/auth/csrf-token')
  .then(response => response.json())
  .then(data => {
    const csrfToken = data.csrfToken;
    
    // Make authenticated request
    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        username: 'user',
        password: 'pass'
      })
    });
  });
```

#### 4. React Integration

```jsx
import { useState, useEffect } from 'react';

function LoginForm() {
  const [csrfToken, setCsrfToken] = useState('');
  
  useEffect(() => {
    // Get CSRF token on component mount
    fetch('/api/auth/csrf-token')
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);
  
  const handleSubmit = async (formData) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(formData)
    });
    
    return response.json();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Protected Routes

The following routes are protected with CSRF tokens:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## Token Storage

### Server-Side Storage

Tokens are stored in memory with the following structure:

```javascript
{
  token: "generated-csrf-token",
  createdAt: 1640995200000,
  expiresAt: 1641081600000
}
```

### Client-Side Storage

The `CSRFUtil` provides methods for localStorage integration:

```javascript
// Store token
CSRFUtil.storeTokenInLocalStorage(token, sessionId);

// Retrieve token
const { token, sessionId } = CSRFUtil.getTokenFromLocalStorage();

// Clear token
CSRFUtil.clearTokenFromLocalStorage();
```

## Security Considerations

### 1. Token Expiration

- Tokens expire after 24 hours by default
- Expired tokens are automatically cleaned up
- New tokens must be generated after expiration

### 2. Session Management

- Tokens are tied to session IDs
- Logout revokes the associated CSRF token
- Multiple sessions can have different tokens

### 3. Token Sources

The middleware checks for tokens in the following order:

1. `X-CSRF-Token` header
2. `_csrf` in request body
3. `_csrf` in query parameters

### 4. Safe Methods

The following HTTP methods are exempt from CSRF protection:

- `GET`
- `HEAD`
- `OPTIONS`

### 5. Excluded Paths

Certain paths are excluded from CSRF protection:

- `/api/auth/csrf-token` - Token generation endpoint
- `/api/health` - Health check endpoint

## Error Handling

### Common Error Responses

#### Missing CSRF Token

```json
{
  "errcode": 1,
  "error": "Forbidden",
  "errmsg": "CSRF token missing"
}
```

#### Invalid CSRF Token

```json
{
  "errcode": 1,
  "error": "Forbidden",
  "errmsg": "Invalid CSRF token"
}
```

#### CSRF Protection Error

```json
{
  "errcode": 1,
  "error": "Internal Server Error",
  "errmsg": "CSRF protection error"
}
```

## Testing

Run the CSRF tests:

```bash
npm test csrf.middleware.test.js
```

The test suite covers:

- Token generation and verification
- Middleware protection logic
- Session management
- Error handling
- Statistics and cleanup

## Monitoring and Debugging

### 1. Enable Debug Logging

Set the log level to debug in your logging configuration:

```javascript
// In your logging config
level: 'debug'
```

### 2. Check Token Statistics

```javascript
const stats = csrfMiddleware.getStats();
console.log('Active tokens:', stats.activeTokens);
console.log('Expired tokens:', stats.expiredTokens);
```

### 3. Manual Token Cleanup

```javascript
const cleanedCount = csrfMiddleware.cleanupExpiredTokens();
console.log('Cleaned up tokens:', cleanedCount);
```

## Production Considerations

### 1. Secret Key

- Change the `CSRF_SECRET` in production
- Use a strong, random secret key
- Store securely (environment variables, secret management)

### 2. Token Storage

- Consider using Redis or database for token storage in production
- Implement proper session management
- Handle token cleanup efficiently

### 3. Rate Limiting

- Implement rate limiting for token generation
- Monitor for suspicious token generation patterns
- Set appropriate limits for token requests

### 4. HTTPS

- Always use HTTPS in production
- CSRF tokens should only be transmitted over secure connections
- Implement proper SSL/TLS configuration

## Troubleshooting

### Common Issues

#### 1. "CSRF token missing" Error

**Cause:** Request doesn't include CSRF token
**Solution:** Ensure token is included in headers, body, or query parameters

#### 2. "Invalid CSRF token" Error

**Cause:** Token is expired, invalid, or doesn't match session
**Solution:** Generate a new token and retry the request

#### 3. Token Not Persisting

**Cause:** Session ID not properly maintained
**Solution:** Ensure session management is working correctly

#### 4. Memory Leaks

**Cause:** Expired tokens not being cleaned up
**Solution:** The middleware automatically cleans up expired tokens every hour

## Best Practices

1. **Always generate new tokens** for each session
2. **Include tokens in all state-changing requests** (POST, PUT, DELETE)
3. **Use HTTPS** in production environments
4. **Monitor token usage** and implement rate limiting
5. **Regularly rotate** the CSRF secret key
6. **Test CSRF protection** thoroughly in your application
7. **Document token requirements** for API consumers

## Integration with Other Security Measures

- **Authentication**: CSRF protection works alongside JWT authentication
- **Rate Limiting**: Implement rate limiting for token generation
- **CORS**: Configure CORS properly to work with CSRF protection
- **Session Management**: Ensure proper session handling for token persistence

This CSRF implementation provides robust protection against cross-site request forgery attacks while maintaining ease of use and integration flexibility.
