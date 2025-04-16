import Redis from 'ioredis';
import ENV from './env';

// Redis client
const redis = new Redis({
  port: Number(ENV.REDIS_PORT),
  host: ENV.REDIS_HOST,
  username: ENV.REDIS_USERNAME,
  password: ENV.REDIS_PASSWORD,
});

/**
 * Cache Service providing methods to interact with Redis
 */
export const cacheService = {
  /**
   * Set a key-value pair in Redis with an optional expiration time
   *
   * @param {string} key - The cache key
   * @param {string} value - The value to store
   * @param {number} ttlSeconds - Time to live in seconds (defaults to 3600 = 1 hour)
   * @returns {Promise<'OK' | null>} - Redis operation result
   */
  set: async (key: string, value: string, ttlSeconds: number = 3600): Promise<'OK' | null> =>
    await redis.set(key, value, 'EX', ttlSeconds),

  /**
   * Get a value by key from Redis
   *
   * @param {string} key - The cache key to retrieve
   * @returns {Promise<string | null>} - The cached value or null if not found
   * @throws {Error} - If the operation fails
   */
  get: async (key: string): Promise<string | null | undefined> => {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error(`Failed to get cache for key "${key}"`, error);
    }
  },

  /**
   * Delete a key from Redis
   *
   * @param {string} key - The cache key to delete
   * @returns {Promise<number>} - Number of keys removed (0 or 1)
   * @throws {Error} - If the operation fails
   */
  delete: async (key: string): Promise<number | null | undefined> => {
    try {
      return await redis.del(key);
    } catch (error) {
      console.error(`Failed to delete cache for key "${key}":`, error);
    }
  },

  /**
   * Check if a key exists in Redis
   *
   * @param {string} key - The cache key to check
   * @returns {Promise<boolean>} - True if the key exists, false otherwise
   * @throws {Error} - If the operation fails
   */
  exists: async (key: string): Promise<boolean | undefined> => {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Failed to check existence for key "${key}":`, error);
    }
  },

  /**
   * Set expiration time on a key
   *
   * @param {string} key - The cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<number>} - 1 if successful, 0 if key doesn't exist
   * @throws {Error} - If the operation fails
   */
  setTTL: async (key: string, ttlSeconds: number): Promise<number | undefined> => {
    try {
      return await redis.expire(key, ttlSeconds);
    } catch (error) {
      console.error(`Failed to set TTL for key "${key}":`, error);
    }
  },

  /**
   * Get the remaining TTL for a key
   *
   * @param {string} key - The cache key
   * @returns {Promise<number>} - TTL in seconds, -2 if key doesn't exist, -1 if key exists but has no TTL
   * @throws {Error} - If the operation fails
   */
  getTTL: async (key: string): Promise<number | undefined> => {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`Failed to get TTL for key "${key}":`, error);
    }
  },
};

export default cacheService;
