// 🚀 Optimized Real-time System for Single Clinic
// =====================================================
// 
// Features:
// ✅ Single subscription channel
// ✅ Smart caching with invalidation
// ✅ Debounced updates
// ✅ Minimal database calls
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Simple cache for real-time data
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
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
}

// Global cache instance
const simpleCache = new SimpleCache()

// Simple real-time manager
class SimpleRealtimeManager {
  private supabase: SupabaseClient
  private channel: any = null
  private isConnected = false
  private listeners = new Map<string, Set<Function>>()

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // Subscribe to real-time changes
  subscribe(table: string, callback: Function, options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    filter?: string
    debounceMs?: number
  } = {}) {
    const { event = '*', filter, debounceMs = 1000 } = options
    const key = `${table}_${event}_${filter || 'all'}`
    
    // Add listener
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)

    // Connect if not already connected
    if (!this.isConnected) {
      this.connect()
    }

    return () => {
      // Remove listener
      this.listeners.get(key)?.delete(callback)
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  // Connect to real-time
  private connect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
    }

    this.channel = this.supabase
      .channel('simple_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        this.handleAppointmentChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scheduling_settings'
      }, (payload) => {
        this.handleSettingsChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'disabled_slots'
      }, (payload) => {
        this.handleDisabledSlotsChange(payload)
      })
      .subscribe((status) => {
        this.isConnected = status === 'SUBSCRIBED'
        if (this.isConnected) {
          console.log('✅ Simple real-time connected')
        } else {
          console.log('❌ Simple real-time disconnected')
        }
      })
  }

  // Handle appointment changes
  private handleAppointmentChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Invalidate appointment cache
    simpleCache.invalidate('appointments')
    
    // Notify listeners with debounce
    setTimeout(() => {
      this.listeners.get('appointments_*_all')?.forEach(listener => {
        try {
          listener({ eventType, new: newRecord, old: oldRecord })
        } catch (error) {
          console.error('Appointment listener error:', error)
        }
      })
    }, 1000)
  }

  // Handle settings changes
  private handleSettingsChange(payload: any) {
    const { eventType, new: newRecord } = payload
    
    // Invalidate settings cache
    simpleCache.invalidate('scheduling_settings')
    
    // Immediate update for settings
    this.listeners.get('scheduling_settings_*_all')?.forEach(listener => {
      try {
        listener({ eventType, new: newRecord })
      } catch (error) {
        console.error('Settings listener error:', error)
      }
    })
  }

  // Handle disabled slots changes
  private handleDisabledSlotsChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Invalidate disabled slots cache
    simpleCache.invalidate('disabled_slots')
    
    // Notify listeners with debounce
    setTimeout(() => {
      this.listeners.get('disabled_slots_*_all')?.forEach(listener => {
        try {
          listener({ eventType, new: newRecord, old: oldRecord })
        } catch (error) {
          console.error('Disabled slots listener error:', error)
        }
      })
    }, 1000)
  }

  // Disconnect
  disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
      this.isConnected = false
    }
    this.listeners.clear()
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      activeListeners: this.listeners.size
    }
  }
}

// Global real-time manager instance
let realtimeManager: SimpleRealtimeManager | null = null

// Initialize real-time manager
export const initializeRealtime = (supabase: SupabaseClient) => {
  if (!realtimeManager) {
    realtimeManager = new SimpleRealtimeManager(supabase)
  }
  return realtimeManager
}

// Get real-time manager
export const getRealtimeManager = () => {
  if (!realtimeManager) {
    throw new Error('Realtime manager not initialized. Call initializeRealtime first.')
  }
  return realtimeManager
}

// Simple hooks for React components
export const useOptimizedRealtime = () => {
  const subscribe = (table: string, callback: Function, options?: any) => {
    const manager = getRealtimeManager()
    return manager.subscribe(table, callback, options)
  }

  const getCache = (key: string) => simpleCache.get(key)
  const setCache = (key: string, data: any) => simpleCache.set(key, data)
  const invalidateCache = (pattern: string) => simpleCache.invalidate(pattern)

  return {
    subscribe,
    getCache,
    setCache,
    invalidateCache,
    getConnectionStatus: () => getRealtimeManager().getConnectionStatus()
  }
}

// Simple API functions with caching
export const optimizedApi = {
  // Get appointments with caching
  async getAppointments(supabase: SupabaseClient, clinicId: string) {
    const cacheKey = `appointments_${clinicId}`
    const cached = simpleCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) throw error

    simpleCache.set(cacheKey, data)
    return data
  },

  // Get settings with caching
  async getSettings(supabase: SupabaseClient, clinicId: string) {
    const cacheKey = `settings_${clinicId}`
    const cached = simpleCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('scheduling_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .single()

    if (error) throw error

    simpleCache.set(cacheKey, data)
    return data
  },

  // Get disabled slots with caching
  async getDisabledSlots(supabase: SupabaseClient, clinicId: string, date?: string) {
    const cacheKey = `disabled_slots_${clinicId}_${date || 'all'}`
    const cached = simpleCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    let query = supabase
      .from('disabled_slots')
      .select('*')
      .eq('clinic_id', clinicId)

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) throw error

    simpleCache.set(cacheKey, data)
    return data
  }
}

// Cleanup function
export const cleanupRealtime = () => {
  if (realtimeManager) {
    realtimeManager.disconnect()
    realtimeManager = null
  }
  simpleCache.clear()
}
