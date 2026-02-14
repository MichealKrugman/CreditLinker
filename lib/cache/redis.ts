import { createClient } from 'redis'

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

// Connection status
redisClient.on('connect', () => {
  console.log('✅ Redis connected')
})

// Initialize connection (connect once on first use)
let connectionPromise: Promise<void> | null = null

async function ensureConnection() {
  if (!redisClient.isOpen && !connectionPromise) {
    connectionPromise = redisClient.connect()
    await connectionPromise
  } else if (connectionPromise) {
    await connectionPromise
  }
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Set a value in Redis with optional TTL (in seconds)
 */
export async function set(
  key: string,
  value: string | number | object,
  ttl?: number
): Promise<void> {
  try {
    await ensureConnection()
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    
    if (ttl) {
      await redisClient.setEx(key, ttl, stringValue)
    } else {
      await redisClient.set(key, stringValue)
    }
  } catch (error) {
    console.error('Redis SET error:', error)
    throw error
  }
}

/**
 * Get a value from Redis
 */
export async function get<T = string>(key: string): Promise<T | null> {
  try {
    await ensureConnection()
    
    const value = await redisClient.get(key)
    
    if (!value) return null

    // Try to parse as JSON, otherwise return as string
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

/**
 * Delete a key from Redis
 */
export async function del(key: string): Promise<void> {
  try {
    await ensureConnection()
    await redisClient.del(key)
  } catch (error) {
    console.error('Redis DEL error:', error)
    throw error
  }
}

/**
 * Check if a key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    await ensureConnection()
    const result = await redisClient.exists(key)
    return result === 1
  } catch (error) {
    console.error('Redis EXISTS error:', error)
    return false
  }
}

/**
 * Set expiration time for a key (in seconds)
 */
export async function expire(key: string, seconds: number): Promise<void> {
  try {
    await ensureConnection()
    await redisClient.expire(key, seconds)
  } catch (error) {
    console.error('Redis EXPIRE error:', error)
    throw error
  }
}

/**
 * Get all keys matching a pattern
 */
export async function keys(pattern: string): Promise<string[]> {
  try {
    await ensureConnection()
    return await redisClient.keys(pattern)
  } catch (error) {
    console.error('Redis KEYS error:', error)
    return []
  }
}

/**
 * Increment a counter
 */
export async function incr(key: string): Promise<number> {
  try {
    await ensureConnection()
    return await redisClient.incr(key)
  } catch (error) {
    console.error('Redis INCR error:', error)
    throw error
  }
}

/**
 * Decrement a counter
 */
export async function decr(key: string): Promise<number> {
  try {
    await ensureConnection()
    return await redisClient.decr(key)
  } catch (error) {
    console.error('Redis DECR error:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMON PATTERNS
// ============================================================================

/**
 * Cache a function result with TTL
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  // Try to get from cache
  const cached = await get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  await set(key, result, ttl)
  
  return result
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const matchingKeys = await keys(pattern)
    
    if (matchingKeys.length > 0) {
      await Promise.all(matchingKeys.map(key => del(key)))
    }
  } catch (error) {
    console.error('Redis invalidate pattern error:', error)
  }
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

export const cacheKeys = {
  business: (businessId: string) => `business:${businessId}`,
  metrics: (businessId: string, month: string) => `metrics:${businessId}:${month}`,
  score: (businessId: string, month: string) => `score:${businessId}:${month}`,
  transactions: (importId: string) => `transactions:${importId}`,
  dashboard: (businessId: string) => `dashboard:${businessId}`,
}

export { redisClient }
export default redisClient
