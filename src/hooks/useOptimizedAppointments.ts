import { useState, useEffect, useCallback, useMemo } from 'react'
import { useClinic } from '@/contexts/ClinicContext'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/lib/supabase'

// Fallback cache for when optimized real-time is not available
const fallbackCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useOptimizedAppointments = () => {
  const { clinic } = useClinic()
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fallback cache functions
  const getCache = (key: string) => {
    const cached = fallbackCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      fallbackCache.delete(key)
      return null
    }
    
    return cached.data
  }

  const setCache = (key: string, data: any) => {
    fallbackCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  const invalidateCache = (pattern: string) => {
    for (const [key] of fallbackCache) {
      if (key.includes(pattern)) {
        fallbackCache.delete(key)
      }
    }
  }

  // Load appointments with caching
  const loadAppointments = useCallback(async (forceRefresh = false) => {
    if (!clinic?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCache(`appointments_${clinic.id}`)
        if (cached) {
          setAppointments(cached)
          setLoading(false)
          return
        }
      }
      
      // Fetch from database
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAppointments(data || [])
      setCache(`appointments_${clinic.id}`, data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [clinic?.id])

  // Subscribe to real-time changes with fallback
  useEffect(() => {
    if (!clinic?.id) return

    // Load initial data
    loadAppointments()

    // Use lightweight real-time simulation
    const setupLightweightRealtime = async () => {
      try {
        const { initializeLightweightRealtime, useLightweightRealtime } = await import('@/lib/lightweight-realtime')
        
        // Initialize the lightweight real-time manager first
        initializeLightweightRealtime(supabase, clinic.id)
        
        const { subscribeToAppointments } = useLightweightRealtime(clinic.id)
        
        const unsubscribe = await subscribeToAppointments((update: any) => {
          // Appointments lightweight update
          
          if (update.type === 'UPDATED') {
            // Refresh appointments data
            loadAppointments()
          }
        })

        return unsubscribe
      } catch (error) {
        console.warn('⚠️ Lightweight real-time not available, using polling fallback:', error)
        
        // Simple polling fallback
        const interval = setInterval(() => {
          loadAppointments()
        }, 30000) // Poll every 30 seconds

        return () => {
          clearInterval(interval)
        }
      }
    }

    const unsubscribe = setupLightweightRealtime()
    
    return () => {
      unsubscribe.then(unsub => unsub?.())
      // Also cleanup the lightweight manager when component unmounts
      const cleanupManager = async () => {
        try {
          const { cleanupLightweightRealtime } = await import('@/lib/lightweight-realtime')
          cleanupLightweightRealtime()
        } catch (error) {
          console.warn('⚠️ Failed to cleanup lightweight real-time manager:', error)
        }
      }
      cleanupManager()
    }
  }, [clinic?.id, loadAppointments])

  // Create appointment
  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    try {
      setError(null)
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, clinic_id: clinic.id }])
        .select()
        .single()
      
      if (error) throw error
      
      // Invalidate cache to force refresh
      invalidateCache('appointments')
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
      throw err
    }
  }, [clinic?.id, invalidateCache])

  // Update appointment
  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Invalidate cache to force refresh
      invalidateCache('appointments')
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
      throw err
    }
  }, [invalidateCache])

  // Delete appointment
  const deleteAppointment = useCallback(async (id: string) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Invalidate cache to force refresh
      invalidateCache('appointments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment')
      throw err
    }
  }, [invalidateCache])

  // Get appointments by date
  const getAppointmentsByDate = useCallback(async (date: string) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    const cacheKey = `appointments_${clinic.id}_${date}`
    const cached = getCache(cacheKey)
    
    if (cached) {
      return cached
    }
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('date', date)
        .order('time')
      
      if (error) throw error
      
      setCache(cacheKey, data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments by date')
      throw err
    }
  }, [clinic?.id, getCache, setCache])

  // Memoized computed values
  const memoizedAppointments = useMemo(() => appointments, [appointments])
  
  const confirmedAppointments = useMemo(() => 
    appointments.filter(apt => apt.status === 'Confirmed'), [appointments])
  
  const completedAppointments = useMemo(() => 
    appointments.filter(apt => apt.status === 'Completed'), [appointments])
  
  const cancelledAppointments = useMemo(() => 
    appointments.filter(apt => apt.status === 'Cancelled'), [appointments])

  return {
    appointments: memoizedAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    refresh: () => loadAppointments(true),
    clearCache: () => invalidateCache('appointments')
  }
}
