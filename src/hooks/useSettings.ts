import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { settingsApi, subscribeToSettings, type SchedulingSettings } from '@/lib/supabase'
import { useClinic } from '@/contexts/ClinicContext'

// Cache for settings
const settingsCache = new Map<string, { data: SchedulingSettings, timestamp: number }>()
const SETTINGS_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes (settings change less frequently)

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

export const useSettings = () => {
  const { clinic } = useClinic()
  const [settings, setSettings] = useState<SchedulingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load initial settings with caching
  const loadSettings = useCallback(async (forceRefresh = false) => {
    if (!clinic?.id) return
    
    // Check cache first
    const cacheKey = `settings_${clinic.id}`
    const cached = settingsCache.get(cacheKey)
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < SETTINGS_CACHE_DURATION) {
      setSettings(cached.data)
      setLoading(false)
      return
    }
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError(null)
      
      const data = await settingsApi.get(clinic.id)
      
      // Update cache
      settingsCache.set(cacheKey, { data, timestamp: now })
      setSettings(data)
      setLastFetch(now)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [clinic?.id])

  // Update settings with optimistic updates and debouncing
  const updateSettings = useCallback(async (updates: Partial<SchedulingSettings>) => {
    if (!clinic?.id) throw new Error('No clinic selected')

    // Optimistic update
    const optimisticSettings = settings ? { ...settings, ...updates } : null
    setSettings(optimisticSettings)

    try {
      setError(null)
      const updatedSettings = await settingsApi.upsert({
        ...settings,
        ...updates,
        clinic_id: clinic.id
      })
      
      // Update cache
      const cacheKey = `settings_${clinic.id}`
      settingsCache.set(cacheKey, { data: updatedSettings, timestamp: Date.now() })
      
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err) {
      // Revert optimistic update on error
      setSettings(settings)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      throw err
    }
  }, [settings, clinic?.id])

  // Optimized real-time subscription
  useEffect(() => {
    if (!clinic?.id) return
    
    loadSettings()

    // Debounced cache invalidation
    const debouncedCacheInvalidation = debounce(() => {
      const cacheKey = `settings_${clinic.id}`
      settingsCache.delete(cacheKey)
    }, 2000) // Longer debounce for settings

    const subscription = subscribeToSettings((payload) => {
      // Only handle events for current clinic
      if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSettings(payload.new)
          debouncedCacheInvalidation()
        } else if (payload.eventType === 'DELETE') {
          setSettings(null)
          debouncedCacheInvalidation()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadSettings, clinic?.id])

  // Memoized computed values
  const memoizedSettings = useMemo(() => settings, [settings])
  const isStale = useMemo(() => {
    const now = Date.now()
    return (now - lastFetch) > SETTINGS_CACHE_DURATION
  }, [lastFetch])

  return {
    settings: memoizedSettings,
    loading,
    error,
    isStale,
    lastFetch,
    updateSettings,
    refresh: () => loadSettings(true),
    clearCache: () => {
      settingsCache.clear()
    }
  }
}
