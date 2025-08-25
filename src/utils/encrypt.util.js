const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logger } = require("../middleware/logger.middleware");

class EncryptUtil {
  static logger = logger("encrypt");

  /**
   * Generate MD5 hash
   * 生成MD5哈希值
   * @param {string} data - Data to hash
   * @param {string} encoding - Output encoding (hex, base64, etc.)
   * @returns {string} MD5 hash
   */
  static md5(data, encoding = 'hex') {
    try {
      if (!data) {
        throw new Error('Data is required for MD5 hashing');
      }

      const hash = crypto.createHash('md5').update(data).digest(encoding);
      this.logger.info('MD5 hash generated successfully', { 
        dataLength: data.length,
        encoding 
      });
      
      return hash;
    } catch (error) {
      this.logger.error('Error generating MD5 hash', { error: error.message });
      throw new Error(`Failed to generate MD5 hash: ${error.message}`);
    }
  }

  /**
   * Generate SHA-256 hash
   * 生成SHA-256哈希值
   * @param {string} data - Data to hash
   * @param {string} encoding - Output encoding (hex, base64, etc.)
   * @returns {string} SHA-256 hash
   */
  static sha256(data, encoding = 'hex') {
    try {
      if (!data) {
        throw new Error('Data is required for SHA-256 hashing');
      }

      const hash = crypto.createHash('sha256').update(data).digest(encoding);
      this.logger.info('SHA-256 hash generated successfully', { 
        dataLength: data.length,
        encoding 
      });
      
      return hash;
    } catch (error) {
      this.logger.error('Error generating SHA-256 hash', { error: error.message });
      throw new Error(`Failed to generate SHA-256 hash: ${error.message}`);
    }
  }

  /**
   * Generate bcrypt hash
   * 使用bcrypt生成哈希值
   * @param {string} data - Data to hash
   * @param {number} saltRounds - Number of salt rounds (default: 10)
   * @returns {Promise<string>} Bcrypt hash
   */
  static async bcryptHash(data, saltRounds = 10) {
    try {
      if (!data) {
        throw new Error('Data is required for bcrypt hashing');
      }

      if (saltRounds < 1 || saltRounds > 20) {
        throw new Error('Salt rounds must be between 1 and 20');
      }

      const hash = await bcrypt.hash(data, saltRounds);
      this.logger.info('Bcrypt hash generated successfully', { 
        dataLength: data.length,
        saltRounds 
      });
      
      return hash;
    } catch (error) {
      this.logger.error('Error generating bcrypt hash', { error: error.message });
      throw new Error(`Failed to generate bcrypt hash: ${error.message}`);
    }
  }

  /**
   * Compare data with bcrypt hash
   * 使用bcrypt比较数据和哈希值
   * @param {string} data - Data to compare
   * @param {string} hash - Hash to compare against
   * @returns {Promise<boolean>} True if match
   */
  static async bcryptCompare(data, hash) {
    try {
      if (!data || !hash) {
        throw new Error('Data and hash are required for bcrypt comparison');
      }

      const isMatch = await bcrypt.compare(data, hash);
      this.logger.info('Bcrypt comparison completed', { 
        dataLength: data.length,
        isMatch 
      });
      
      return isMatch;
    } catch (error) {
      this.logger.error('Error in bcrypt comparison', { error: error.message });
      throw new Error(`Failed to compare bcrypt hash: ${error.message}`);
    }
  }

  /**
   * AES encryption
   * AES加密
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key (32 bytes for AES-256)
   * @param {string} algorithm - AES algorithm (aes-256-cbc, aes-192-cbc, aes-128-cbc)
   * @returns {Object} Encrypted data with IV
   */
  static aesEncrypt(data, key, algorithm = 'aes-256-cbc') {
    try {
      if (!data || !key) {
        throw new Error('Data and key are required for AES encryption');
      }

      // Generate IV
      const iv = crypto.randomBytes(16);
      
      // Ensure key is the right length for the algorithm
      let keyBuffer = Buffer.from(key, 'utf8');
      if (algorithm === 'aes-256-cbc') {
        // For AES-256, we need exactly 32 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 32);
      } else if (algorithm === 'aes-192-cbc') {
        // For AES-192, we need exactly 24 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 24);
      } else if (algorithm === 'aes-128-cbc') {
        // For AES-128, we need exactly 16 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 16);
      }
      
      // Create cipher with IV
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const result = {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        algorithm: algorithm
      };

      this.logger.info('AES encryption completed successfully', { 
        dataLength: data.length,
        algorithm 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in AES encryption', { error: error.message });
      throw new Error(`Failed to encrypt with AES: ${error.message}`);
    }
  }

  /**
   * AES decryption
   * AES解密
   * @param {string} encryptedData - Encrypted data
   * @param {string} key - Decryption key
   * @param {string} iv - Initialization vector (hex string)
   * @param {string} algorithm - AES algorithm
   * @returns {string} Decrypted data
   */
  static aesDecrypt(encryptedData, key, iv, algorithm = 'aes-256-cbc') {
    try {
      if (!encryptedData || !key || !iv) {
        throw new Error('Encrypted data, key, and IV are required for AES decryption');
      }

      // Convert IV from hex to buffer
      const ivBuffer = Buffer.from(iv, 'hex');
      
      // Ensure key is the right length for the algorithm (same as encryption)
      let keyBuffer = Buffer.from(key, 'utf8');
      if (algorithm === 'aes-256-cbc') {
        // For AES-256, we need exactly 32 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 32);
      } else if (algorithm === 'aes-192-cbc') {
        // For AES-192, we need exactly 24 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 24);
      } else if (algorithm === 'aes-128-cbc') {
        // For AES-128, we need exactly 16 bytes
        keyBuffer = crypto.scryptSync(key, 'salt', 16);
      }
      
      // Create decipher with IV
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.logger.info('AES decryption completed successfully', { 
        dataLength: encryptedData.length,
        algorithm 
      });
      
      return decrypted;
    } catch (error) {
      this.logger.error('Error in AES decryption', { error: error.message });
      throw new Error(`Failed to decrypt with AES: ${error.message}`);
    }
  }

  /**
   * Generate HMAC signature
   * 生成HMAC签名
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @param {string} algorithm - HMAC algorithm (sha256, sha512, etc.)
   * @param {string} encoding - Output encoding
   * @returns {string} HMAC signature
   */
  static hmac(data, secret, algorithm = 'sha256', encoding = 'hex') {
    try {
      if (!data || !secret) {
        throw new Error('Data and secret are required for HMAC generation');
      }

      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(data);
      const signature = hmac.digest(encoding);
      
      this.logger.info('HMAC signature generated successfully', { 
        dataLength: data.length,
        algorithm,
        encoding 
      });
      
      return signature;
    } catch (error) {
      this.logger.error('Error generating HMAC signature', { error: error.message });
      throw new Error(`Failed to generate HMAC signature: ${error.message}`);
    }
  }

  /**
   * Verify HMAC signature
   * 验证HMAC签名
   * @param {string} data - Original data
   * @param {string} signature - HMAC signature to verify
   * @param {string} secret - Secret key
   * @param {string} algorithm - HMAC algorithm
   * @param {string} encoding - Signature encoding
   * @returns {boolean} True if signature is valid
   */
  static hmacVerify(data, signature, secret, algorithm = 'sha256', encoding = 'hex') {
    try {
      if (!data || !signature || !secret) {
        throw new Error('Data, signature, and secret are required for HMAC verification');
      }

      const expectedSignature = this.hmac(data, secret, algorithm, encoding);
      
      // Use simple comparison for hex encoding, timing-safe for base64
      let isValid;
      if (encoding === 'hex') {
        isValid = signature === expectedSignature;
      } else {
        // For other encodings, ensure buffers have same length before timing-safe comparison
        const sigBuffer = Buffer.from(signature, encoding);
        const expectedBuffer = Buffer.from(expectedSignature, encoding);
        
        if (sigBuffer.length !== expectedBuffer.length) {
          isValid = false;
        } else {
          isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        }
      }
      
      this.logger.info('HMAC verification completed', { 
        dataLength: data.length,
        algorithm,
        isValid 
      });
      
      return isValid;
    } catch (error) {
      this.logger.error('Error in HMAC verification', { error: error.message });
      throw new Error(`Failed to verify HMAC signature: ${error.message}`);
    }
  }

  /**
   * Generate RSA key pair
   * 生成RSA密钥对
   * @param {number} modulusLength - Key size in bits (default: 2048)
   * @param {Object} options - Additional options
   * @returns {Object} Public and private keys
   */
  static generateRsaKeyPair(modulusLength = 2048, options = {}) {
    try {
      if (modulusLength < 512 || modulusLength > 4096) {
        throw new Error('Modulus length must be between 512 and 4096 bits');
      }

      const defaultOptions = {
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      };

      const finalOptions = { ...defaultOptions, ...options };
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        ...finalOptions
      });

      this.logger.info('RSA key pair generated successfully', { 
        modulusLength,
        publicKeyType: finalOptions.publicKeyEncoding.type,
        privateKeyType: finalOptions.privateKeyEncoding.type
      });
      
      return keyPair;
    } catch (error) {
      this.logger.error('Error generating RSA key pair', { error: error.message });
      throw new Error(`Failed to generate RSA key pair: ${error.message}`);
    }
  }

  /**
   * RSA public key encryption
   * RSA公钥加密
   * @param {string} data - Data to encrypt
   * @param {string} publicKey - Public key (PEM format)
   * @param {string} algorithm - Padding algorithm (default: RSA_PKCS1_OAEP_PADDING)
   * @returns {string} Encrypted data (base64)
   */
  static rsaEncrypt(data, publicKey, algorithm = 'RSA_PKCS1_OAEP_PADDING') {
    try {
      if (!data || !publicKey) {
        throw new Error('Data and public key are required for RSA encryption');
      }

      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants[algorithm] || crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(data, 'utf8')
      );

      const result = encrypted.toString('base64');
      
      this.logger.info('RSA encryption completed successfully', { 
        dataLength: data.length,
        algorithm 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in RSA encryption', { error: error.message });
      throw new Error(`Failed to encrypt with RSA: ${error.message}`);
    }
  }

  /**
   * RSA private key decryption
   * RSA私钥解密
   * @param {string} encryptedData - Encrypted data (base64)
   * @param {string} privateKey - Private key (PEM format)
   * @param {string} algorithm - Padding algorithm
   * @returns {string} Decrypted data
   */
  static rsaDecrypt(encryptedData, privateKey, algorithm = 'RSA_PKCS1_OAEP_PADDING') {
    try {
      if (!encryptedData || !privateKey) {
        throw new Error('Encrypted data and private key are required for RSA decryption');
      }

      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants[algorithm] || crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(encryptedData, 'base64')
      );

      const result = decrypted.toString('utf8');
      
      this.logger.info('RSA decryption completed successfully', { 
        dataLength: encryptedData.length,
        algorithm 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in RSA decryption', { error: error.message });
      throw new Error(`Failed to decrypt with RSA: ${error.message}`);
    }
  }

  /**
   * Generate random bytes
   * 生成随机字节
   * @param {number} size - Number of bytes to generate
   * @param {string} encoding - Output encoding (hex, base64, etc.)
   * @returns {string} Random bytes
   */
  static randomBytes(size = 32, encoding = 'hex') {
    try {
      if (size < 1 || size > 1024) {
        throw new Error('Size must be between 1 and 1024 bytes');
      }

      const random = crypto.randomBytes(size);
      const result = random.toString(encoding);
      
      this.logger.info('Random bytes generated successfully', { 
        size,
        encoding 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error generating random bytes', { error: error.message });
      throw new Error(`Failed to generate random bytes: ${error.message}`);
    }
  }

  /**
   * Generate secure random string
   * 生成安全的随机字符串
   * @param {number} length - Length of string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  static randomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    try {
      if (length < 1 || length > 1000) {
        throw new Error('Length must be between 1 and 1000');
      }

      let result = '';
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        result += charset[randomBytes[i] % charset.length];
      }
      
      this.logger.info('Random string generated successfully', { 
        length,
        charsetLength: charset.length 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error generating random string', { error: error.message });
      throw new Error(`Failed to generate random string: ${error.message}`);
    }
  }

  /**
   * Hash password with salt
   * 使用盐值哈希密码
   * @param {string} password - Password to hash
   * @param {string} salt - Salt value (optional, will generate if not provided)
   * @param {number} iterations - Number of iterations (default: 10000)
   * @param {number} keyLength - Key length in bytes (default: 64)
   * @param {string} digest - Hash algorithm (default: sha512)
   * @returns {Object} Hash and salt
   */
  static hashPassword(password, salt = null, iterations = 10000, keyLength = 64, digest = 'sha512') {
    try {
      if (!password) {
        throw new Error('Password is required for hashing');
      }

      if (iterations < 1000 || iterations > 1000000) {
        throw new Error('Iterations must be between 1000 and 1000000');
      }

      const generatedSalt = salt || crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync(password, generatedSalt, iterations, keyLength, digest);
      
      const result = {
        hash: hash.toString('hex'),
        salt: generatedSalt,
        iterations,
        keyLength,
        digest
      };
      
      this.logger.info('Password hashed successfully', { 
        passwordLength: password.length,
        iterations,
        digest 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error hashing password', { error: error.message });
      throw new Error(`Failed to hash password: ${error.message}`);
    }
  }

  /**
   * Verify password hash
   * 验证密码哈希
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to compare against
   * @param {string} salt - Salt used in hashing
   * @param {number} iterations - Number of iterations used
   * @param {number} keyLength - Key length used
   * @param {string} digest - Hash algorithm used
   * @returns {boolean} True if password matches
   */
  static verifyPassword(password, hash, salt, iterations = 10000, keyLength = 64, digest = 'sha512') {
    try {
      if (!password || !hash || !salt) {
        throw new Error('Password, hash, and salt are required for verification');
      }

      const testHash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        testHash
      );
      
      this.logger.info('Password verification completed', { 
        passwordLength: password.length,
        isValid 
      });
      
      return isValid;
    } catch (error) {
      this.logger.error('Error verifying password', { error: error.message });
      throw new Error(`Failed to verify password: ${error.message}`);
    }
  }

  /**
   * Generate JWT-like token
   * 生成JWT风格的令牌
   * @param {Object} payload - Token payload
   * @param {string} secret - Secret key
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} JWT token
   */
  static generateToken(payload, secret, expiresIn = 3600) {
    try {
      if (!payload || !secret) {
        throw new Error('Payload and secret are required for token generation');
      }

      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const claims = {
        ...payload,
        iat: now,
        exp: now + expiresIn
      };

      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const claimsB64 = Buffer.from(JSON.stringify(claims)).toString('base64url');
      
      const signature = this.hmac(`${headerB64}.${claimsB64}`, secret, 'sha256', 'base64url');
      
      const token = `${headerB64}.${claimsB64}.${signature}`;
      
      this.logger.info('Token generated successfully', { 
        payloadKeys: Object.keys(payload),
        expiresIn 
      });
      
      return token;
    } catch (error) {
      this.logger.error('Error generating token', { error: error.message });
      throw new Error(`Failed to generate token: ${error.message}`);
    }
  }

  /**
   * Verify JWT-like token
   * 验证JWT风格的令牌
   * @param {string} token - Token to verify
   * @param {string} secret - Secret key
   * @returns {Object} Decoded payload or null if invalid
   */
  static verifyToken(token, secret) {
    try {
      if (!token || !secret) {
        throw new Error('Token and secret are required for verification');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, claimsB64, signature] = parts;
      
      // Verify signature
      const expectedSignature = this.hmac(`${headerB64}.${claimsB64}`, secret, 'sha256', 'base64url');
      if (signature !== expectedSignature) {
        return null;
      }

      // Decode claims
      const claims = JSON.parse(Buffer.from(claimsB64, 'base64url').toString());
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp && claims.exp < now) {
        return null;
      }

      this.logger.info('Token verified successfully', { 
        payloadKeys: Object.keys(claims).filter(key => !['iat', 'exp'].includes(key))
      });
      
      return claims;
    } catch (error) {
      this.logger.error('Error verifying token', { error: error.message });
      return null;
    }
  }
}

module.exports = EncryptUtil;
