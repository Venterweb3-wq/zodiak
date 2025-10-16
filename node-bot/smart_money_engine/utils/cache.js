/**
 * Redis Cache Module
 * Handles caching for configuration, analysis results, and rate limiting
 */

const Redis = require('ioredis');

class CacheManager {
  constructor() {
    this.redis = process.env.REDIS_URL 
      ? new Redis(process.env.REDIS_URL)
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  /**
   * Get cached data or fetch from source
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fetched data
   */
  async getCachedOrFetch(key, fetchFn, ttl = 300) {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`📦 Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      console.log(`🔄 Cache miss: ${key}, fetching...`);
      const data = await fetchFn();
      
      if (data !== null && data !== undefined) {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      // Fallback to direct fetch on cache error
      return await fetchFn();
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache with TTL
   */
  async set(key, value, ttl = 300) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set cache for ${key}:`, error);
    }
  }

  /**
   * Delete cache entry
   */
  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Failed to delete cache for ${key}:`, error);
    }
  }

  /**
   * Check if analysis was recently done to avoid duplicates
   */
  async isRecentlyAnalyzed(symbol, threshold = 60) {
    const key = `analysis:lock:${symbol}`;
    const exists = await this.redis.exists(key);
    
    if (!exists) {
      // Set lock for threshold seconds
      await this.redis.setex(key, threshold, '1');
      return false;
    }
    
    return true;
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(key, limit, window) {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }

  /**
   * Store priority queue
   */
  async addToPriorityQueue(queueName, item, priority) {
    const score = Date.now() - (priority * 1000); // Higher priority = lower score
    await this.redis.zadd(queueName, score, JSON.stringify(item));
  }

  /**
   * Get items from priority queue
   */
  async getFromPriorityQueue(queueName, count = 10) {
    const items = await this.redis.zrange(queueName, 0, count - 1);
    
    if (items.length > 0) {
      // Remove fetched items
      await this.redis.zremrangebyrank(queueName, 0, count - 1);
    }
    
    return items.map(item => JSON.parse(item));
  }

  /**
   * Cache configuration from Django
   */
  async cacheConfig(config) {
    await this.set('config:smc:active', config, 3600); // 1 hour
  }

  /**
   * Get cached configuration
   */
  async getCachedConfig() {
    const cached = await this.redis.get('config:smc:active');
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}

// Create singleton instance
let cacheManager = null;

/**
 * Get cache manager instance
 */
function getCacheManager() {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}

module.exports = {
  CacheManager,
  getCacheManager
}; 