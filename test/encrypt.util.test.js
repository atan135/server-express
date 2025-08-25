const EncryptUtil = require('../src/utils/encrypt.util');

// Mock logger to avoid dependency issues in tests
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('EncryptUtil', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    require('../src/middleware/logger.middleware').logger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('md5', () => {
    test('should generate MD5 hash', () => {
      const data = 'Hello World';
      const result = EncryptUtil.md5(data);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(32); // MD5 hex output is 32 characters
      expect(typeof result).toBe('string');
    });

    test('should generate MD5 hash with different encoding', () => {
      const data = 'Hello World';
      const result = EncryptUtil.md5(data, 'base64');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for empty data', () => {
      expect(() => {
        EncryptUtil.md5('');
      }).toThrow('Data is required for MD5 hashing');
    });

    test('should throw error for null data', () => {
      expect(() => {
        EncryptUtil.md5(null);
      }).toThrow('Data is required for MD5 hashing');
    });
  });

  describe('sha256', () => {
    test('should generate SHA-256 hash', () => {
      const data = 'Hello World';
      const result = EncryptUtil.sha256(data);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(64); // SHA-256 hex output is 64 characters
      expect(typeof result).toBe('string');
    });

    test('should generate SHA-256 hash with different encoding', () => {
      const data = 'Hello World';
      const result = EncryptUtil.sha256(data, 'base64');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for empty data', () => {
      expect(() => {
        EncryptUtil.sha256('');
      }).toThrow('Data is required for SHA-256 hashing');
    });
  });

  describe('bcryptHash', () => {
    test('should generate bcrypt hash', async () => {
      const data = 'password123';
      const result = await EncryptUtil.bcryptHash(data);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('$2b$'); // bcrypt prefix
    });

    test('should generate bcrypt hash with custom salt rounds', async () => {
      const data = 'password123';
      const result = await EncryptUtil.bcryptHash(data, 12);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for empty data', async () => {
      await expect(EncryptUtil.bcryptHash('')).rejects.toThrow('Data is required for bcrypt hashing');
    });

    test('should throw error for invalid salt rounds', async () => {
      await expect(EncryptUtil.bcryptHash('password', 0)).rejects.toThrow('Salt rounds must be between 1 and 20');
      await expect(EncryptUtil.bcryptHash('password', 21)).rejects.toThrow('Salt rounds must be between 1 and 20');
    });
  });

  describe('bcryptCompare', () => {
    test('should compare bcrypt hash successfully', async () => {
      const password = 'password123';
      const hash = await EncryptUtil.bcryptHash(password);
      const result = await EncryptUtil.bcryptCompare(password, hash);
      
      expect(result).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'password123';
      const hash = await EncryptUtil.bcryptHash(password);
      const result = await EncryptUtil.bcryptCompare('wrongpassword', hash);
      
      expect(result).toBe(false);
    });

    test('should throw error for empty data', async () => {
      await expect(EncryptUtil.bcryptCompare('', 'hash')).rejects.toThrow('Data and hash are required for bcrypt comparison');
      await expect(EncryptUtil.bcryptCompare('password', '')).rejects.toThrow('Data and hash are required for bcrypt comparison');
    });
  });

  describe('aesEncrypt', () => {
    test('should encrypt data with AES', () => {
      const data = 'Hello World';
      const key = 'mysecretkey32byteslong!!';
      const result = EncryptUtil.aesEncrypt(data, key);
      
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe('aes-256-cbc');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
    });

    test('should encrypt data with different AES algorithm', () => {
      const data = 'Hello World';
      const key = 'mysecretkey16bytes!';
      const result = EncryptUtil.aesEncrypt(data, key, 'aes-128-cbc');
      
      expect(result.algorithm).toBe('aes-128-cbc');
    });

    test('should throw error for empty data', () => {
      expect(() => {
        EncryptUtil.aesEncrypt('', 'key');
      }).toThrow('Data and key are required for AES encryption');
    });

    test('should throw error for empty key', () => {
      expect(() => {
        EncryptUtil.aesEncrypt('data', '');
      }).toThrow('Data and key are required for AES encryption');
    });
  });

  describe('aesDecrypt', () => {
    test('should decrypt AES encrypted data', () => {
      const data = 'Hello World';
      const key = 'mysecretkey32byteslong!!';
      const encrypted = EncryptUtil.aesEncrypt(data, key);
      
      const decrypted = EncryptUtil.aesDecrypt(encrypted.encrypted, key, encrypted.iv);
      
      expect(decrypted).toBe(data);
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        EncryptUtil.aesDecrypt('encrypted', 'key', '');
      }).toThrow('Encrypted data, key, and IV are required for AES decryption');
    });
  });

  describe('hmac', () => {
    test('should generate HMAC signature', () => {
      const data = 'Hello World';
      const secret = 'mysecret';
      const result = EncryptUtil.hmac(data, secret);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(64); // SHA-256 hex output
    });

    test('should generate HMAC with different algorithm', () => {
      const data = 'Hello World';
      const secret = 'mysecret';
      const result = EncryptUtil.hmac(data, secret, 'sha512');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(128); // SHA-512 hex output
    });

    test('should generate HMAC with different encoding', () => {
      const data = 'Hello World';
      const secret = 'mysecret';
      const result = EncryptUtil.hmac(data, secret, 'sha256', 'base64');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for empty data', () => {
      expect(() => {
        EncryptUtil.hmac('', 'secret');
      }).toThrow('Data and secret are required for HMAC generation');
    });
  });

  describe('hmacVerify', () => {
    test('should verify valid HMAC signature', () => {
      const data = 'Hello World';
      const secret = 'mysecret';
      const signature = EncryptUtil.hmac(data, secret);
      
      const result = EncryptUtil.hmacVerify(data, signature, secret);
      
      expect(result).toBe(true);
    });

    test('should reject invalid HMAC signature', () => {
      const data = 'Hello World';
      const secret = 'mysecret';
      const wrongSignature = 'wrongsignature';
      
      const result = EncryptUtil.hmacVerify(data, wrongSignature, secret);
      
      expect(result).toBe(false);
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        EncryptUtil.hmacVerify('', 'signature', 'secret');
      }).toThrow('Data, signature, and secret are required for HMAC verification');
    });
  });

  describe('generateRsaKeyPair', () => {
    test('should generate RSA key pair', () => {
      const result = EncryptUtil.generateRsaKeyPair(2048);
      
      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('privateKey');
      expect(typeof result.publicKey).toBe('string');
      expect(typeof result.privateKey).toBe('string');
      expect(result.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(result.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    });

    test('should generate RSA key pair with custom size', () => {
      const result = EncryptUtil.generateRsaKeyPair(1024);
      
      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('privateKey');
    });

    test('should throw error for invalid modulus length', () => {
      expect(() => {
        EncryptUtil.generateRsaKeyPair(256);
      }).toThrow('Modulus length must be between 512 and 4096 bits');
      
      expect(() => {
        EncryptUtil.generateRsaKeyPair(8192);
      }).toThrow('Modulus length must be between 512 and 4096 bits');
    });
  });

  describe('rsaEncrypt and rsaDecrypt', () => {
    test('should encrypt and decrypt with RSA', () => {
      const data = 'Hello World';
      const keyPair = EncryptUtil.generateRsaKeyPair(2048);
      
      const encrypted = EncryptUtil.rsaEncrypt(data, keyPair.publicKey);
      const decrypted = EncryptUtil.rsaDecrypt(encrypted, keyPair.privateKey);
      
      expect(decrypted).toBe(data);
    });

    test('should throw error for missing parameters in RSA encryption', () => {
      expect(() => {
        EncryptUtil.rsaEncrypt('', 'publickey');
      }).toThrow('Data and public key are required for RSA encryption');
    });

    test('should throw error for missing parameters in RSA decryption', () => {
      expect(() => {
        EncryptUtil.rsaDecrypt('', 'privatekey');
      }).toThrow('Encrypted data and private key are required for RSA decryption');
    });
  });

  describe('randomBytes', () => {
    test('should generate random bytes', () => {
      const result = EncryptUtil.randomBytes(32);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    test('should generate random bytes with different encoding', () => {
      const result = EncryptUtil.randomBytes(16, 'base64');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for invalid size', () => {
      expect(() => {
        EncryptUtil.randomBytes(0);
      }).toThrow('Size must be between 1 and 1024 bytes');
      
      expect(() => {
        EncryptUtil.randomBytes(2048);
      }).toThrow('Size must be between 1 and 1024 bytes');
    });
  });

  describe('randomString', () => {
    test('should generate random string', () => {
      const result = EncryptUtil.randomString(32);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(32);
    });

    test('should generate random string with custom charset', () => {
      const charset = '0123456789';
      const result = EncryptUtil.randomString(10, charset);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(10);
      expect(result).toMatch(/^[0-9]+$/);
    });

    test('should throw error for invalid length', () => {
      expect(() => {
        EncryptUtil.randomString(0);
      }).toThrow('Length must be between 1 and 1000');
      
      expect(() => {
        EncryptUtil.randomString(2000);
      }).toThrow('Length must be between 1 and 1000');
    });
  });

  describe('hashPassword', () => {
    test('should hash password with salt', () => {
      const password = 'password123';
      const result = EncryptUtil.hashPassword(password);
      
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('iterations');
      expect(result).toHaveProperty('keyLength');
      expect(result).toHaveProperty('digest');
      expect(result.iterations).toBe(10000);
      expect(result.keyLength).toBe(64);
      expect(result.digest).toBe('sha512');
    });

    test('should hash password with custom parameters', () => {
      const password = 'password123';
      const salt = 'customsalt';
      const result = EncryptUtil.hashPassword(password, salt, 20000, 32, 'sha256');
      
      expect(result.salt).toBe(salt);
      expect(result.iterations).toBe(20000);
      expect(result.keyLength).toBe(32);
      expect(result.digest).toBe('sha256');
    });

    test('should throw error for empty password', () => {
      expect(() => {
        EncryptUtil.hashPassword('');
      }).toThrow('Password is required for hashing');
    });

    test('should throw error for invalid iterations', () => {
      expect(() => {
        EncryptUtil.hashPassword('password', null, 500);
      }).toThrow('Iterations must be between 1000 and 1000000');
      
      expect(() => {
        EncryptUtil.hashPassword('password', null, 2000000);
      }).toThrow('Iterations must be between 1000 and 1000000');
    });
  });

  describe('verifyPassword', () => {
    test('should verify password hash successfully', () => {
      const password = 'password123';
      const hashed = EncryptUtil.hashPassword(password);
      
      const result = EncryptUtil.verifyPassword(password, hashed.hash, hashed.salt);
      
      expect(result).toBe(true);
    });

    test('should reject incorrect password', () => {
      const password = 'password123';
      const hashed = EncryptUtil.hashPassword(password);
      
      const result = EncryptUtil.verifyPassword('wrongpassword', hashed.hash, hashed.salt);
      
      expect(result).toBe(false);
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        EncryptUtil.verifyPassword('', 'hash', 'salt');
      }).toThrow('Password, hash, and salt are required for verification');
    });
  });

  describe('generateToken', () => {
    test('should generate JWT-like token', () => {
      const payload = { userId: 123, role: 'admin' };
      const secret = 'mysecretkey';
      const result = EncryptUtil.generateToken(payload, secret);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.split('.')).toHaveLength(3);
    });

    test('should generate token with custom expiration', () => {
      const payload = { userId: 123 };
      const secret = 'mysecretkey';
      const result = EncryptUtil.generateToken(payload, secret, 7200);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should throw error for missing parameters', () => {
      expect(() => {
        EncryptUtil.generateToken('', 'secret');
      }).toThrow('Payload and secret are required for token generation');
      
      expect(() => {
        EncryptUtil.generateToken({}, '');
      }).toThrow('Payload and secret are required for token generation');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const payload = { userId: 123, role: 'admin' };
      const secret = 'mysecretkey';
      const token = EncryptUtil.generateToken(payload, secret);
      
      const result = EncryptUtil.verifyToken(token, secret);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(123);
      expect(result.role).toBe('admin');
    });

    test('should reject invalid token', () => {
      const secret = 'mysecretkey';
      const invalidToken = 'invalid.token.signature';
      
      const result = EncryptUtil.verifyToken(invalidToken, secret);
      
      expect(result).toBeNull();
    });

    test('should reject expired token', () => {
      const payload = { userId: 123 };
      const secret = 'mysecretkey';
      // Generate token with past expiration time
      const pastTime = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago
      const expiredPayload = { ...payload, exp: pastTime };
      
      // Manually create expired token
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };
      
      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const claimsB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const signature = EncryptUtil.hmac(`${headerB64}.${claimsB64}`, secret, 'sha256', 'base64url');
      const expiredToken = `${headerB64}.${claimsB64}.${signature}`;
      
      const result = EncryptUtil.verifyToken(expiredToken, secret);
      expect(result).toBeNull();
    });

    test('should return null for missing parameters', () => {
      expect(EncryptUtil.verifyToken('', 'secret')).toBeNull();
      expect(EncryptUtil.verifyToken('token', '')).toBeNull();
    });
  });

  describe('integration tests', () => {
    test('should perform complete encryption workflow', async () => {
      const originalData = 'Sensitive information';
      const password = 'mypassword123';
      
      // 1. Hash password
      const passwordHash = await EncryptUtil.bcryptHash(password);
      
      // 2. Verify password
      const isPasswordValid = await EncryptUtil.bcryptCompare(password, passwordHash);
      expect(isPasswordValid).toBe(true);
      
      // 3. Generate AES key from password hash
      const aesKey = EncryptUtil.sha256(passwordHash, 'hex').substring(0, 32);
      
      // 4. Encrypt data with AES
      const encrypted = EncryptUtil.aesEncrypt(originalData, aesKey);
      
      // 5. Decrypt data with AES
      const decrypted = EncryptUtil.aesDecrypt(encrypted.encrypted, aesKey, encrypted.iv);
      expect(decrypted).toBe(originalData);
      
      // 6. Generate HMAC signature
      const signature = EncryptUtil.hmac(encrypted.encrypted, aesKey);
      
      // 7. Verify HMAC signature
      const isSignatureValid = EncryptUtil.hmacVerify(encrypted.encrypted, signature, aesKey);
      expect(isSignatureValid).toBe(true);
    });

    test('should handle RSA encryption workflow', () => {
      const originalData = 'Secret message';
      
      // 1. Generate RSA key pair
      const keyPair = EncryptUtil.generateRsaKeyPair(2048);
      
      // 2. Encrypt with public key
      const encrypted = EncryptUtil.rsaEncrypt(originalData, keyPair.publicKey);
      
      // 3. Decrypt with private key
      const decrypted = EncryptUtil.rsaDecrypt(encrypted, keyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    test('should handle token-based authentication workflow', () => {
      const userData = { userId: 456, email: 'user@example.com' };
      const secret = 'jwtsecretkey';
      
      // 1. Generate token
      const token = EncryptUtil.generateToken(userData, secret, 3600);
      
      // 2. Verify token
      const decoded = EncryptUtil.verifyToken(token, secret);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(456);
      expect(decoded.email).toBe('user@example.com');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('edge cases', () => {
    test('should handle very long data', () => {
      const longData = 'a'.repeat(10000);
      const result = EncryptUtil.md5(longData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle special characters in data', () => {
      const specialData = 'Hello & World < 10 > 5 "quoted" \'single\'';
      const result = EncryptUtil.sha256(specialData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle unicode characters', () => {
      const unicodeData = 'Hello 世界 🌍';
      const result = EncryptUtil.md5(unicodeData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle empty strings appropriately', () => {
      expect(() => EncryptUtil.md5('')).toThrow();
      expect(() => EncryptUtil.sha256('')).toThrow();
      expect(() => EncryptUtil.hmac('', 'secret')).toThrow();
    });
  });
});
