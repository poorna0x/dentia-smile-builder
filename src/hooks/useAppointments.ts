import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { appointmentsApi, subscribeToAppointments, type Appointment } from '@/lib/supabase'
import { useClinic } from '@/contexts/ClinicContext'

// Cache for appointments by date
const appointmentsCache = new Map<string, { data: Appointment[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

export const useAppointments = () => {
  const { clinic } = useClinic()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load initial appointments with caching and optimization
  const loadAppointments = useCallback(async (forceRefresh = false) => {
    if (!clinic?.id) return
    
    // Check cache first
    const cacheKey = `appointments_${clinic.id}`
    const cached = appointmentsCache.get(cacheKey)
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setAppointments(cached.data)
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
      
      const data = await appointmentsApi.getAll(clinic.id)
      
      // Update cache
      appointmentsCache.set(cacheKey, { data, timestamp: now })
      setAppointments(data)
      setLastFetch(now)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [clinic?.id])

  // Create new appointment
  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    try {
      setError(null)
      const newAppointment = await appointmentsApi.create({
        ...appointmentData,
        clinic_id: clinic.id
      })
      setAppointments(prev => [newAppointment, ...prev])
      return newAppointment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
      throw err
    }
  }, [clinic?.id])

  // Update appointment
  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    try {
      setError(null)
      const updatedAppointment = await appointmentsApi.update(id, updates)
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? updatedAppointment : apt)
      )
      return updatedAppointment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
      throw err
    }
  }, [])

  // Delete appointment
  const deleteAppointment = useCallback(async (id: string) => {
    try {
      setError(null)
      await appointmentsApi.delete(id)
      setAppointments(prev => prev.filter(apt => apt.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment')
      throw err
    }
  }, [])

  // Bulk update appointments
  const bulkUpdateAppointments = useCallback(async (ids: string[], updates: Partial<Appointment>) => {
    try {
      setError(null)
      const updatedAppointments = await appointmentsApi.bulkUpdate(ids, updates)
      setAppointments(prev => 
        prev.map(apt => {
          const updated = updatedAppointments.find(u => u.id === apt.id)
          return updated || apt
        })
      )
      return updatedAppointments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update appointments')
      throw err
    }
  }, [])

  // Bulk delete appointments
  const bulkDeleteAppointments = useCallback(async (ids: string[]) => {
    try {
      setError(null)
      await appointmentsApi.bulkDelete(ids)
      setAppointments(prev => prev.filter(apt => !ids.includes(apt.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete appointments')
      throw err
    }
  }, [])

  // Get appointments by date with caching
  const getAppointmentsByDate = useCallback(async (date: string) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    // Check cache first
    const cacheKey = `appointments_${clinic.id}_${date}`
    const cached = appointmentsCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }
    
    try {
      setError(null)
      const data = await appointmentsApi.getByDate(clinic.id, date)
      
      // Update cache
      appointmentsCache.set(cacheKey, { data, timestamp: now })
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments by date')
      throw err
    }
  }, [clinic?.id])

  // Get appointments by status
  const getAppointmentsByStatus = useCallback(async (status: string) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    try {
      setError(null)
      const data = await appointmentsApi.getByStatus(clinic.id, status)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments by status')
      throw err
    }
  }, [clinic?.id])

  // Optimized real-time subscription with debouncing and reduced frequency
  useEffect(() => {
    if (!clinic?.id) return
    
    loadAppointments()

    // Debounced cache invalidation with longer delay
    const debouncedCacheInvalidation = debounce(() => {
      const cacheKey = `appointments_${clinic.id}`
      appointmentsCache.delete(cacheKey)
    }, 2000) // Increased from 1000ms to 2000ms

    const subscription = subscribeToAppointments((payload) => {
      // Only handle events for current clinic
      if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
        // Debounced state updates to reduce re-renders
        const debouncedUpdate = debounce(() => {
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [payload.new, ...prev])
            debouncedCacheInvalidation()
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => 
              prev.map(apt => apt.id === payload.new.id ? payload.new : apt)
            )
            debouncedCacheInvalidation()
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(apt => apt.id !== payload.old.id))
            debouncedCacheInvalidation()
          }
        }, 1000) // 1 second debounce for state updates
        
        debouncedUpdate()
      }
    })

    return () => {
      subscription.unsubscribe()
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadAppointments, clinic?.id])

  // Memoized computed values for better performance
  const memoizedAppointments = useMemo(() => appointments, [appointments])
  const isStale = useMemo(() => {
    const now = Date.now()
    return (now - lastFetch) > CACHE_DURATION
  }, [lastFetch])

  return {
    appointments: memoizedAppointments,
    loading,
    error,
    isStale,
    lastFetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    bulkUpdateAppointments,
    bulkDeleteAppointments,
    getAppointmentsByDate,
    getAppointmentsByStatus,
    refresh: () => loadAppointments(true),
    clearCache: () => {
      appointmentsCache.clear()
    }
  }
}
