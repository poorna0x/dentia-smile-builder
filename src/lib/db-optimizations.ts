// Database Optimization Utilities
// This file contains various optimization techniques to reduce database strain

import { supabase } from './supabase'

// Connection pooling configuration
export const DB_CONFIG = {
  maxConnections: 10,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

// Query optimization utilities
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static pendingQueries = new Map<string, Promise<any>>()
  
  // Cache TTL constants
  static readonly CACHE_TTL = {
    APPOINTMENTS: 5 * 60 * 1000, // 5 minutes
    SETTINGS: 10 * 60 * 1000, // 10 minutes
    CLINIC_INFO: 30 * 60 * 1000, // 30 minutes
    STATS: 2 * 60 * 1000, // 2 minutes
  }

  // Optimized query with caching and deduplication
  static async executeQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.CACHE_TTL.APPOINTMENTS
  ): Promise<T> {
    const now = Date.now()
    
    // Check cache first
    const cached = this.queryCache.get(key)
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data
    }
    
    // Check if query is already pending
    const pending = this.pendingQueries.get(key)
    if (pending) {
      return pending
    }
    
    // Execute query with retry logic
    const queryPromise = this.executeWithRetry(queryFn)
    this.pendingQueries.set(key, queryPromise)
    
    try {
      const result = await queryPromise
      
      // Cache the result
      this.queryCache.set(key, {
        data: result,
        timestamp: now,
        ttl
      })
      
      return result
    } finally {
      this.pendingQueries.delete(key)
    }
  }

  // Retry logic for failed queries
  private static async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    attempts: number = DB_CONFIG.retryAttempts
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await queryFn()
      } catch (error) {
        if (i === attempts - 1) throw error
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, DB_CONFIG.retryDelay * (i + 1)))
      }
    }
    throw new Error('Max retry attempts reached')
  }

  // Clear cache for specific keys or all
  static clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }

  // Get cache statistics
  static getCacheStats() {
    const keys = Array.from(this.queryCache.keys())
    const totalSize = keys.length
    const now = Date.now()
    const expiredKeys = keys.filter(key => {
      const cached = this.queryCache.get(key)
      return cached && (now - cached.timestamp) > cached.ttl
    }).length

    return {
      totalSize,
      expiredKeys,
      pendingQueries: this.pendingQueries.size,
      cacheHitRate: this.calculateHitRate()
    }
  }

  private static hitCount = 0
  private static totalRequests = 0

  private static calculateHitRate(): number {
    if (this.totalRequests === 0) return 0
    return (this.hitCount / this.totalRequests) * 100
  }

  // Increment hit/miss counters
  static recordCacheHit() {
    this.hitCount++
    this.totalRequests++
  }

  static recordCacheMiss() {
    this.totalRequests++
  }
}

// Batch operations for better performance
export class BatchOperations {
  private static batchQueue: Array<{ operation: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = []
  private static batchTimeout: NodeJS.Timeout | null = null
  private static readonly BATCH_DELAY = 50 // 50ms

  // Add operation to batch queue
  static async batchOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ operation, resolve, reject })
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }
      
      this.batchTimeout = setTimeout(() => {
        this.executeBatch()
      }, this.BATCH_DELAY)
    })
  }

  // Execute all queued operations
  private static async executeBatch() {
    const operations = [...this.batchQueue]
    this.batchQueue = []
    this.batchTimeout = null

    if (operations.length === 0) return

    try {
      // Execute operations in parallel (up to 5 at a time)
      const batchSize = 5
      const results = []
      
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(op => op.operation())
        )
        results.push(...batchResults)
      }

      // Resolve/reject each operation
      operations.forEach((op, index) => {
        const result = results[index]
        if (result.status === 'fulfilled') {
          op.resolve(result.value)
        } else {
          op.reject(result.reason)
        }
      })
    } catch (error) {
      // If batch execution fails, reject all operations
      operations.forEach(op => op.reject(error))
    }
  }
}

// Database connection health monitoring
export class DBHealthMonitor {
  private static healthChecks: Array<{ timestamp: number; duration: number; success: boolean }> = []
  private static readonly MAX_HEALTH_CHECKS = 100

  // Perform health check
  static async performHealthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      // Simple query to test connection
      const { data, error } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
      
      const duration = Date.now() - startTime
      
      if (error) {
        this.recordHealthCheck(duration, false)
        return { healthy: false, latency: duration, error: error.message }
      }
      
      this.recordHealthCheck(duration, true)
      return { healthy: true, latency: duration }
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordHealthCheck(duration, false)
      return { 
        healthy: false, 
        latency: duration, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private static recordHealthCheck(duration: number, success: boolean) {
    this.healthChecks.push({ timestamp: Date.now(), duration, success })
    
    // Keep only recent health checks
    if (this.healthChecks.length > this.MAX_HEALTH_CHECKS) {
      this.healthChecks = this.healthChecks.slice(-this.MAX_HEALTH_CHECKS)
    }
  }

  // Get health statistics
  static getHealthStats() {
    const now = Date.now()
    const recentChecks = this.healthChecks.filter(
      check => (now - check.timestamp) < 5 * 60 * 1000 // Last 5 minutes
    )
    
    if (recentChecks.length === 0) {
      return { successRate: 100, avgLatency: 0, totalChecks: 0 }
    }
    
    const successfulChecks = recentChecks.filter(check => check.success)
    const successRate = (successfulChecks.length / recentChecks.length) * 100
    const avgLatency = recentChecks.reduce((sum, check) => sum + check.duration, 0) / recentChecks.length
    
    return {
      successRate: Math.round(successRate * 100) / 100,
      avgLatency: Math.round(avgLatency),
      totalChecks: recentChecks.length
    }
  }
}

// Query performance monitoring
export class QueryMonitor {
  private static queries: Array<{ 
    query: string; 
    duration: number; 
    timestamp: number; 
    success: boolean;
    error?: string;
  }> = []
  private static readonly MAX_QUERIES = 200

  // Monitor query performance
  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      this.recordQuery(queryName, duration, true)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordQuery(queryName, duration, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  private static recordQuery(query: string, duration: number, success: boolean, error?: string) {
    this.queries.push({ query, duration, timestamp: Date.now(), success, error })
    
    // Keep only recent queries
    if (this.queries.length > this.MAX_QUERIES) {
      this.queries = this.queries.slice(-this.MAX_QUERIES)
    }
  }

  // Get query performance statistics
  static getQueryStats() {
    const now = Date.now()
    const recentQueries = this.queries.filter(
      query => (now - query.timestamp) < 10 * 60 * 1000 // Last 10 minutes
    )
    
    if (recentQueries.length === 0) {
      return { totalQueries: 0, successRate: 100, avgDuration: 0, slowQueries: [] }
    }
    
    const successfulQueries = recentQueries.filter(query => query.success)
    const successRate = (successfulQueries.length / recentQueries.length) * 100
    const avgDuration = recentQueries.reduce((sum, query) => sum + query.duration, 0) / recentQueries.length
    
    // Find slow queries (above 1 second)
    const slowQueries = recentQueries
      .filter(query => query.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(query => ({
        query: query.query,
        duration: query.duration,
        timestamp: query.timestamp
      }))
    
    return {
      totalQueries: recentQueries.length,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration: Math.round(avgDuration),
      slowQueries
    }
  }
}

// Export optimization utilities
export const dbOptimizations = {
  QueryOptimizer,
  BatchOperations,
  DBHealthMonitor,
  QueryMonitor,
  DB_CONFIG
}
