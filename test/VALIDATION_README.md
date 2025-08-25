# Validation Middleware Documentation

## Overview

The Validation Middleware provides comprehensive input validation and sanitization for your Express.js API endpoints using `express-validator`.

## Features

- **Input Validation**: String, email, password, username, numeric, date, URL, phone, UUID, array validation
- **Data Sanitization**: Automatic string trimming and email normalization
- **Pre-built Validation Chains**: User registration, login, updates, pagination, search, date ranges
- **Parameter Validation**: ID and UUID parameter validation
- **Query Validation**: Pagination, search, and date range query validation
- **Error Handling**: Centralized validation error handling with formatted responses

## Installation

```bash
npm install express-validator
```

## Usage

### Basic Setup

```javascript
const { 
  validationChains, 
  handleValidationErrors, 
  sanitizeRequest 
} = require('../middleware/validation.middleware');

// Apply sanitization globally
app.use(sanitizeRequest);
```

### Using Pre-built Validation Chains

#### User Registration
```javascript
app.post('/auth/register', 
  validationChains.userRegistration(),
  handleValidationErrors,
  authController.register
);
```

#### User Login
```javascript
app.post('/auth/login', 
  validationChains.userLogin(),
  handleValidationErrors,
  authController.login
);
```

#### Pagination
```javascript
app.get('/posts', 
  validationChains.pagination(),
  handleValidationErrors,
  postController.list
);
```

### Custom Validation

```javascript
const { commonValidators, body } = require('../middleware/validation.middleware');

app.post('/products', [
  commonValidators.string('name', 1, 100),
  commonValidators.integer('price', 0),
  body('category').isIn(['electronics', 'clothing', 'books']),
  handleValidationErrors
], productController.create);
```

## Error Response Format

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## Testing

```bash
# Run validation tests
npm test -- validation.middleware.test.js

# Run all tests
npm test
```

## Best Practices

1. **Order Matters**: Place validation before route handlers
2. **Use Pre-built Chains**: Leverage existing validation chains
3. **Apply Sanitization Globally**: Use `sanitizeRequest` for all requests
4. **Always Include Error Handler**: Use `handleValidationErrors` after validation rules
5. **Custom Validation**: Use custom validators for business logic

## Dependencies

- express-validator
- express
- logger.middleware
