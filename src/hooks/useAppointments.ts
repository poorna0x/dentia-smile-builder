import { useState, useEffect, useCallback } from 'react'
import { appointmentsApi, subscribeToAppointments, type Appointment } from '@/lib/supabase'
import { useClinic } from '@/contexts/ClinicContext'

export const useAppointments = () => {
  const { clinic } = useClinic()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial appointments
  const loadAppointments = useCallback(async () => {
    if (!clinic?.id) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await appointmentsApi.getAll(clinic.id)
      setAppointments(data)
    } catch (err) {
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

  // Get appointments by date
  const getAppointmentsByDate = useCallback(async (date: string) => {
    if (!clinic?.id) throw new Error('No clinic selected')
    
    try {
      setError(null)
      const data = await appointmentsApi.getByDate(clinic.id, date)
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

  // Set up real-time subscription
  useEffect(() => {
    if (!clinic?.id) return
    
    loadAppointments()

    const subscription = subscribeToAppointments((payload) => {
      // Only handle events for current clinic
      if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
        if (payload.eventType === 'INSERT') {
          setAppointments(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setAppointments(prev => 
            prev.map(apt => apt.id === payload.new.id ? payload.new : apt)
          )
        } else if (payload.eventType === 'DELETE') {
          setAppointments(prev => prev.filter(apt => apt.id !== payload.old.id))
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadAppointments, clinic?.id])

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    bulkUpdateAppointments,
    bulkDeleteAppointments,
    getAppointmentsByDate,
    getAppointmentsByStatus,
    refresh: loadAppointments
  }
}
