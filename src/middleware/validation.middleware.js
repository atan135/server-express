const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('./logger.middleware');

const validationLogger = logger("validation");

/**
 * Common validation rules for different data types
 */
const commonValidators = {
  // String validators
  string: (field, minLength = 1, maxLength = 255) =>
    body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`),

  // Email validator
  email: (field = 'email') =>
    body(field)
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),

  // Password validator
  password: (field = 'password', minLength = 6) =>
    body(field)
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters long`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Username validator
  username: (field = 'username') =>
    body(field)
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  // Numeric validators
  integer: (field, min = null, max = null) => {
    let validator = body(field).isInt({ min, max });
    if (min !== null && max !== null) {
      validator = validator.withMessage(`${field} must be between ${min} and ${max}`);
    } else if (min !== null) {
      validator = validator.withMessage(`${field} must be at least ${min}`);
    } else if (max !== null) {
      validator = validator.withMessage(`${field} must be no more than ${max}`);
    }
    return validator;
  },

  // Boolean validator
  boolean: (field) =>
    body(field)
      .isBoolean()
      .withMessage(`${field} must be true or false`),

  // Date validator
  date: (field) =>
    body(field)
      .isISO8601()
      .withMessage(`${field} must be a valid date`),

  // URL validator
  url: (field) =>
    body(field)
      .isURL()
      .withMessage(`${field} must be a valid URL`),

  // Phone number validator
  phone: (field = 'phone') =>
    body(field)
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),

  // UUID validator
  uuid: (field) =>
    body(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`),

  // Array validator
  array: (field, minLength = 0, maxLength = null) => {
    let validator = body(field).isArray({ min: minLength });
    if (maxLength !== null) {
      validator = validator.withMessage(`${field} must have between ${minLength} and ${maxLength} items`);
    } else {
      validator = validator.withMessage(`${field} must have at least ${minLength} items`);
    }
    return validator;
  }
};

/**
 * Parameter validation rules
 */
const paramValidators = {
  // ID parameter validator
  id: (paramName = 'id') =>
    param(paramName)
      .isInt({ min: 1 })
      .withMessage(`${paramName} must be a positive integer`),

  // UUID parameter validator
  uuid: (paramName = 'id') =>
    param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`)
};

/**
 * Query parameter validation rules
 */
const queryValidators = {
  // Pagination validators
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Sort field must be a valid string'),
    query('order')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('Order must be either "asc" or "desc"')
  ],

  // Search validator
  search: () =>
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),

  // Date range validators
  dateRange: () => [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((endDate, { req }) => {
        const startDate = req.query.startDate;
        if (startDate && new Date(endDate) <= new Date(startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ]
};

/**
 * Predefined validation chains for common use cases
 */
const validationChains = {
  // User registration validation
  userRegistration: () => [
    commonValidators.username('username'),
    commonValidators.email('email'),
    commonValidators.password('password', 8),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ],

  // User login validation
  userLogin: () => [
    commonValidators.username('username'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // User update validation
  userUpdate: () => [
    commonValidators.username('username').optional(),
    commonValidators.email('email').optional(),
    commonValidators.phone('phone').optional(),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be no more than 500 characters')
  ],

  // Pagination validation
  pagination: () => queryValidators.pagination(),

  // Search validation
  search: () => queryValidators.search(),

  // Date range validation
  dateRange: () => queryValidators.dateRange(),

  // ID parameter validation
  idParam: (paramName = 'id') => [paramValidators.id(paramName)],

  // UUID parameter validation
  uuidParam: (paramName = 'id') => [paramValidators.uuid(paramName)]
};

/**
 * Validation result handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    validationLogger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: errors.array()
    });

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: formattedErrors
    });
  }

  next();
};

/**
 * Sanitize request data middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

module.exports = {
  // Common validators
  commonValidators,

  // Parameter validators
  paramValidators,

  // Query validators
  queryValidators,

  // Predefined validation chains
  validationChains,

  // Middleware functions
  handleValidationErrors,
  sanitizeRequest,

  // Individual validators for custom chains
  body,
  param,
  query,
  validationResult
};
