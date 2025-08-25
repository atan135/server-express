# Validation Middleware Documentation

## Overview

The Validation Middleware provides comprehensive input validation and sanitization for your Express.js API endpoints using `express-validator`. It includes pre-built validation chains for common use cases and flexible individual validators for custom validation needs.

## Features

### 🔒 **Input Validation**
- **String validation** with length constraints
- **Email validation** with normalization
- **Password validation** with complexity requirements
- **Username validation** with format restrictions
- **Numeric validation** (integers, ranges)
- **Date validation** (ISO8601 format)
- **URL validation**
- **Phone number validation**
- **UUID validation**
- **Array validation** with size constraints

### 🧹 **Data Sanitization**
- Automatic string trimming
- Email normalization
- Input cleaning and formatting

### 📋 **Pre-built Validation Chains**
- User registration
- User login
- User update
- Pagination
- Search
- Date ranges
- Parameter validation

### 🎯 **Flexible Validation System**
- Custom validation rules
- Parameter-specific validation
- Query parameter validation
- Comprehensive error handling

## Installation

The middleware is already installed in your project:

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

// Apply sanitization to all requests
app.use(sanitizeRequest);

// Use validation chains in routes
app.post('/register', 
  validationChains.userRegistration(),
  handleValidationErrors,
  userController.register
);
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

#### User Update
```javascript
app.put('/users/:id', 
  validationChains.idParam('id'),
  validationChains.userUpdate(),
  handleValidationErrors,
  userController.update
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

#### Search with Date Range
```javascript
app.get('/posts/search', 
  validationChains.search(),
  validationChains.dateRange(),
  handleValidationErrors,
  postController.search
);
```

### Using Individual Validators

#### Custom Validation Chain
```javascript
const { commonValidators, body } = require('../middleware/validation.middleware');

app.post('/products', [
  commonValidators.string('name', 1, 100),
  commonValidators.string('description', 0, 500),
  commonValidators.integer('price', 0),
  commonValidators.url('website').optional(),
  body('category')
    .isIn(['electronics', 'clothing', 'books'])
    .withMessage('Invalid category'),
  handleValidationErrors
], productController.create);
```

#### Parameter Validation
```javascript
const { paramValidators } = require('../middleware/validation.middleware');

app.get('/users/:id', [
  paramValidators.id('id'),
  handleValidationErrors
], userController.getById);
```

#### Query Validation
```javascript
const { queryValidators } = require('../middleware/validation.middleware');

app.get('/posts', [
  queryValidators.pagination(),
  queryValidators.search(),
  handleValidationErrors
], postController.list);
```

### Custom Validation Rules

#### Custom Field Validation
```javascript
const { body } = require('../middleware/validation.middleware');

app.post('/custom', [
  body('field')
    .custom((value) => {
      // Your custom validation logic
      if (value === 'invalid') {
        throw new Error('Field cannot be invalid');
      }
      return true;
    })
    .withMessage('Custom validation failed'),
  handleValidationErrors
], controller.action);
```

#### Async Custom Validation
```javascript
const { body } = require('../middleware/validation.middleware');

app.post('/async-validation', [
  body('email')
    .custom(async (value) => {
      const user = await UserModel.findByEmail(value);
      if (user) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  handleValidationErrors
], controller.action);
```

## API Reference

### Common Validators

#### `commonValidators.string(field, minLength, maxLength)`
Validates string fields with optional length constraints.

```javascript
commonValidators.string('name', 1, 50)        // 1-50 characters
commonValidators.string('description', 0, 500) // 0-500 characters
commonValidators.string('title')               // 1-255 characters (default)
```

#### `commonValidators.email(field)`
Validates and normalizes email addresses.

```javascript
commonValidators.email('email')        // Uses 'email' as field name
commonValidators.email('userEmail')    // Custom field name
```

#### `commonValidators.password(field, minLength)`
Validates password complexity and length.

```javascript
commonValidators.password('password', 8)  // Minimum 8 characters
commonValidators.password('password')     // Minimum 6 characters (default)
```

#### `commonValidators.username(field)`
Validates username format (alphanumeric, underscores, hyphens).

```javascript
commonValidators.username('username')     // Uses 'username' as field name
commonValidators.username('displayName')  // Custom field name
```

#### `commonValidators.integer(field, min, max)`
Validates integer values with optional range constraints.

```javascript
commonValidators.integer('age')           // Any integer
commonValidators.integer('age', 0)        // Non-negative
commonValidators.integer('age', 0, 120)   // 0-120 range
commonValidators.integer('score', null, 100) // Max 100
```

#### `commonValidators.boolean(field)`
Validates boolean values.

```javascript
commonValidators.boolean('active')
commonValidators.boolean('isPublic')
```

#### `commonValidators.date(field)`
Validates ISO8601 date strings.

```javascript
commonValidators.date('birthDate')
commonValidators.date('expiryDate')
```

#### `commonValidators.url(field)`
Validates URL format.

```javascript
commonValidators.url('website')
commonValidators.url('profileUrl')
```

#### `commonValidators.phone(field)`
Validates phone number format.

```javascript
commonValidators.phone('phone')      // Uses 'phone' as field name
commonValidators.phone('mobile')     // Custom field name
```

#### `commonValidators.uuid(field)`
Validates UUID format.

```javascript
commonValidators.uuid('id')
commonValidators.uuid('sessionId')
```

#### `commonValidators.array(field, minLength, maxLength)`
Validates array fields with size constraints.

```javascript
commonValidators.array('tags')           // Any array
commonValidators.array('tags', 1)        // Non-empty array
commonValidators.array('tags', 1, 10)    // 1-10 items
```

### Parameter Validators

#### `paramValidators.id(paramName)`
Validates numeric ID parameters.

```javascript
paramValidators.id()           // Uses 'id' as parameter name
paramValidators.id('userId')   // Custom parameter name
```

#### `paramValidators.uuid(paramName)`
Validates UUID parameters.

```javascript
paramValidators.uuid()         // Uses 'id' as parameter name
paramValidators.uuid('userId') // Custom parameter name
```

### Query Validators

#### `queryValidators.pagination()`
Validates pagination query parameters.

```javascript
// Validates: page, limit, sort, order
queryValidators.pagination()
```

#### `queryValidators.search()`
Validates search query parameters.

```javascript
// Validates: search term length and format
queryValidators.search()
```

#### `queryValidators.dateRange()`
Validates date range query parameters.

```javascript
// Validates: startDate, endDate, and ensures endDate > startDate
queryValidators.dateRange()
```

### Validation Chains

#### `validationChains.userRegistration()`
Complete validation for user registration.

```javascript
// Validates: username, email, password, confirmPassword
validationChains.userRegistration()
```

#### `validationChains.userLogin()`
Complete validation for user login.

```javascript
// Validates: email, password
validationChains.userLogin()
```

#### `validationChains.userUpdate()`
Complete validation for user updates.

```javascript
// Validates: username, email, phone, bio (all optional)
validationChains.userUpdate()
```

#### `validationChains.pagination()`
Complete validation for pagination.

```javascript
// Validates: page, limit, sort, order
validationChains.pagination()
```

#### `validationChains.search()`
Complete validation for search functionality.

```javascript
// Validates: search term
validationChains.search()
```

#### `validationChains.dateRange()`
Complete validation for date ranges.

```javascript
// Validates: startDate, endDate
validationChains.dateRange()
```

#### `validationChains.idParam(paramName)`
Parameter validation for numeric IDs.

```javascript
validationChains.idParam()           // Uses 'id' as parameter name
validationChains.idParam('userId')   // Custom parameter name
```

#### `validationChains.uuidParam(paramName)`
Parameter validation for UUIDs.

```javascript
validationChains.uuidParam()         // Uses 'id' as parameter name
validationChains.uuidParam('userId') // Custom parameter name
```

### Middleware Functions

#### `handleValidationErrors(req, res, next)`
Handles validation results and returns formatted error responses.

```javascript
// Must be placed after validation rules
app.post('/endpoint', [
  validationRules,
  handleValidationErrors,  // ← Place here
  controller.action
]);
```

#### `sanitizeRequest(req, res, next)`
Sanitizes request data (trims strings, normalizes emails).

```javascript
// Apply globally for all requests
app.use(sanitizeRequest);
```

## Error Response Format

When validation fails, the middleware returns a structured error response:

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long",
      "value": "123"
    }
  ]
}
```

## Testing

### Running Tests

```bash
# Run all validation tests
npm test -- validation.middleware.test.js

# Run with coverage
npm test -- --coverage --testPathPattern=validation.middleware.test.js
```

### Test Coverage

The test suite covers:
- ✅ All common validators
- ✅ Parameter validators
- ✅ Query validators
- ✅ Validation chains
- ✅ Error handling middleware
- ✅ Sanitization middleware
- ✅ Integration scenarios

## Best Practices

### 1. **Order Matters**
Always place validation middleware before your route handlers:

```javascript
app.post('/endpoint', [
  validationRules,           // 1. Validation rules
  handleValidationErrors,    // 2. Error handling
  controller.action          // 3. Route handler
]);
```

### 2. **Use Pre-built Chains**
Leverage existing validation chains for common operations:

```javascript
// Instead of building from scratch
app.post('/register', [
  body('username').isLength({ min: 3, max: 30 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  handleValidationErrors
], controller.register);

// Use pre-built chain
app.post('/register', [
  validationChains.userRegistration(),
  handleValidationErrors
], controller.register);
```

### 3. **Apply Sanitization Globally**
Use `sanitizeRequest` middleware globally for consistent data cleaning:

```javascript
app.use(sanitizationRequest);
```

### 4. **Custom Validation for Business Logic**
Use custom validators for domain-specific validation:

```javascript
body('email')
  .custom(async (value) => {
    const exists = await UserModel.emailExists(value);
    if (exists) {
      throw new Error('Email already registered');
    }
    return true;
  })
```

### 5. **Consistent Error Handling**
Always use `handleValidationErrors` after validation rules:

```javascript
app.post('/endpoint', [
  validationRules,
  handleValidationErrors,  // ← Don't forget this!
  controller.action
]);
```

## Examples

### Complete User Management API

```javascript
const express = require('express');
const router = express.Router();
const { 
  validationChains, 
  handleValidationErrors 
} = require('../middleware/validation.middleware');

// User registration
router.post('/register', 
  validationChains.userRegistration(),
  handleValidationErrors,
  userController.register
);

// User login
router.post('/login', 
  validationChains.userLogin(),
  handleValidationErrors,
  userController.login
);

// Get user by ID
router.get('/:id', 
  validationChains.idParam('id'),
  handleValidationErrors,
  userController.getById
);

// Update user
router.put('/:id', 
  validationChains.idParam('id'),
  validationChains.userUpdate(),
  handleValidationErrors,
  userController.update
);

// List users with pagination
router.get('/', 
  validationChains.pagination(),
  handleValidationErrors,
  userController.list
);

module.exports = router;
```

### Product Management with Custom Validation

```javascript
const { 
  commonValidators, 
  body, 
  handleValidationErrors 
} = require('../middleware/validation.middleware');

router.post('/products', [
  commonValidators.string('name', 1, 100),
  commonValidators.string('description', 0, 1000),
  commonValidators.integer('price', 0),
  commonValidators.integer('stock', 0),
  commonValidators.url('imageUrl').optional(),
  body('category')
    .isIn(['electronics', 'clothing', 'books', 'home'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with 0-10 items'),
  handleValidationErrors
], productController.create);
```

## Dependencies

- **express-validator**: Core validation library
- **express**: Web framework
- **logger.middleware**: Logging functionality

## Notes

- All validators return Express middleware functions
- Validation chains are arrays of validators
- Error handling is centralized and consistent
- Sanitization is applied automatically
- Custom validation supports async operations
- Comprehensive test coverage included

## Support

For issues or questions about the validation middleware, check the test files for usage examples or refer to the [express-validator documentation](https://express-validator.github.io/docs/).
