# Redis Utility Documentation

## Overview

The `RedisUtil` class provides a comprehensive interface for Redis operations in the Express MySQL project. It offers connection management, basic operations, data structures, and server information utilities.

## Features

### Connection Management
- **Connection Setup**: Connect to Redis with custom or default configuration
- **Connection Monitoring**: Event listeners for connect, ready, error, and disconnect events
- **Connection Status**: Check if Redis is connected
- **Graceful Disconnection**: Proper cleanup when disconnecting

### Basic Operations
- **Key-Value Operations**: Set, get, delete, and check existence of keys
- **Expiration Management**: Set and get TTL (Time To Live) for keys
- **Data Serialization**: Automatic JSON serialization/deserialization for objects

### Data Structures
- **Strings**: Basic key-value storage with expiration support
- **Counters**: Increment/decrement operations for numeric values
- **Sets**: Add, remove, and query set members
- **Hashes**: Field-value pairs within a single key

### Server Information
- **Server Info**: Get Redis server information and statistics
- **Memory Usage**: Monitor Redis memory consumption
- **Client Management**: List connected clients
- **Database Operations**: Get database size and flush operations
- **Health Checks**: Ping server and get server time

## Test Coverage

The test suite covers:
- **Connection Management**: 5 test cases
- **Basic Operations**: 9 test cases
- **Counter Operations**: 4 test cases
- **Set Operations**: 4 test cases
- **Hash Operations**: 7 test cases
- **Server Information**: 7 test cases
- **Database Management**: 2 test cases
- **Error Handling**: 2 test cases
- **Integration Tests**: 3 test cases

**Total: 43 test cases**

## Usage Examples

### Basic Setup

```javascript
const RedisUtil = require('./src/utils/redis.util');

// Connect to Redis
await RedisUtil.connect();

// Check connection status
if (RedisUtil.isRedisConnected()) {
  console.log('Redis is connected');
}
```

### Key-Value Operations

```javascript
// Set a simple value
await RedisUtil.set('user:123', 'John Doe');

// Set with expiration (1 hour)
await RedisUtil.set('session:abc', 'user_data', 3600);

// Set an object (automatically serialized)
await RedisUtil.set('user:123:profile', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Get values
const userName = await RedisUtil.get('user:123');
const userProfile = await RedisUtil.get('user:123:profile');

// Check if key exists
const exists = await RedisUtil.exists('user:123');

// Set expiration
await RedisUtil.expire('user:123', 7200); // 2 hours

// Get TTL
const ttl = await RedisUtil.ttl('user:123');

// Delete keys
await RedisUtil.del('user:123');
await RedisUtil.del(['key1', 'key2', 'key3']);
```

### Counter Operations

```javascript
// Increment counters
const newValue = await RedisUtil.incr('page:views');
const incremented = await RedisUtil.incrBy('user:123:score', 10);

// Decrement counters
const decreased = await RedisUtil.decr('user:123:lives');
const decremented = await RedisUtil.decrBy('user:123:points', 5);
```

### Set Operations

```javascript
// Add members to sets
await RedisUtil.sadd('user:123:tags', 'javascript');
await RedisUtil.sadd('user:123:tags', 'nodejs');

// Check membership
const isMember = await RedisUtil.sismember('user:123:tags', 'javascript');

// Get all members
const tags = await RedisUtil.smembers('user:123:tags');

// Remove members
await RedisUtil.srem('user:123:tags', 'nodejs');
```

### Hash Operations

```javascript
// Set hash fields
await RedisUtil.hset('user:123', 'name', 'John Doe');
await RedisUtil.hset('user:123', 'email', 'john@example.com');
await RedisUtil.hset('user:123', 'preferences', { theme: 'dark', lang: 'en' });

// Get specific field
const userName = await RedisUtil.hget('user:123', 'name');

// Get all fields
const userData = await RedisUtil.hgetall('user:123');

// Check field existence
const hasEmail = await RedisUtil.hexists('user:123', 'email');

// Get field count
const fieldCount = await RedisUtil.hlen('user:123');

// Delete field
await RedisUtil.hdel('user:123', 'preferences');
```

### Server Information

```javascript
// Get server info
const info = await RedisUtil.info();
console.log(`Redis version: ${info.redis_version}`);

// Get memory usage
const memory = await RedisUtil.memoryUsage();
console.log(`Used memory: ${memory.usedMemoryHuman}`);

// Get connected clients
const clients = await RedisUtil.clientList();

// Get database size
const dbSize = await RedisUtil.dbSize();

// Health check
const pong = await RedisUtil.ping(); // Returns 'PONG'

// Get server time
const time = await RedisUtil.time();
```

### Database Management

```javascript
// Flush current database
await RedisUtil.flushDb();

// Flush all databases (use with caution!)
await RedisUtil.flushAll();
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```bash
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Timeouts
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000

# Connection Pool
REDIS_MAX_CLIENTS=10
REDIS_RETRY_DELAY=1000
REDIS_MAX_RETRIES=3
```

### Custom Configuration

```javascript
const customConfig = {
  host: 'redis.example.com',
  port: 6380,
  password: 'secret',
  db: 1,
  connectTimeout: 15000,
  commandTimeout: 8000
};

await RedisUtil.connect(customConfig);
```

## Error Handling

The utility includes comprehensive error handling:

```javascript
try {
  await RedisUtil.set('key', 'value');
} catch (error) {
  if (error.message === 'Redis not connected') {
    console.log('Please connect to Redis first');
  } else {
    console.error('Redis operation failed:', error.message);
  }
}
```

## Performance Considerations

- **Connection Pooling**: The utility maintains a single connection per instance
- **Automatic Serialization**: Objects are automatically serialized/deserialized
- **Batch Operations**: Support for deleting multiple keys at once
- **Timeout Management**: Configurable connection and command timeouts

## Security Features

- **Password Authentication**: Support for Redis password authentication
- **Database Isolation**: Use different database numbers for different environments
- **Connection Validation**: All operations check connection status before execution

## Dependencies

- **redis**: Official Redis client for Node.js
- **log4js**: Logging middleware for operation tracking

## Running Tests

```bash
# Run all Redis utility tests
npm test test/redis.util.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Important Notes

1. **Connection Required**: All operations require an active Redis connection
2. **Automatic Cleanup**: Always disconnect when done to free resources
3. **Error Handling**: Implement proper error handling for production use
4. **Memory Management**: Be cautious with `flushAll()` in production
5. **Serialization**: Large objects are automatically JSON serialized

## Troubleshooting

### Common Issues

1. **"Redis not connected" error**: Call `RedisUtil.connect()` first
2. **Connection timeout**: Check Redis server status and network connectivity
3. **Memory issues**: Monitor memory usage with `RedisUtil.memoryUsage()`
4. **Performance**: Use appropriate expiration times and monitor TTL values

### Debug Mode

Enable verbose logging by setting the log level:

```javascript
// In your logger configuration
LOG_LEVEL=debug
```

## Contributing

When adding new features to the Redis utility:

1. Add comprehensive tests for new functionality
2. Update this documentation
3. Follow the existing code style and error handling patterns
4. Ensure proper connection state validation
