import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Clinic, supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useSearchParams } from 'react-router-dom'

interface ClinicContextType {
  clinic: Clinic | null
  loading: boolean
  error: string | null
  setClinic: (clinic: Clinic | null) => void
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined)

export const useClinic = () => {
  const context = useContext(ClinicContext)
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider')
  }
  return context
}

interface ClinicProviderProps {
  children: ReactNode
}

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children }) => {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  // Check if URL has specific clinic parameter (for testing different clinics)
  const urlClinicSlug = searchParams.get('clinic')

  useEffect(() => {
    const loadClinic = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // If Supabase is not configured, show error
        if (!isSupabaseConfigured) {
          setError('Supabase is not configured. Please check your environment variables.')
          setLoading(false)
          return
        }

        let clinicData: Clinic | null = null

        // If URL has specific clinic parameter, try to get that clinic
        if (urlClinicSlug) {
          try {
            const { data, error } = await supabase
              .from('clinics')
              .select('*')
              .eq('slug', urlClinicSlug)
              .eq('is_active', true)
              .single()
            
            if (error) {
              console.warn(`Clinic with slug '${urlClinicSlug}' not found:`, error)
            } else {
              clinicData = data
            }
          } catch (err) {
            console.warn(`Error finding clinic by slug '${urlClinicSlug}':`, err)
          }
        }

        // If no specific clinic found or no URL parameter, get the first available clinic
        if (!clinicData) {
          try {
            const { data, error } = await supabase
              .from('clinics')
              .select('*')
              .eq('is_active', true)
              .limit(1)
              .single()
            
            if (error) {
              throw error
            } else {
              clinicData = data
            }
          } catch (err) {
            throw err
          }
        }

        if (clinicData) {
          setClinic(clinicData)
        } else {
          setError('No clinic found in database. Please set up your clinic first.')
        }
      } catch (err) {
        console.error('Failed to load clinic:', err)
        setError(err instanceof Error ? err.message : 'Failed to load clinic')
      } finally {
        setLoading(false)
      }
    }

    loadClinic()
  }, [urlClinicSlug])

  const value: ClinicContextType = {
    clinic,
    loading,
    error,
    setClinic,
  }

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  )
}
