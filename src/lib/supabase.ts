import { createClient } from '@supabase/supabase-js'
import { QueryOptimizer, QueryMonitor, BatchOperations } from './db-optimizations'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl !== 'undefined' &&
  supabaseAnonKey !== 'undefined');

// Provide fallback for development
const fallbackUrl = import.meta.env.DEV ? 'https://your-project.supabase.co' : ''
const fallbackKey = import.meta.env.DEV ? 'your-anon-key' : ''

// Use fallbacks only in development
const finalUrl = supabaseUrl || fallbackUrl
const finalKey = supabaseAnonKey || fallbackKey

// Only throw error in production if variables are missing
if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
  throw new Error('Missing Supabase environment variables. Please check your Netlify environment variables.')
}

export const supabase = createClient(finalUrl, finalKey)

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

export interface Dentist {
  id: string
  clinic_id: string
  name: string
  specialization?: string
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
  patient_id?: string
  dentist_id?: string
  created_at: string
  updated_at: string
}

export interface FollowUp {
  id: string
  clinic_id: string
  patient_id: string
  reason: string
  notes?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  created_at: string
  updated_at: string
  created_by?: string
  due_date?: string
  completed_at?: string
  completed_by?: string
}

export interface TreatmentType {
  id: string
  clinic_id: string
  name: string
  description?: string
  default_cost: number
  is_active: boolean
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
  show_stats_cards?: boolean
  minimum_advance_notice?: number
  notification_settings: NotificationSettings
  created_at: string
  updated_at: string
}

export interface DaySchedule {
  start_time: string
  end_time: string
  break_start: string[]  // Changed from string to string[] to support multiple breaks
  break_end: string[]    // Changed from string to string[] to support multiple breaks
  slot_interval_minutes: number
  enabled: boolean
}

export interface NotificationSettings {
  email_notifications: boolean
  reminder_hours: number
  auto_confirm: boolean
}

// Helper function to get minimum advance notice from settings
export const getMinimumAdvanceNotice = (settings: SchedulingSettings | null): number => {
  if (!settings) return 24; // Default fallback
  
  // Check if the value exists and is valid
  if (settings.minimum_advance_notice !== null && settings.minimum_advance_notice !== undefined) {
    return settings.minimum_advance_notice;
  }
  
  // Default fallback
  return 24;
};

export interface StaffPermissions {
  id: string
  clinic_id: string
  can_access_settings: boolean
  can_access_patient_portal: boolean
  created_at: string
  updated_at: string
}

export interface DisabledSlot {
  id: string
  clinic_id: string
  date: string
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export interface PatientPhone {
  id: string
  patient_id: string
  phone: string
  phone_type: 'primary' | 'secondary' | 'emergency' | 'family'
  is_primary: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
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
  // Get all appointments for a clinic (optimized with caching)
  async getAll(clinicId: string) {
    return QueryOptimizer.executeQuery(
      `appointments_all_${clinicId}`,
      async () => {
        return QueryMonitor.monitorQuery('getAll', async () => {
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          return data
        })
      },
      QueryOptimizer.CACHE_TTL.APPOINTMENTS
    )
  },

  // Get appointments by date for a clinic (optimized with caching)
  async getByDate(clinicId: string, date: string) {
    return QueryOptimizer.executeQuery(
      `appointments_date_${clinicId}_${date}`,
      async () => {
        return QueryMonitor.monitorQuery('getByDate', async () => {
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('date', date)
            .order('time', { ascending: true })
          
          if (error) throw error
          return data
        })
      },
      QueryOptimizer.CACHE_TTL.APPOINTMENTS
    )
  },

  // Get appointments by status for a clinic (optimized with caching)
  async getByStatus(clinicId: string, status: string) {
    return QueryOptimizer.executeQuery(
      `appointments_status_${clinicId}_${status}`,
      async () => {
        return QueryMonitor.monitorQuery('getByStatus', async () => {
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('status', status)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          return data
        })
      },
      QueryOptimizer.CACHE_TTL.APPOINTMENTS
    )
  },

  // Create new appointment
  async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) {
    console.log('📝 appointmentsApi.create called with:', appointment);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select()
      .single()
    
    if (error) {
      console.error('❌ appointmentsApi.create error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ appointmentsApi.create success:', data);
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
  // Get settings for a clinic (optimized with caching)
  async get(clinicId: string) {
    return QueryOptimizer.executeQuery(
      `settings_${clinicId}`,
      async () => {
        return QueryMonitor.monitorQuery('getSettings', async () => {
          const { data, error } = await supabase
            .from('scheduling_settings')
            .select('*')
            .eq('clinic_id', clinicId)
            .single()
          
          if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
          return data
        })
      },
      QueryOptimizer.CACHE_TTL.SETTINGS
    )
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

// Disabled slots API
export const disabledSlotsApi = {
  // Get disabled slots for a clinic and date range
  async getByClinicAndDateRange(clinicId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('disabled_slots')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get disabled slots for a specific date
  async getByClinicAndDate(clinicId: string, date: string) {
    const { data, error } = await supabase
      .from('disabled_slots')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Add a disabled slot
  async create(slot: Omit<DisabledSlot, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('disabled_slots')
      .insert([slot])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a disabled slot
  async update(id: string, updates: Partial<DisabledSlot>) {
    const { data, error } = await supabase
      .from('disabled_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a disabled slot
  async delete(id: string) {
    const { error } = await supabase
      .from('disabled_slots')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Bulk delete disabled slots
  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('disabled_slots')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  }
}

export const subscribeToDisabledSlots = (callback: (payload: any) => void) => {
  return supabase
    .channel('disabled_slots_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'disabled_slots' }, 
      callback
    )
    .subscribe()
}

// Dentists API
export const dentistsApi = {
  // Get all dentists for a clinic
  async getAll(clinicId: string) {
    const { data, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get a single dentist
  async getById(id: string) {
    const { data, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create a new dentist
  async create(dentist: Omit<Dentist, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('dentists')
      .insert([dentist])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a dentist
  async update(id: string, updates: Partial<Dentist>) {
    const { data, error } = await supabase
      .from('dentists')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a dentist (soft delete by setting is_active to false)
  async delete(id: string) {
    const { data, error } = await supabase
      .from('dentists')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get dentist performance statistics
  async getPerformance(clinicId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .rpc('get_dentist_performance', {
        clinic_uuid: clinicId,
        start_date: startDate,
        end_date: endDate
      })
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }
}

export const subscribeToDentists = (callback: (payload: any) => void) => {
  return supabase
    .channel('dentists_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'dentists' }, 
      callback
    )
    .subscribe()
}

// Staff Permissions API
export const staffPermissionsApi = {
  // Get staff permissions for a clinic
  async getByClinic(clinicId: string) {
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('clinic_id', clinicId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }
    
    // Handle case where columns might not exist yet
    if (data) {
      return {
        ...data,
        can_access_settings: data.can_change_settings ?? false, // Map to correct column
        can_access_patient_portal: data.can_access_patient_portal ?? false
      };
    }
    
    return data;
  },

  // Create or update staff permissions
  async upsert(clinicId: string, permissions: {
    can_access_settings: boolean;
    can_access_patient_portal: boolean;
  }) {
    const { data, error } = await supabase
      .from('staff_permissions')
      .upsert({
        clinic_id: clinicId,
        can_view_appointments: true,
        can_mark_complete: true,
        can_view_patient_basic_info: true,
        can_change_settings: permissions.can_access_settings, // Use the correct column name
        can_access_patient_portal: permissions.can_access_patient_portal
      }, {
        onConflict: 'clinic_id'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const subscribeToStaffPermissions = (callback: (payload: any) => void) => {
  return supabase
    .channel('staff_permissions_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'staff_permissions' }, 
      callback
    )
    .subscribe()
}

// Follow-ups API
export const followUpsApi = {
  // Get all follow-ups for a clinic
  async getByClinic(clinicId: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get follow-ups for a specific patient
  async getByPatient(patientId: string, clinicId: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create a new follow-up
  async create(followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert(followUp)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a follow-up
  async update(id: string, updates: Partial<FollowUp>) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a follow-up
  async delete(id: string) {
    const { error } = await supabase
      .from('follow_ups')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Mark follow-up as completed
  async markCompleted(id: string, completedBy: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        completed_by: completedBy
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const subscribeToFollowUps = (callback: (payload: any) => void) => {
  return supabase
    .channel('follow_ups_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'follow_ups' }, 
      callback
    )
    .subscribe()
}

// Treatment Types API
export const treatmentTypesApi = {
  // Get all treatment types for a clinic
  async getAll(clinicId: string) {
    const { data, error } = await supabase
      .from('treatment_types')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get a specific treatment type
  async getById(id: string) {
    const { data, error } = await supabase
      .from('treatment_types')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create a new treatment type
  async create(treatmentType: Omit<TreatmentType, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('treatment_types')
      .insert(treatmentType)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a treatment type
  async update(id: string, updates: Partial<TreatmentType>) {
    const { data, error } = await supabase
      .from('treatment_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a treatment type (soft delete by setting is_active to false)
  async delete(id: string) {
    const { data, error } = await supabase
      .from('treatment_types')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Hard delete a treatment type
  async hardDelete(id: string) {
    const { error } = await supabase
      .from('treatment_types')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
