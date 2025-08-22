import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Clinic, clinicsApi, isSupabaseConfigured } from '@/lib/supabase'
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
  clinicSlug?: string
}

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children, clinicSlug = 'jeshna-dental' }) => { // TODO: Change default clinic slug to your clinic
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  // Get clinic slug from URL parameter, environment variable, or use default
  const defaultClinicSlug = import.meta.env.VITE_DEFAULT_CLINIC_SLUG || clinicSlug
  const currentClinicSlug = searchParams.get('clinic') || defaultClinicSlug

  useEffect(() => {
    const loadClinic = async () => {
      try {
        // Loading clinic data
        setLoading(true)
        setError(null)
        
        // If Supabase is not configured, use default clinic
        if (!isSupabaseConfigured) {
          // Supabase not configured, using default clinic data
          const defaultClinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID || 'default-clinic-id'
          setClinic({
            id: defaultClinicId,
            name: 'Jeshna Dental Clinic', // TODO: Change to your clinic name
            slug: currentClinicSlug,
            contact_phone: '6363116263', // TODO: Change to your clinic phone number
            contact_email: 'poorn8105@gmail.com', // TODO: Change to your clinic email
            address: 'Bangalore, Karnataka', // TODO: Change to your clinic address
            working_hours: {},
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          setLoading(false)
          return
        }
        
        // Try to get clinic by slug
        // Fetching clinic data from Supabase
        const clinicData = await clinicsApi.getBySlug(currentClinicSlug)
                  // Clinic data loaded
        setClinic(clinicData)
      } catch (err) {
        console.error('❌ Failed to load clinic:', err)
        setError(err instanceof Error ? err.message : 'Failed to load clinic')
        
        // Fallback to default clinic data
        const defaultClinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID || 'default-clinic-id'
        setClinic({
          id: defaultClinicId,
          name: 'Jeshna Dental Clinic', // TODO: Change to your clinic name
          slug: currentClinicSlug,
          contact_phone: '6363116263', // TODO: Change to your clinic phone number
          contact_email: 'poorn8105@gmail.com', // TODO: Change to your clinic email
          address: 'Bangalore, Karnataka', // TODO: Change to your clinic address
          working_hours: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } finally {
        // Clinic loading completed, setting loading to false
        setLoading(false)
      }
    }

    loadClinic()
  }, [currentClinicSlug])

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
