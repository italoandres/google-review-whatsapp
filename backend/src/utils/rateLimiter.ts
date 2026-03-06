/**
 * Rate Limiter with Sliding Window Algorithm
 * 
 * Implements per-user rate limiting with configurable limits per endpoint.
 * Uses in-memory storage with automatic cleanup of expired records.
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
  requests: number[]; // Timestamps of requests for sliding window
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(private cleanupIntervalMs: number = 60000) {
    // Start automatic cleanup of expired records
    this.startCleanup();
  }
  
  /**
   * Check if a request should be rate limited
   * 
   * @param key - Unique identifier (e.g., userId or userId:endpoint)
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    // Handle edge case: 0 max requests means all requests are rate limited
    if (maxRequests <= 0) {
      return true;
    }
    
    const now = Date.now();
    const record = this.records.get(key);
    
    if (!record) {
      // First request from this key
      this.records.set(key, {
        count: 1,
        windowStart: now,
        requests: [now]
      });
      return false;
    }
    
    // Remove requests outside the sliding window
    const validRequests = record.requests.filter(timestamp => {
      return now - timestamp < windowMs;
    });
    
    // Check if limit is exceeded
    if (validRequests.length >= maxRequests) {
      // Update record with cleaned requests
      record.requests = validRequests;
      return true;
    }
    
    // Add new request
    validRequests.push(now);
    record.count = validRequests.length;
    record.windowStart = validRequests[0];
    record.requests = validRequests;
    
    this.records.set(key, record);
    return false;
  }
  
  /**
   * Get the number of requests made within the current window
   * 
   * @param key - Unique identifier
   * @param windowMs - Time window in milliseconds
   * @returns Number of requests in current window
   */
  getRequestCount(key: string, windowMs: number): number {
    const record = this.records.get(key);
    if (!record) {
      return 0;
    }
    
    const now = Date.now();
    const validRequests = record.requests.filter(timestamp => {
      return now - timestamp < windowMs;
    });
    
    return validRequests.length;
  }
  
  /**
   * Get time until rate limit resets (in seconds)
   * 
   * @param key - Unique identifier
   * @param windowMs - Time window in milliseconds
   * @returns Seconds until oldest request expires, or 0 if not rate limited
   */
  getRetryAfter(key: string, windowMs: number): number {
    const record = this.records.get(key);
    if (!record || record.requests.length === 0) {
      return 0;
    }
    
    const now = Date.now();
    const oldestRequest = record.requests[0];
    const resetTime = oldestRequest + windowMs;
    const secondsUntilReset = Math.ceil((resetTime - now) / 1000);
    
    return Math.max(0, secondsUntilReset);
  }
  
  /**
   * Reset rate limit for a specific key
   * 
   * @param key - Unique identifier to reset
   */
  reset(key: string): void {
    this.records.delete(key);
  }
  
  /**
   * Reset all rate limit records
   */
  resetAll(): void {
    this.records.clear();
  }
  
  /**
   * Get all active keys (for testing/debugging)
   */
  getActiveKeys(): string[] {
    return Array.from(this.records.keys());
  }
  
  /**
   * Start automatic cleanup of expired records
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
    
    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }
  
  /**
   * Clean up expired records to prevent memory leaks
   * A record is considered expired if all its requests are older than 1 hour
   */
  private cleanup(): void {
    const now = Date.now();
    const expirationThreshold = 60 * 60 * 1000; // 1 hour
    
    for (const [key, record] of this.records.entries()) {
      // Remove requests older than 1 hour
      const validRequests = record.requests.filter(timestamp => {
        return now - timestamp < expirationThreshold;
      });
      
      if (validRequests.length === 0) {
        // No valid requests, remove the record
        this.records.delete(key);
      } else {
        // Update record with cleaned requests
        record.requests = validRequests;
        record.count = validRequests.length;
        record.windowStart = validRequests[0];
      }
    }
  }
  
  /**
   * Stop the cleanup interval (for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Create a rate limiter key for a specific user and endpoint
 * 
 * @param userId - User identifier
 * @param endpoint - Optional endpoint identifier
 * @returns Rate limiter key
 */
export function createRateLimitKey(userId: string, endpoint?: string): string {
  return endpoint ? `${userId}:${endpoint}` : userId;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  INSTANCE_CREATION: {
    maxRequests: 20, // Aumentado de 3 para 20
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  QR_CODE_GENERATION: {
    maxRequests: 30, // Aumentado de 1 para 30
    windowMs: 60 * 1000, // 1 minute
  },
  WEBHOOK_EVENTS: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  CONNECTION_STATUS: {
    maxRequests: 120, // Aumentado de 60 para 120
    windowMs: 60 * 1000, // 1 minute (2 per second)
  },
} as const;
