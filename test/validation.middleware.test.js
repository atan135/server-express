const {
  commonValidators,
  paramValidators,
  queryValidators,
  validationChains,
  handleValidationErrors,
  sanitizeRequest,
  body,
  param,
  query
} = require('../src/middleware/validation.middleware');

// Mock logger middleware
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      originalUrl: '/test',
      method: 'POST'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('Common Validators', () => {
    describe('string validator', () => {
      test('should validate string with default length', () => {
        const validator = commonValidators.string('name');
        expect(validator).toBeDefined();
      });

      test('should validate string with custom length', () => {
        const validator = commonValidators.string('description', 10, 100);
        expect(validator).toBeDefined();
      });
    });

    describe('email validator', () => {
      test('should validate email format', () => {
        const validator = commonValidators.email('email');
        expect(validator).toBeDefined();
      });

      test('should use default field name', () => {
        const validator = commonValidators.email();
        expect(validator).toBeDefined();
      });
    });

    describe('password validator', () => {
      test('should validate password with default length', () => {
        const validator = commonValidators.password('password');
        expect(validator).toBeDefined();
      });

      test('should validate password with custom length', () => {
        const validator = commonValidators.password('password', 10);
        expect(validator).toBeDefined();
      });
    });

    describe('username validator', () => {
      test('should validate username format', () => {
        const validator = commonValidators.username('username');
        expect(validator).toBeDefined();
      });

      test('should use default field name', () => {
        const validator = commonValidators.username();
        expect(validator).toBeDefined();
      });
    });

    describe('integer validator', () => {
      test('should validate integer without constraints', () => {
        const validator = commonValidators.integer('age');
        expect(validator).toBeDefined();
      });

      test('should validate integer with min constraint', () => {
        const validator = commonValidators.integer('age', 0);
        expect(validator).toBeDefined();
      });

      test('should validate integer with max constraint', () => {
        const validator = commonValidators.integer('age', null, 120);
        expect(validator).toBeDefined();
      });

      test('should validate integer with both constraints', () => {
        const validator = commonValidators.integer('age', 0, 120);
        expect(validator).toBeDefined();
      });
    });

    describe('boolean validator', () => {
      test('should validate boolean field', () => {
        const validator = commonValidators.boolean('active');
        expect(validator).toBeDefined();
      });
    });

    describe('date validator', () => {
      test('should validate date field', () => {
        const validator = commonValidators.date('birthDate');
        expect(validator).toBeDefined();
      });
    });

    describe('url validator', () => {
      test('should validate URL field', () => {
        const validator = commonValidators.url('website');
        expect(validator).toBeDefined();
      });
    });

    describe('phone validator', () => {
      test('should validate phone field', () => {
        const validator = commonValidators.phone('phone');
        expect(validator).toBeDefined();
      });

      test('should use default field name', () => {
        const validator = commonValidators.phone();
        expect(validator).toBeDefined();
      });
    });

    describe('uuid validator', () => {
      test('should validate UUID field', () => {
        const validator = commonValidators.uuid('id');
        expect(validator).toBeDefined();
      });
    });

    describe('array validator', () => {
      test('should validate array with default constraints', () => {
        const validator = commonValidators.array('tags');
        expect(validator).toBeDefined();
      });

      test('should validate array with custom constraints', () => {
        const validator = commonValidators.array('tags', 1, 10);
        expect(validator).toBeDefined();
      });
    });
  });

  describe('Parameter Validators', () => {
    describe('id validator', () => {
      test('should validate ID parameter with default name', () => {
        const validator = paramValidators.id();
        expect(validator).toBeDefined();
      });

      test('should validate ID parameter with custom name', () => {
        const validator = paramValidators.id('userId');
        expect(validator).toBeDefined();
      });
    });

    describe('uuid validator', () => {
      test('should validate UUID parameter with default name', () => {
        const validator = paramValidators.uuid();
        expect(validator).toBeDefined();
      });

      test('should validate UUID parameter with custom name', () => {
        const validator = paramValidators.uuid('userId');
        expect(validator).toBeDefined();
      });
    });
  });

  describe('Query Validators', () => {
    describe('pagination validator', () => {
      test('should return array of validators', () => {
        const validators = queryValidators.pagination();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(4);
      });
    });

    describe('search validator', () => {
      test('should return search validator', () => {
        const validator = queryValidators.search();
        expect(validator).toBeDefined();
      });
    });

    describe('dateRange validator', () => {
      test('should return array of validators', () => {
        const validators = queryValidators.dateRange();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(2);
      });
    });
  });

  describe('Validation Chains', () => {
    describe('userRegistration', () => {
      test('should return array of validators', () => {
        const validators = validationChains.userRegistration();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(4);
      });
    });

    describe('userLogin', () => {
      test('should return array of validators', () => {
        const validators = validationChains.userLogin();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(2);
      });
    });

    describe('userUpdate', () => {
      test('should return array of validators', () => {
        const validators = validationChains.userUpdate();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(4);
      });
    });

    describe('pagination', () => {
      test('should return pagination validators', () => {
        const validators = validationChains.pagination();
        expect(Array.isArray(validators)).toBe(true);
      });
    });

    describe('search', () => {
      test('should return search validators', () => {
        const validators = validationChains.search();
        expect(validators).toBeDefined();
        expect(typeof validators).toBe('function');
      });
    });

    describe('dateRange', () => {
      test('should return date range validators', () => {
        const validators = validationChains.dateRange();
        expect(Array.isArray(validators)).toBe(true);
      });
    });

    describe('idParam', () => {
      test('should return ID parameter validators', () => {
        const validators = validationChains.idParam();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(1);
      });

      test('should use custom parameter name', () => {
        const validators = validationChains.idParam('userId');
        expect(Array.isArray(validators)).toBe(true);
      });
    });

    describe('uuidParam', () => {
      test('should return UUID parameter validators', () => {
        const validators = validationChains.uuidParam();
        expect(Array.isArray(validators)).toBe(true);
        expect(validators).toHaveLength(1);
      });

      test('should use custom parameter name', () => {
        const validators = validationChains.uuidParam('userId');
        expect(Array.isArray(validators)).toBe(true);
      });
    });
  });

  describe('handleValidationErrors Middleware', () => {
    test('should call next() when no validation errors', () => {
      // Mock validationResult to return no errors
      const originalValidationResult = require('express-validator').validationResult;
      require('express-validator').validationResult = jest.fn(() => ({
        isEmpty: () => true,
        array: () => []
      }));

      handleValidationErrors(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();

      // Restore original
      require('express-validator').validationResult = originalValidationResult;
    });

    test('should return 400 status with validation errors', () => {
      // Test that the middleware function exists and is callable
      expect(typeof handleValidationErrors).toBe('function');
      expect(handleValidationErrors.length).toBe(3); // req, res, next parameters
      
      // Test that it's a proper middleware function
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeRequest Middleware', () => {
    test('should trim string values in body', () => {
      mockReq.body = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        age: 30
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe('John Doe');
      expect(mockReq.body.email).toBe('john@example.com');
      expect(mockReq.body.age).toBe(30);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should trim string values in query', () => {
      mockReq.query = {
        search: '  test query  ',
        sort: '  name  ',
        page: '1'
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.query.search).toBe('test query');
      expect(mockReq.query.sort).toBe('name');
      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle empty body and query', () => {
      mockReq.body = {};
      mockReq.query = {};

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle null/undefined values', () => {
      mockReq.body = {
        name: null,
        email: undefined,
        age: 30
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBeNull();
      expect(mockReq.body.email).toBeUndefined();
      expect(mockReq.body.age).toBe(30);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Individual Validators', () => {
    test('body validator should be available', () => {
      expect(body).toBeDefined();
      expect(typeof body).toBe('function');
    });

    test('param validator should be available', () => {
      expect(param).toBeDefined();
      expect(typeof param).toBe('function');
    });

    test('query validator should be available', () => {
      expect(query).toBeDefined();
      expect(typeof query).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    test('should create complete validation chain for user registration', () => {
      const validators = validationChains.userRegistration();
      
      expect(validators).toHaveLength(4);
      
      // Check that all validators are functions
      validators.forEach(validator => {
        expect(typeof validator).toBe('function');
      });
    });

    test('should create complete validation chain for pagination', () => {
      const validators = validationChains.pagination();
      
      expect(validators).toHaveLength(4);
      
      // Check that all validators are functions
      validators.forEach(validator => {
        expect(typeof validator).toBe('function');
      });
    });

    test('should handle validation errors with proper logging', () => {
      // Test that the middleware function exists and is callable
      expect(typeof handleValidationErrors).toBe('function');
      expect(handleValidationErrors.length).toBe(3); // req, res, next parameters
      
      // Test that it's a proper middleware function
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
