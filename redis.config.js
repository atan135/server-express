/**
 * Redis Configuration
 * 
 * This file contains the Redis configuration settings.
 * Copy these settings to your .env file or set them as environment variables.
 */

module.exports = {
  // Redis Connection Settings
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,
  REDIS_DB: process.env.REDIS_DB || 0,
  
  // Timeout Settings
  REDIS_CONNECT_TIMEOUT: process.env.REDIS_CONNECT_TIMEOUT || 10000,
  REDIS_COMMAND_TIMEOUT: process.env.REDIS_COMMAND_TIMEOUT || 5000,
  
  // Connection Pool Settings
  REDIS_MAX_CLIENTS: process.env.REDIS_MAX_CLIENTS || 10,
  REDIS_RETRY_DELAY: process.env.REDIS_RETRY_DELAY || 1000,
  REDIS_MAX_RETRIES: process.env.REDIS_MAX_RETRIES || 3
};

/**
 * Environment Variables to set in your .env file:
 * 
 * REDIS_HOST=localhost
 * REDIS_PORT=6379
 * REDIS_PASSWORD=
 * REDIS_DB=0
 * REDIS_CONNECT_TIMEOUT=10000
 * REDIS_COMMAND_TIMEOUT=5000
 * REDIS_MAX_CLIENTS=10
 * REDIS_RETRY_DELAY=1000
 * REDIS_MAX_RETRIES=3
 */
