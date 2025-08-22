// 🚀 Lightweight Real-time Simulation System
// =====================================================
// 
// Features:
// ✅ Smart polling with exponential backoff
// ✅ Intelligent caching with TTL
// ✅ Minimal database calls
// ✅ Simulates real-time behavior
// ✅ No actual real-time subscriptions
// =====================================================

import { SupabaseClient } from '@supabase/supabase-js'

// Smart cache with TTL and versioning
class SmartCache {
  private cache = new Map<string, { data: any; timestamp: number; version: number }>()
  private readonly DEFAULT_TTL = 30 * 1000 // 30 seconds
  private readonly MAX_CACHE_SIZE = 100

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    // Cleanup if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version: this.getVersion(key) + 1
    })
  }

  get(key: string, maxAge: number = this.DEFAULT_TTL) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  getVersion(key: string) {
    return this.cache.get(key)?.version || 0
  }

  invalidate(pattern: string) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Polling manager with exponential backoff
class PollingManager {
  private intervals = new Map<string, NodeJS.Timeout>()
  private callbacks = new Map<string, Set<Function>>()
  private lastUpdate = new Map<string, number>()
  private readonly BASE_INTERVAL = 5000 // 5 seconds
  private readonly MAX_INTERVAL = 60000 // 1 minute

  startPolling(key: string, callback: Function, interval: number = this.BASE_INTERVAL) {
    // Stop existing polling if any
    this.stopPolling(key)

    // Add callback
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set())
    }
    this.callbacks.get(key)!.add(callback)

    // Start polling
    const poll = async () => {
      try {
        const lastUpdate = this.lastUpdate.get(key) || 0
        const now = Date.now()
        
        // Call all callbacks
        this.callbacks.get(key)?.forEach(cb => {
          try {
            cb({ lastUpdate, currentTime: now })
          } catch (error) {
            console.error(`Polling callback error for ${key}:`, error)
          }
        })

        this.lastUpdate.set(key, now)
      } catch (error) {
        console.error(`Polling error for ${key}:`, error)
      }
    }

    // Initial call
    poll()

    // Set up interval with exponential backoff and tab visibility check
    let currentInterval = interval
    const intervalId = setInterval(() => {
      // Only poll if tab is active (free tier optimization)
      if (isTabActive) {
        poll()
        // Increase interval gradually (exponential backoff)
        currentInterval = Math.min(currentInterval * 1.2, this.MAX_INTERVAL)
      }
    }, currentInterval)

    this.intervals.set(key, intervalId)
  }

  stopPolling(key: string) {
    const interval = this.intervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
  }

  stopAll() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    this.callbacks.clear()
    this.lastUpdate.clear()
  }

  getStats() {
    return {
      activePolling: this.intervals.size,
      activeCallbacks: this.callbacks.size,
      lastUpdates: Object.fromEntries(this.lastUpdate)
    }
  }
}

// Global instances
const smartCache = new SmartCache()
const pollingManager = new PollingManager()

// Tab visibility management for free tier optimization
let isTabActive = true
document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden
  if (!isTabActive) {
    console.log('📱 Tab inactive - pausing polling to save calls')
  } else {
    console.log('📱 Tab active - resuming polling')
  }
})

// Lightweight real-time simulation
export class LightweightRealtime {
  private supabase: SupabaseClient
  private clinicId: string

  constructor(supabase: SupabaseClient, clinicId: string) {
    this.supabase = supabase
    this.clinicId = clinicId
  }

  // Simulate real-time appointments with smart polling
  async subscribeToAppointments(callback: (data: any) => void) {
    const key = `appointments_${this.clinicId}`
    
    // Initial data fetch
    const initialData = await this.fetchAppointments()
    callback({ type: 'INITIAL', data: initialData })

    // Start polling
    pollingManager.startPolling(key, async () => {
      const cached = smartCache.get(key, 30000) // 30 second cache (free tier optimized)
      if (cached) {
        callback({ type: 'CACHED', data: cached })
        return
      }

      const freshData = await this.fetchAppointments()
      smartCache.set(key, freshData, 10000)
      callback({ type: 'UPDATED', data: freshData })
    }, 60000) // Poll every 60 seconds (free tier optimized)

    return () => {
      pollingManager.stopPolling(key)
    }
  }

  // Simulate real-time settings with longer cache
  async subscribeToSettings(callback: (data: any) => void) {
    const key = `settings_${this.clinicId}`
    
    // Initial data fetch
    const initialData = await this.fetchSettings()
    callback({ type: 'INITIAL', data: initialData })

    // Start polling with longer intervals
    pollingManager.startPolling(key, async () => {
      const cached = smartCache.get(key, 180000) // 3 minute cache (free tier optimized)
      if (cached) {
        callback({ type: 'CACHED', data: cached })
        return
      }

      const freshData = await this.fetchSettings()
      smartCache.set(key, freshData, 60000)
      callback({ type: 'UPDATED', data: freshData })
    }, 300000) // Poll every 5 minutes (free tier optimized)

    return () => {
      pollingManager.stopPolling(key)
    }
  }

  // Simulate real-time disabled slots
  async subscribeToDisabledSlots(callback: (data: any) => void, date?: string) {
    const key = `disabled_slots_${this.clinicId}_${date || 'all'}`
    
    // Initial data fetch
    const initialData = await this.fetchDisabledSlots(date)
    callback({ type: 'INITIAL', data: initialData })

    // Start polling
    pollingManager.startPolling(key, async () => {
      const cached = smartCache.get(key, 60000) // 1 minute cache (free tier optimized)
      if (cached) {
        callback({ type: 'CACHED', data: cached })
        return
      }

      const freshData = await this.fetchDisabledSlots(date)
      smartCache.set(key, freshData, 15000)
      callback({ type: 'UPDATED', data: freshData })
    }, 120000) // Poll every 2 minutes (free tier optimized)

    return () => {
      pollingManager.stopPolling(key)
    }
  }

  // Optimized data fetching methods
  private async fetchAppointments() {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('id, patient_name, appointment_date, appointment_time, status, created_at')
      .eq('clinic_id', this.clinicId)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to recent appointments

    if (error) throw error
    return data || []
  }

  private async fetchSettings() {
    const { data, error } = await this.supabase
      .from('scheduling_settings')
      .select('*')
      .eq('clinic_id', this.clinicId)
      .single()

    if (error) throw error
    return data
  }

  private async fetchDisabledSlots(date?: string) {
    let query = this.supabase
      .from('disabled_slots')
      .select('*')
      .eq('clinic_id', this.clinicId)

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // Manual refresh methods
  async refreshAppointments() {
    const key = `appointments_${this.clinicId}`
    smartCache.invalidate(key)
    return await this.fetchAppointments()
  }

  async refreshSettings() {
    const key = `settings_${this.clinicId}`
    smartCache.invalidate(key)
    return await this.fetchSettings()
  }

  async refreshDisabledSlots(date?: string) {
    const key = `disabled_slots_${this.clinicId}_${date || 'all'}`
    smartCache.invalidate(key)
    return await this.fetchDisabledSlots(date)
  }

  // Cleanup
  disconnect() {
    pollingManager.stopAll()
  }

  // Get system stats
  getStats() {
    return {
      cache: smartCache.getStats(),
      polling: pollingManager.getStats()
    }
  }
}

// Global manager
let lightweightManager: LightweightRealtime | null = null

// Initialize lightweight real-time
export const initializeLightweightRealtime = (supabase: SupabaseClient, clinicId: string) => {
  if (!lightweightManager) {
    lightweightManager = new LightweightRealtime(supabase, clinicId)
  }
  return lightweightManager
}

// Get lightweight manager
export const getLightweightManager = () => {
  if (!lightweightManager) {
    throw new Error('Lightweight real-time manager not initialized.')
  }
  return lightweightManager
}

// React hook for lightweight real-time
export const useLightweightRealtime = (clinicId: string) => {
  const subscribeToAppointments = (callback: (data: any) => void) => {
    const manager = getLightweightManager()
    return manager.subscribeToAppointments(callback)
  }

  const subscribeToSettings = (callback: (data: any) => void) => {
    const manager = getLightweightManager()
    return manager.subscribeToSettings(callback)
  }

  const subscribeToDisabledSlots = (callback: (data: any) => void, date?: string) => {
    const manager = getLightweightManager()
    return manager.subscribeToDisabledSlots(callback, date)
  }

  const refreshAppointments = () => {
    const manager = getLightweightManager()
    return manager.refreshAppointments()
  }

  const refreshSettings = () => {
    const manager = getLightweightManager()
    return manager.refreshSettings()
  }

  const refreshDisabledSlots = (date?: string) => {
    const manager = getLightweightManager()
    return manager.refreshDisabledSlots(date)
  }

  const getStats = () => {
    const manager = getLightweightManager()
    return manager.getStats()
  }

  return {
    subscribeToAppointments,
    subscribeToSettings,
    subscribeToDisabledSlots,
    refreshAppointments,
    refreshSettings,
    refreshDisabledSlots,
    getStats
  }
}

// Cleanup function
export const cleanupLightweightRealtime = () => {
  if (lightweightManager) {
    lightweightManager.disconnect()
    lightweightManager = null
  }
  smartCache.clear()
}
