import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key');

// Only throw error in production
if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co')) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Clinic {
  id: string
  name: string
  slug: string
  domain?: string
  logo_url?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  working_hours: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  clinic_id: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled'
  original_date?: string
  original_time?: string
  created_at: string
  updated_at: string
}

export interface SchedulingSettings {
  id: string
  clinic_id: string
  day_schedules: Record<number, DaySchedule>
  weekly_holidays: number[]
  custom_holidays: string[]
  disabled_appointments: boolean
  disable_until_date?: string
  disable_until_time?: string
  disabled_slots: string[]
  notification_settings: NotificationSettings
  created_at: string
  updated_at: string
}

export interface DaySchedule {
  start_time: string
  end_time: string
  break_start: string
  break_end: string
  slot_interval_minutes: number
  enabled: boolean
}

export interface NotificationSettings {
  email_notifications: boolean
  reminder_hours: number
  auto_confirm: boolean
}

// Database helper functions
export const clinicsApi = {
  // Get clinic by slug
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  // Get clinic by domain
  async getByDomain(domain: string) {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  }
}

export const appointmentsApi = {
  // Get all appointments for a clinic
  async getAll(clinicId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get appointments by date for a clinic
  async getByDate(clinicId: string, date: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .order('time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get appointments by status for a clinic
  async getByStatus(clinicId: string, status: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create new appointment
  async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update appointment
  async update(id: string, updates: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete appointment
  async delete(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Bulk update appointments
  async bulkUpdate(ids: string[], updates: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .in('id', ids)
      .select()
    
    if (error) throw error
    return data
  },

  // Bulk delete appointments
  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  },

  // Check for duplicate bookings (same date and time)
  async getByDateAndTime(clinicId: string, date: string, time: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .eq('time', time)
      .not('status', 'eq', 'Cancelled') // Exclude cancelled appointments
    
    if (error) throw error
    return data
  }
}

export const settingsApi = {
  // Get settings for a clinic
  async get(clinicId: string) {
    const { data, error } = await supabase
      .from('scheduling_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  },

  // Create or update settings for a clinic
  async upsert(settings: Omit<SchedulingSettings, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('scheduling_settings')
      .upsert([settings], {
        onConflict: 'clinic_id' // Specify which column to use for conflict resolution
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Real-time subscriptions
export const subscribeToAppointments = (callback: (payload: any) => void) => {
  return supabase
    .channel('appointments_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'appointments' }, 
      callback
    )
    .subscribe()
}

export const subscribeToSettings = (callback: (payload: any) => void) => {
  return supabase
    .channel('settings_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'scheduling_settings' }, 
      callback
    )
    .subscribe()
}
