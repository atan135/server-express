const redis = require('redis');
const { logger } = require("../middleware/logger.middleware");

class RedisUtil {
  static logger = logger("redis");
  static client = null;
  static isConnected = false;

  /**
   * Initialize Redis connection
   * @param {Object} config - Redis configuration
   * @param {string} config.host - Redis host
   * @param {number} config.port - Redis port
   * @param {string} config.password - Redis password
   * @param {number} config.db - Redis database number
   * @param {number} config.connectTimeout - Connection timeout in ms
   * @param {number} config.commandTimeout - Command timeout in ms
   */
  static async connect(config = {}) {
    try {
      const {
        host = process.env.REDIS_HOST || 'localhost',
        port = process.env.REDIS_PORT || 6379,
        password = process.env.REDIS_PASSWORD || null,
        db = process.env.REDIS_DB || 0,
        connectTimeout = process.env.REDIS_CONNECT_TIMEOUT || 10000,
        commandTimeout = process.env.REDIS_COMMAND_TIMEOUT || 5000
      } = config;

      this.client = redis.createClient({
        socket: {
          host,
          port,
          connectTimeout,
          commandTimeout
        },
        password,
        database: db
      });

      // Event listeners
      this.client.on('connect', () => {
        this.logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        this.isConnected = false;
        this.logger.info('Redis client disconnected');
      });

      await this.client.connect();
      
      // Set connected flag after successful connection
      this.isConnected = true;
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  static async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        this.logger.info('Redis client disconnected');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  /**
   * Check if Redis is connected
   * @returns {boolean}
   */
  static isRedisConnected() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Set key-value pair
   * @param {string} key - Redis key
   * @param {string|number|Object} value - Value to store
   * @param {number} expire - Expiration time in seconds (optional)
   * @returns {Promise<boolean>}
   */
  static async set(key, value, expire = null) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (expire) {
        await this.client.setEx(key, expire, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      this.logger.info(`Set key: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get value by key
   * @param {string} key - Redis key
   * @returns {Promise<string|Object|null>}
   */
  static async get(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete key(s)
   * @param {string|Array<string>} keys - Key(s) to delete
   * @returns {Promise<number>} - Number of keys deleted
   */
  static async del(keys) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const keyArray = Array.isArray(keys) ? keys : [keys];
      const result = await this.client.del(keyArray);
      
      this.logger.info(`Deleted ${result} key(s): ${keyArray.join(', ')}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting keys:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Redis key
   * @returns {Promise<boolean>}
   */
  static async exists(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set expiration time for key
   * @param {string} key - Redis key
   * @param {number} seconds - Expiration time in seconds
   * @returns {Promise<boolean>}
   */
  static async expire(key, seconds) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.expire(key, seconds);
      this.logger.info(`Set expiration for key ${key}: ${seconds}s`);
      return result;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get time to live for key
   * @param {string} key - Redis key
   * @returns {Promise<number>} - TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  static async ttl(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment value by 1
   * @param {string} key - Redis key
   * @returns {Promise<number>} - New value
   */
  static async incr(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.incr(key);
      this.logger.info(`Incremented key ${key}: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment value by specified amount
   * @param {string} key - Redis key
   * @param {number} increment - Amount to increment by
   * @returns {Promise<number>} - New value
   */
  static async incrBy(key, increment) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.incrBy(key, increment);
      this.logger.info(`Incremented key ${key} by ${increment}: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement value by 1
   * @param {string} key - Redis key
   * @returns {Promise<number>} - New value
   */
  static async decr(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.decr(key);
      this.logger.info(`Decremented key ${key}: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement value by specified amount
   * @param {string} key - Redis key
   * @param {number} decrement - Amount to decrement by
   * @returns {Promise<number>} - New value
   */
  static async decrBy(key, decrement) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.decrBy(key, decrement);
      this.logger.info(`Decremented key ${key} by ${decrement}: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Add member to set
   * @param {string} key - Redis key
   * @param {string|number} member - Member to add
   * @returns {Promise<number>} - Number of members added
   */
  static async sadd(key, member) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.sAdd(key, member);
      this.logger.info(`Added member to set ${key}: ${member}`);
      return result;
    } catch (error) {
      this.logger.error(`Error adding member to set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove member from set
   * @param {string} key - Redis key
   * @param {string|number} member - Member to remove
   * @returns {Promise<number>} - Number of members removed
   */
  static async srem(key, member) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.sRem(key, member);
      this.logger.info(`Removed member from set ${key}: ${member}`);
      return result;
    } catch (error) {
      this.logger.error(`Error removing member from set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if member exists in set
   * @param {string} key - Redis key
   * @param {string|number} member - Member to check
   * @returns {Promise<boolean>}
   */
  static async sismember(key, member) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.sIsMember(key, member);
      return result;
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all members of set
   * @param {string} key - Redis key
   * @returns {Promise<Array>} - Array of members
   */
  static async smembers(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.sMembers(key);
      return result;
    } catch (error) {
      this.logger.error(`Error getting members of set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Add to hash
   * @param {string} key - Redis key
   * @param {string} field - Hash field
   * @param {string|number|Object} value - Field value
   * @returns {Promise<number>} - Number of fields added
   */
  static async hset(key, field, value) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      const result = await this.client.hSet(key, field, serializedValue);
      
      this.logger.info(`Set hash field ${key}.${field}`);
      return result;
    } catch (error) {
      this.logger.error(`Error setting hash field ${key}.${field}:`, error);
      throw error;
    }
  }

  /**
   * Get from hash
   * @param {string} key - Redis key
   * @param {string} field - Hash field
   * @returns {Promise<string|Object|null>}
   */
  static async hget(key, field) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const value = await this.client.hGet(key, field);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      this.logger.error(`Error getting hash field ${key}.${field}:`, error);
      throw error;
    }
  }

  /**
   * Get all fields from hash
   * @param {string} key - Redis key
   * @returns {Promise<Object>} - Object with field-value pairs
   */
  static async hgetall(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.hGetAll(key);
      
      // Try to parse JSON values
      const parsedResult = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsedResult[field] = JSON.parse(value);
        } catch {
          parsedResult[field] = value;
        }
      }

      return parsedResult;
    } catch (error) {
      this.logger.error(`Error getting all hash fields for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete field from hash
   * @param {string} key - Redis key
   * @param {string} field - Hash field
   * @returns {Promise<number>} - Number of fields deleted
   */
  static async hdel(key, field) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.hDel(key, field);
      this.logger.info(`Deleted hash field ${key}.${field}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting hash field ${key}.${field}:`, error);
      throw error;
    }
  }

  /**
   * Check if field exists in hash
   * @param {string} key - Redis key
   * @param {string} field - Hash field
   * @returns {Promise<boolean>}
   */
  static async hexists(key, field) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.hExists(key, field);
      return result;
    } catch (error) {
      this.logger.error(`Error checking hash field existence ${key}.${field}:`, error);
      throw error;
    }
  }

  /**
   * Get hash field count
   * @param {string} key - Redis key
   * @returns {Promise<number>}
   */
  static async hlen(key) {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      return await this.client.hLen(key);
    } catch (error) {
      this.logger.error(`Error getting hash length for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get Redis info
   * @returns {Promise<Object>} - Redis server information
   */
  static async info() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const info = await this.client.info();
      return this.parseInfo(info);
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      throw error;
    }
  }

  /**
   * Parse Redis info string into object
   * @param {string} infoString - Raw info string from Redis
   * @returns {Object} - Parsed info object
   */
  static parseInfo(infoString) {
    const lines = infoString.split('\r\n');
    const result = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Get Redis memory usage
   * @returns {Promise<Object>} - Memory usage information
   */
  static async memoryUsage() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const info = await this.info();
      return {
        usedMemory: parseInt(info.used_memory) || 0,
        usedMemoryHuman: info.used_memory_human || '0B',
        usedMemoryPeak: parseInt(info.used_memory_peak) || 0,
        usedMemoryPeakHuman: info.used_memory_peak_human || '0B',
        usedMemoryRss: parseInt(info.used_memory_rss) || 0,
        usedMemoryRssHuman: info.used_memory_rss_human || '0B'
      };
    } catch (error) {
      this.logger.error('Error getting Redis memory usage:', error);
      throw error;
    }
  }

  /**
   * Get Redis client list
   * @returns {Promise<Array>} - Array of connected clients
   */
  static async clientList() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const clients = await this.client.clientList();
      return clients.split('\r\n').filter(line => line.trim()).map(client => {
        const clientInfo = {};
        client.split(' ').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value !== undefined) {
            clientInfo[key] = value;
          }
        });
        return clientInfo;
      });
    } catch (error) {
      this.logger.error('Error getting Redis client list:', error);
      throw error;
    }
  }

  /**
   * Flush all databases
   * @returns {Promise<string>} - Result message
   */
  static async flushAll() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.flushAll();
      this.logger.warn('Flushed all Redis databases');
      return result;
    } catch (error) {
      this.logger.error('Error flushing Redis databases:', error);
      throw error;
    }
  }

  /**
   * Flush current database
   * @returns {Promise<string>} - Result message
   */
  static async flushDb() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.flushDb();
      this.logger.warn('Flushed current Redis database');
      return result;
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      throw error;
    }
  }

  /**
   * Get database size
   * @returns {Promise<number>} - Number of keys in current database
   */
  static async dbSize() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      return await this.client.dbSize();
    } catch (error) {
      this.logger.error('Error getting Redis database size:', error);
      throw error;
    }
  }

  /**
   * Ping Redis server
   * @returns {Promise<string>} - PONG response
   */
  static async ping() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      return await this.client.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  /**
   * Get Redis server time
   * @returns {Promise<Object>} - Server time information
   */
  static async time() {
    try {
      if (!this.isRedisConnected()) {
        throw new Error('Redis not connected');
      }

      const time = await this.client.time();
      return {
        seconds: parseInt(time[0]),
        microseconds: parseInt(time[1])
      };
    } catch (error) {
      this.logger.error('Error getting Redis time:', error);
      throw error;
    }
  }
}

module.exports = RedisUtil;
