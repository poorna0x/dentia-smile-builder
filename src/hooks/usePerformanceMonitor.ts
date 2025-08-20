import { useState, useEffect, useCallback } from 'react'
import { DBHealthMonitor, QueryMonitor, QueryOptimizer } from '@/lib/db-optimizations'

interface PerformanceStats {
  dbHealth: {
    healthy: boolean
    latency: number
    successRate: number
    avgLatency: number
    totalChecks: number
  }
  queryStats: {
    totalQueries: number
    successRate: number
    avgDuration: number
    slowQueries: Array<{
      query: string
      duration: number
      timestamp: number
    }>
  }
  cacheStats: {
    totalSize: number
    expiredKeys: number
    pendingQueries: number
    cacheHitRate: number
  }
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
}

export const usePerformanceMonitor = (intervalMs: number = 30000) => {
  const [stats, setStats] = useState<PerformanceStats>({
    dbHealth: {
      healthy: true,
      latency: 0,
      successRate: 100,
      avgLatency: 0,
      totalChecks: 0
    },
    queryStats: {
      totalQueries: 0,
      successRate: 100,
      avgDuration: 0,
      slowQueries: []
    },
    cacheStats: {
      totalSize: 0,
      expiredKeys: 0,
      pendingQueries: 0,
      cacheHitRate: 0
    },
    memoryUsage: {
      used: 0,
      total: 0,
      percentage: 0
    }
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  // Get memory usage (if available)
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  }, [])

  // Update performance statistics
  const updateStats = useCallback(async () => {
    try {
      // Get database health stats
      const healthStats = DBHealthMonitor.getHealthStats()
      
      // Get query performance stats
      const queryStats = QueryMonitor.getQueryStats()
      
      // Get cache statistics
      const cacheStats = QueryOptimizer.getCacheStats()
      
      // Get memory usage
      const memoryUsage = getMemoryUsage()

      setStats({
        dbHealth: {
          healthy: healthStats.successRate > 95,
          latency: healthStats.avgLatency,
          successRate: healthStats.successRate,
          avgLatency: healthStats.avgLatency,
          totalChecks: healthStats.totalChecks
        },
        queryStats,
        cacheStats,
        memoryUsage
      })
    } catch (error) {
      console.error('Error updating performance stats:', error)
    }
  }, [getMemoryUsage])

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
  }, [])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // Perform health check
  const performHealthCheck = useCallback(async () => {
    try {
      const healthCheck = await DBHealthMonitor.performHealthCheck()
      return healthCheck
    } catch (error) {
      console.error('Health check failed:', error)
      return { healthy: false, latency: 0, error: 'Health check failed' }
    }
  }, [])

  // Clear cache
  const clearCache = useCallback((pattern?: string) => {
    QueryOptimizer.clearCache(pattern)
    updateStats()
  }, [updateStats])

  // Monitor performance periodically
  useEffect(() => {
    if (!isMonitoring) return

    // Initial update
    updateStats()

    // Set up interval
    const interval = setInterval(updateStats, intervalMs)

    return () => clearInterval(interval)
  }, [isMonitoring, intervalMs, updateStats])

  return {
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    performHealthCheck,
    clearCache,
    updateStats
  }
}
