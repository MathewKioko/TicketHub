import Redis from 'ioredis'

// Redis client singleton (BEAST LEVEL: Production-grade caching)
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Create Redis client with connection pooling and error handling
export const redis = globalForRedis.redis ?? new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    // Production-grade configuration
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    // Connection pooling
    enableReadyCheck: true,
    lazyConnect: true,
  }
)

// Handle connection errors gracefully
redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
  // Don't crash the app if Redis is unavailable
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// Cache utility functions (BEAST LEVEL: Production patterns)
export class CacheService {
  private static readonly DEFAULT_TTL = 3600 // 1 hour default

  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null // Fail gracefully - return null if cache fails
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      // Fail silently - don't break the app if cache fails
    }
  }

  /**
   * Delete cached value
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Delete all keys matching a pattern (for cache invalidation)
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      })

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      })

      await new Promise((resolve, reject) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
    } catch (error) {
      console.error(`Cache pattern delete error for ${pattern}:`, error)
    }
  }

  /**
   * Check if Redis is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch {
      return false
    }
  }
}

export default redis

