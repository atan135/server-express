const express = require("express");
const { 
  validationChains, 
  commonValidators, 
  paramValidators,
  queryValidators,
  body,
  handleValidationErrors 
} = require("../middleware/validation.middleware");

const router = express.Router();

// Demo 1: Using pre-built validation chains
router.post("/users/register", 
  validationChains.userRegistration(),
  handleValidationErrors,
  (req, res) => {
    res.json({
      message: "User registration validation passed",
      data: req.body
    });
  }
);

router.post("/users/login", 
  validationChains.userLogin(),
  handleValidationErrors,
  (req, res) => {
    res.json({
      message: "User login validation passed",
      data: req.body
    });
  }
);

// Demo 2: Custom validation with individual validators
router.post("/products", [
  commonValidators.string('name', 1, 100),
  commonValidators.string('description', 0, 500),
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
], (req, res) => {
  res.json({
    message: "Product creation validation passed",
    data: req.body
  });
});

// Demo 3: Parameter validation
router.get("/users/:id", [
  paramValidators.id('id'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "User ID parameter validation passed",
    userId: req.params.id
  });
});

router.get("/sessions/:sessionId", [
  paramValidators.uuid('sessionId'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Session UUID parameter validation passed",
    sessionId: req.params.sessionId
  });
});

// Demo 4: Query parameter validation
router.get("/posts", [
  queryValidators.pagination(),
  queryValidators.search(),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Posts query validation passed",
    query: req.query
  });
});

router.get("/events", [
  queryValidators.dateRange(),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Events date range validation passed",
    query: req.query
  });
});

// Demo 5: Advanced custom validation
router.post("/orders", [
  commonValidators.string('customerName', 1, 100),
  commonValidators.email('customerEmail'),
  commonValidators.phone('customerPhone'),
  body('items')
    .isArray({ min: 1, max: 20 })
    .withMessage('Order must have 1-20 items'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('shippingAddress')
    .custom((value) => {
      if (!value.street || !value.city || !value.postalCode) {
        throw new Error('Shipping address must include street, city, and postal code');
      }
      return true;
    }),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Order validation passed",
    data: req.body
  });
});

// Demo 6: File upload validation (conceptual)
router.post("/uploads", [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be no more than 500 characters'),
  body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with 0-10 items'),
  body('tags.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be 1-20 characters'),
  body('category')
    .isIn(['image', 'document', 'video', 'audio'])
    .withMessage('Invalid category'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Upload validation passed",
    data: req.body
  });
});

// Demo 7: Business logic validation
router.post("/reservations", [
  commonValidators.string('customerName', 1, 100),
  commonValidators.email('customerEmail'),
  commonValidators.phone('customerPhone'),
  commonValidators.date('checkInDate'),
  commonValidators.date('checkOutDate'),
  body('guests')
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of guests must be between 1 and 10'),
  body('checkOutDate')
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.checkInDate);
      const checkOut = new Date(value);
      
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
      
      // Check if reservation is at least 1 day
      const diffTime = checkOut - checkIn;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        throw new Error('Reservation must be at least 1 day');
      }
      
      return true;
    }),
  body('roomType')
    .isIn(['single', 'double', 'suite', 'deluxe'])
    .withMessage('Invalid room type'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Reservation validation passed",
    data: req.body
  });
});

// Demo 8: Conditional validation
router.post("/profiles", [
  commonValidators.string('firstName', 1, 50),
  commonValidators.string('lastName', 1, 50),
  commonValidators.email('email'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialMedia')
    .optional()
    .isArray({ min: 0, max: 5 })
    .withMessage('Social media links must be an array with 0-5 items'),
  body('socialMedia.*.platform')
    .isIn(['facebook', 'twitter', 'instagram', 'linkedin', 'github'])
    .withMessage('Invalid social media platform'),
  body('socialMedia.*.url')
    .isURL()
    .withMessage('Social media URL must be valid'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notification preference must be boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  handleValidationErrors
], (req, res) => {
  res.json({
    message: "Profile validation passed",
    data: req.body
  });
});

module.exports = router;
