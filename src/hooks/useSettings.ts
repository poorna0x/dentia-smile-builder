import { useState, useEffect, useCallback } from 'react'
import { settingsApi, subscribeToSettings, type SchedulingSettings } from '@/lib/supabase'
import { useClinic } from '@/contexts/ClinicContext'

export const useSettings = () => {
  const { clinic } = useClinic()
  const [settings, setSettings] = useState<SchedulingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial settings
  const loadSettings = useCallback(async () => {
    if (!clinic?.id) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await settingsApi.get(clinic.id)
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [clinic?.id])

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<SchedulingSettings>) => {
    if (!clinic?.id) throw new Error('No clinic selected')

    try {
      setError(null)
      const updatedSettings = await settingsApi.upsert({
        ...settings,
        ...updates,
        clinic_id: clinic.id
      })
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      throw err
    }
  }, [settings, clinic?.id])

  // Set up real-time subscription
  useEffect(() => {
    if (!clinic?.id) return
    
    loadSettings()

    const subscription = subscribeToSettings((payload) => {
      // Only handle events for current clinic
      if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSettings(payload.new)
        } else if (payload.eventType === 'DELETE') {
          setSettings(null)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadSettings, clinic?.id])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings
  }
}
