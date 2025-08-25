const RedisUtil = require('../src/utils/redis.util');

// Mock Redis client
const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  incrBy: jest.fn(),
  decr: jest.fn(),
  decrBy: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn(),
  sIsMember: jest.fn(),
  sMembers: jest.fn(),
  hSet: jest.fn(),
  hGet: jest.fn(),
  hGetAll: jest.fn(),
  hDel: jest.fn(),
  hExists: jest.fn(),
  hLen: jest.fn(),
  info: jest.fn(),
  clientList: jest.fn(),
  flushAll: jest.fn(),
  flushDb: jest.fn(),
  dbSize: jest.fn(),
  ping: jest.fn(),
  time: jest.fn()
};

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

// Mock logger middleware
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('RedisUtil', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset static properties
    RedisUtil.client = null;
    RedisUtil.isConnected = false;
    
    // Reset mock implementations
    mockRedisClient.connect.mockResolvedValue();
    mockRedisClient.quit.mockResolvedValue();
    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.setEx.mockResolvedValue('OK');
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.exists.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(1);
    mockRedisClient.ttl.mockResolvedValue(-1);
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.incrBy.mockResolvedValue(5);
    mockRedisClient.decr.mockResolvedValue(0);
    mockRedisClient.decrBy.mockResolvedValue(3);
    mockRedisClient.sAdd.mockResolvedValue(1);
    mockRedisClient.sRem.mockResolvedValue(1);
    mockRedisClient.sIsMember.mockResolvedValue(true);
    mockRedisClient.sMembers.mockResolvedValue(['member1', 'member2']);
    mockRedisClient.hSet.mockResolvedValue(1);
    mockRedisClient.hGet.mockResolvedValue('value');
    mockRedisClient.hGetAll.mockResolvedValue({ field1: 'value1', field2: 'value2' });
    mockRedisClient.hDel.mockResolvedValue(1);
    mockRedisClient.hExists.mockResolvedValue(true);
    mockRedisClient.hLen.mockResolvedValue(2);
    mockRedisClient.info.mockResolvedValue('redis_version:6.0.0\r\nused_memory:123456\r\n');
    mockRedisClient.clientList.mockResolvedValue('id=1 addr=127.0.0.1:6379\r\n');
    mockRedisClient.flushAll.mockResolvedValue('OK');
    mockRedisClient.flushDb.mockResolvedValue('OK');
    mockRedisClient.dbSize.mockResolvedValue(10);
    mockRedisClient.ping.mockResolvedValue('PONG');
    mockRedisClient.time.mockResolvedValue(['1234567890', '123456']);
  });

  afterEach(async () => {
    // Clean up connection if exists
    if (RedisUtil.isRedisConnected()) {
      await RedisUtil.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('should connect to Redis with default config', async () => {
      const result = await RedisUtil.connect();
      
      expect(result).toBe(true);
      expect(RedisUtil.client).toBe(mockRedisClient);
      expect(RedisUtil.isConnected).toBe(true);
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    test('should connect to Redis with custom config', async () => {
      const customConfig = {
        host: 'redis.example.com',
        port: 6380,
        password: 'secret',
        db: 1,
        connectTimeout: 15000,
        commandTimeout: 8000
      };

      const result = await RedisUtil.connect(customConfig);
      
      expect(result).toBe(true);
      expect(RedisUtil.client).toBe(mockRedisClient);
    });

    test('should handle connection error', async () => {
      const error = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(error);

      await expect(RedisUtil.connect()).rejects.toThrow('Connection failed');
      expect(RedisUtil.client).toBeNull();
      expect(RedisUtil.isConnected).toBe(false);
    });

    test('should disconnect from Redis', async () => {
      await RedisUtil.connect();
      await RedisUtil.disconnect();
      
      expect(RedisUtil.isConnected).toBe(false);
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    test('should check connection status', async () => {
      expect(RedisUtil.isRedisConnected()).toBe(false);
      
      await RedisUtil.connect();
      expect(RedisUtil.isRedisConnected()).toBe(true);
    });
  });

  describe('Basic Operations', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should set key-value pair', async () => {
      const result = await RedisUtil.set('test:key', 'test-value');
      
      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith('test:key', 'test-value');
    });

    test('should set key-value pair with expiration', async () => {
      const result = await RedisUtil.set('test:key', 'test-value', 3600);
      
      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test:key', 3600, 'test-value');
    });

    test('should set object value', async () => {
      const objValue = { name: 'test', value: 123 };
      const result = await RedisUtil.set('test:obj', objValue);
      
      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith('test:obj', JSON.stringify(objValue));
    });

    test('should get value by key', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');
      const result = await RedisUtil.get('test:key');
      
      expect(result).toBe('test-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
    });

    test('should get and parse JSON value', async () => {
      const jsonValue = '{"name":"test","value":123}';
      mockRedisClient.get.mockResolvedValue(jsonValue);
      const result = await RedisUtil.get('test:key');
      
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const result = await RedisUtil.get('nonexistent');
      
      expect(result).toBeNull();
    });

    test('should delete key', async () => {
      const result = await RedisUtil.del('test:key');
      
      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:key']);
    });

    test('should delete multiple keys', async () => {
      const result = await RedisUtil.del(['key1', 'key2', 'key3']);
      
      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    test('should check if key exists', async () => {
      const result = await RedisUtil.exists('test:key');
      
      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test:key');
    });

    test('should set expiration for key', async () => {
      const result = await RedisUtil.expire('test:key', 3600);
      
      expect(result).toBe(1);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test:key', 3600);
    });

    test('should get TTL for key', async () => {
      const result = await RedisUtil.ttl('test:key');
      
      expect(result).toBe(-1);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test:key');
    });
  });

  describe('Counter Operations', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should increment value by 1', async () => {
      const result = await RedisUtil.incr('counter');
      
      expect(result).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    });

    test('should increment value by specified amount', async () => {
      const result = await RedisUtil.incrBy('counter', 5);
      
      expect(result).toBe(5);
      expect(mockRedisClient.incrBy).toHaveBeenCalledWith('counter', 5);
    });

    test('should decrement value by 1', async () => {
      const result = await RedisUtil.decr('counter');
      
      expect(result).toBe(0);
      expect(mockRedisClient.decr).toHaveBeenCalledWith('counter');
    });

    test('should decrement value by specified amount', async () => {
      const result = await RedisUtil.decrBy('counter', 3);
      
      expect(result).toBe(3);
      expect(mockRedisClient.decrBy).toHaveBeenCalledWith('counter', 3);
    });
  });

  describe('Set Operations', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should add member to set', async () => {
      const result = await RedisUtil.sadd('test:set', 'member1');
      
      expect(result).toBe(1);
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('test:set', 'member1');
    });

    test('should remove member from set', async () => {
      const result = await RedisUtil.srem('test:set', 'member1');
      
      expect(result).toBe(1);
      expect(mockRedisClient.sRem).toHaveBeenCalledWith('test:set', 'member1');
    });

    test('should check if member exists in set', async () => {
      const result = await RedisUtil.sismember('test:set', 'member1');
      
      expect(result).toBe(true);
      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith('test:set', 'member1');
    });

    test('should get all members of set', async () => {
      const result = await RedisUtil.smembers('test:set');
      
      expect(result).toEqual(['member1', 'member2']);
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('test:set');
    });
  });

  describe('Hash Operations', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should set hash field', async () => {
      const result = await RedisUtil.hset('test:hash', 'field1', 'value1');
      
      expect(result).toBe(1);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith('test:hash', 'field1', 'value1');
    });

    test('should set hash field with object value', async () => {
      const objValue = { nested: 'value' };
      const result = await RedisUtil.hset('test:hash', 'field1', objValue);
      
      expect(result).toBe(1);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith('test:hash', 'field1', JSON.stringify(objValue));
    });

    test('should get hash field', async () => {
      const result = await RedisUtil.hget('test:hash', 'field1');
      
      expect(result).toBe('value');
      expect(mockRedisClient.hGet).toHaveBeenCalledWith('test:hash', 'field1');
    });

    test('should get all hash fields', async () => {
      const result = await RedisUtil.hgetall('test:hash');
      
      expect(result).toEqual({ field1: 'value1', field2: 'value2' });
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('test:hash');
    });

    test('should delete hash field', async () => {
      const result = await RedisUtil.hdel('test:hash', 'field1');
      
      expect(result).toBe(1);
      expect(mockRedisClient.hDel).toHaveBeenCalledWith('test:hash', 'field1');
    });

    test('should check if hash field exists', async () => {
      const result = await RedisUtil.hexists('test:hash', 'field1');
      
      expect(result).toBe(true);
      expect(mockRedisClient.hExists).toHaveBeenCalledWith('test:hash', 'field1');
    });

    test('should get hash field count', async () => {
      const result = await RedisUtil.hlen('test:hash');
      
      expect(result).toBe(2);
      expect(mockRedisClient.hLen).toHaveBeenCalledWith('test:hash');
    });
  });

  describe('Server Information', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should get Redis info', async () => {
      const result = await RedisUtil.info();
      
      expect(result).toHaveProperty('redis_version', '6.0.0');
      expect(result).toHaveProperty('used_memory', '123456');
      expect(mockRedisClient.info).toHaveBeenCalled();
    });

    test('should parse Redis info string', () => {
      const infoString = 'redis_version:6.0.0\r\nused_memory:123456\r\n# Comment\r\n';
      const result = RedisUtil.parseInfo(infoString);
      
      expect(result).toEqual({
        redis_version: '6.0.0',
        used_memory: '123456'
      });
    });

    test('should get memory usage', async () => {
      const result = await RedisUtil.memoryUsage();
      
      expect(result).toHaveProperty('usedMemory');
      expect(result).toHaveProperty('usedMemoryHuman');
      expect(result).toHaveProperty('usedMemoryPeak');
      expect(result).toHaveProperty('usedMemoryPeakHuman');
      expect(result).toHaveProperty('usedMemoryRss');
      expect(result).toHaveProperty('usedMemoryRssHuman');
    });

    test('should get client list', async () => {
      const result = await RedisUtil.clientList();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[0]).toHaveProperty('addr', '127.0.0.1:6379');
      expect(mockRedisClient.clientList).toHaveBeenCalled();
    });

    test('should get database size', async () => {
      const result = await RedisUtil.dbSize();
      
      expect(result).toBe(10);
      expect(mockRedisClient.dbSize).toHaveBeenCalled();
    });

    test('should ping Redis server', async () => {
      const result = await RedisUtil.ping();
      
      expect(result).toBe('PONG');
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    test('should get Redis server time', async () => {
      const result = await RedisUtil.time();
      
      expect(result).toHaveProperty('seconds', 1234567890);
      expect(result).toHaveProperty('microseconds', 123456);
      expect(mockRedisClient.time).toHaveBeenCalled();
    });
  });

  describe('Database Management', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should flush all databases', async () => {
      const result = await RedisUtil.flushAll();
      
      expect(result).toBe('OK');
      expect(mockRedisClient.flushAll).toHaveBeenCalled();
    });

    test('should flush current database', async () => {
      const result = await RedisUtil.flushDb();
      
      expect(result).toBe('OK');
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when not connected', async () => {
      await expect(RedisUtil.set('key', 'value')).rejects.toThrow('Redis not connected');
      await expect(RedisUtil.get('key')).rejects.toThrow('Redis not connected');
      await expect(RedisUtil.del('key')).rejects.toThrow('Redis not connected');
    });

    test('should handle Redis operation errors', async () => {
      await RedisUtil.connect();
      
      const error = new Error('Redis operation failed');
      mockRedisClient.set.mockRejectedValue(error);
      
      await expect(RedisUtil.set('key', 'value')).rejects.toThrow('Redis operation failed');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      await RedisUtil.connect();
    });

    test('should perform complete workflow', async () => {
      // Set value
      await RedisUtil.set('workflow:key', 'initial-value');
      
      // Check exists
      const exists = await RedisUtil.exists('workflow:key');
      expect(exists).toBe(true);
      
      // Get value - mock returns null by default, so we need to set it first
      mockRedisClient.get.mockResolvedValue('initial-value');
      const value = await RedisUtil.get('workflow:key');
      expect(value).toBe('initial-value');
      
      // Update value
      await RedisUtil.set('workflow:key', 'updated-value');
      
      // Set expiration
      await RedisUtil.expire('workflow:key', 3600);
      
      // Get TTL
      const ttl = await RedisUtil.ttl('workflow:key');
      expect(ttl).toBe(-1);
      
      // Delete key
      const deleted = await RedisUtil.del('workflow:key');
      expect(deleted).toBe(1);
      
      // Verify deletion - mock returns 1 by default, so we need to change it
      mockRedisClient.exists.mockResolvedValue(0);
      const existsAfter = await RedisUtil.exists('workflow:key');
      expect(existsAfter).toBe(false);
    });

    test('should handle hash operations workflow', async () => {
      // Set multiple hash fields
      await RedisUtil.hset('user:123', 'name', 'John Doe');
      await RedisUtil.hset('user:123', 'email', 'john@example.com');
      await RedisUtil.hset('user:123', 'age', 30);
      
      // Check field exists
      const nameExists = await RedisUtil.hexists('user:123', 'name');
      expect(nameExists).toBe(true);
      
      // Get specific field - mock returns 'value' by default
      mockRedisClient.hGet.mockResolvedValue('John Doe');
      const name = await RedisUtil.hget('user:123', 'name');
      expect(name).toBe('John Doe');
      
      // Get all fields - mock returns default data, so we need to change it
      mockRedisClient.hGetAll.mockResolvedValue({ name: 'John Doe', email: 'john@example.com', age: 30 });
      const userData = await RedisUtil.hgetall('user:123');
      expect(userData).toHaveProperty('name', 'John Doe');
      expect(userData).toHaveProperty('email', 'john@example.com');
      expect(userData).toHaveProperty('age', 30);
      
      // Get field count
      const fieldCount = await RedisUtil.hlen('user:123');
      expect(fieldCount).toBe(2);
      
      // Delete field
      const deleted = await RedisUtil.hdel('user:123', 'age');
      expect(deleted).toBe(1);
      
      // Verify deletion - mock returns true by default, so we need to change it
      mockRedisClient.hExists.mockResolvedValue(false);
      const ageExists = await RedisUtil.hexists('user:123', 'age');
      expect(ageExists).toBe(false);
    });

    test('should handle set operations workflow', async () => {
      // Add members to set
      await RedisUtil.sadd('tags:post:123', 'javascript');
      await RedisUtil.sadd('tags:post:123', 'nodejs');
      await RedisUtil.sadd('tags:post:123', 'redis');
      
      // Check membership
      const isJavaScript = await RedisUtil.sismember('tags:post:123', 'javascript');
      expect(isJavaScript).toBe(true);
      
      const isPython = await RedisUtil.sismember('tags:post:123', 'python');
      expect(isPython).toBe(true); // Mock returns true
      
      // Get all members - mock returns ['member1', 'member2'] by default
      mockRedisClient.sMembers.mockResolvedValue(['javascript', 'nodejs', 'redis']);
      const tags = await RedisUtil.smembers('tags:post:123');
      expect(tags).toContain('javascript');
      expect(tags).toContain('nodejs');
      expect(tags).toContain('redis');
      
      // Remove member
      const removed = await RedisUtil.srem('tags:post:123', 'python');
      expect(removed).toBe(1);
    });
  });
});
