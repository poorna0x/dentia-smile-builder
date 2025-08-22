import { supabase } from './supabase'

// =====================================================
// 🦷 DENTAL TREATMENT TYPES
// =====================================================

export interface DentalTreatment {
  id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  tooth_number: string
  tooth_position: string
  treatment_type: string
  treatment_description?: string
  treatment_status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled'
  treatment_date?: string
  cost?: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ToothCondition {
  id: string
  clinic_id: string
  patient_id: string
  tooth_number: string
  tooth_position: string
  condition_type: string
  condition_description?: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  last_updated: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DentalNote {
  id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  note_type: 'General' | 'Examination' | 'Treatment' | 'Follow-up' | 'Emergency'
  title: string
  content: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  is_private: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// =====================================================
// 🦷 TOOTH CHART UTILITIES
// =====================================================

export const toothChartUtils = {
  // Universal tooth numbering system (1-32)
  getAllTeeth: () => {
    const teeth = []
    for (let i = 1; i <= 32; i++) {
      teeth.push(i.toString().padStart(2, '0'))
    }
    return teeth
  },

  // Get tooth position based on number
  getToothPosition: (toothNumber: string): string => {
    const num = parseInt(toothNumber)
    if (num >= 1 && num <= 8) return 'Upper Right'
    if (num >= 9 && num <= 16) return 'Upper Left'
    if (num >= 17 && num <= 24) return 'Lower Left'
    if (num >= 25 && num <= 32) return 'Lower Right'
    return 'Unknown'
  },

  // Get tooth name (common names)
  getToothName: (toothNumber: string): string => {
    const num = parseInt(toothNumber)
    const positions = ['Central Incisor', 'Lateral Incisor', 'Canine', 'First Premolar', 'Second Premolar', 'First Molar', 'Second Molar', 'Third Molar']
    const position = positions[(num - 1) % 8]
    const quadrant = Math.ceil(num / 8)
    return `${position} (Quadrant ${quadrant})`
  },

  // Treatment types
  getTreatmentTypes: () => [
    // Common treatments
    'Cleaning',
    'Filling',
    'Root Canal',
    'Extraction',
    'Crown',
    'Bridge',
    'Implant',
    'Whitening',
    'Sealant',
    'Fluoride Treatment',
    'X-Ray',
    'Consultation',
    'Emergency Treatment',
    // Orthodontic treatments
    'Braces Installation',
    'Braces Adjustment',
    'Braces Removal',
    'Retainer Fitting',
    'Retainer Adjustment',
    'Clear Aligners',
    'Orthodontic Consultation',
    'Other'
  ],

  // Condition types
  getConditionTypes: () => [
    // Common conditions
    'Healthy',
    'Cavity',
    'Filled',
    'Crown',
    'Missing',
    'Sensitive',
    'Chipped',
    'Cracked',
    'Infected',
    'Decay',
    'Gum Disease',
    // Orthodontic conditions
    'Braces On',
    'Braces Off',
    'Retainer On',
    'Retainer Off',
    'Aligner On',
    'Aligner Off',
    'Orthodontic Treatment',
    'Other'
  ]
}

// =====================================================
// 🦷 DENTAL TREATMENT API
// =====================================================

export const dentalTreatmentApi = {
  // Create new dental treatment
  create: async (treatment: Omit<DentalTreatment, 'id' | 'created_at' | 'updated_at'>): Promise<DentalTreatment> => {
    console.log('API: Creating dental treatment:', treatment)
    
    const { data, error } = await supabase
      .from('dental_treatments')
      .insert(treatment)
      .select()
      .single()

    if (error) {
      console.error('API: Error creating dental treatment:', error)
      throw new Error(`Failed to create dental treatment: ${error.message}`)
    }

    console.log('API: Dental treatment created successfully:', data)
    return data
  },

  // Get treatments by patient
  getByPatient: async (patientId: string, clinicId: string): Promise<DentalTreatment[]> => {
    console.log('API: Getting dental treatments for patient:', patientId)
    
    const { data, error } = await supabase
      .from('dental_treatments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('treatment_date', { ascending: false })

    if (error) {
      console.error('API: Error getting dental treatments:', error)
      throw new Error(`Failed to get dental treatments: ${error.message}`)
    }

    console.log('API: Dental treatments retrieved:', data?.length || 0)
    return data || []
  },

  // Get treatments by tooth
  getByTooth: async (patientId: string, toothNumber: string, clinicId: string): Promise<DentalTreatment[]> => {
    const { data, error } = await supabase
      .from('dental_treatments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tooth_number', toothNumber)
      .eq('clinic_id', clinicId)
      .order('treatment_date', { ascending: false })

    if (error) {
      console.error('API: Error getting treatments by tooth:', error)
      throw new Error(`Failed to get treatments by tooth: ${error.message}`)
    }

    return data || []
  },

  // Update treatment
  update: async (id: string, updates: Partial<DentalTreatment>): Promise<DentalTreatment> => {
    const { data, error } = await supabase
      .from('dental_treatments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('API: Error updating dental treatment:', error)
      throw new Error(`Failed to update dental treatment: ${error.message}`)
    }

    return data
  },

  // Delete treatment
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('dental_treatments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('API: Error deleting dental treatment:', error)
      throw new Error(`Failed to delete dental treatment: ${error.message}`)
    }
  }
}

// =====================================================
// 🦷 TOOTH CONDITIONS API
// =====================================================

export const toothConditionApi = {
  // Create or update tooth condition
  upsert: async (condition: Omit<ToothCondition, 'id' | 'created_at' | 'updated_at'>): Promise<ToothCondition> => {
    const { data, error } = await supabase
      .from('tooth_conditions')
      .upsert(condition, { onConflict: 'clinic_id,patient_id,tooth_number' })
      .select()
      .single()

    if (error) {
      console.error('API: Error upserting tooth condition:', error)
      throw new Error(`Failed to upsert tooth condition: ${error.message}`)
    }

    return data
  },

  // Get conditions by patient
  getByPatient: async (patientId: string, clinicId: string): Promise<ToothCondition[]> => {
    const { data, error } = await supabase
      .from('tooth_conditions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('tooth_number')

    if (error) {
      console.error('API: Error getting tooth conditions:', error)
      throw new Error(`Failed to get tooth conditions: ${error.message}`)
    }

    return data || []
  },

  // Get condition by tooth
  getByTooth: async (patientId: string, toothNumber: string, clinicId: string): Promise<ToothCondition | null> => {
    const { data, error } = await supabase
      .from('tooth_conditions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tooth_number', toothNumber)
      .eq('clinic_id', clinicId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('API: Error getting tooth condition:', error)
      throw new Error(`Failed to get tooth condition: ${error.message}`)
    }

    return data
  }
}

// =====================================================
// 🦷 DENTAL NOTES API
// =====================================================

export const dentalNoteApi = {
  // Create new dental note
  create: async (note: Omit<DentalNote, 'id' | 'created_at' | 'updated_at'>): Promise<DentalNote> => {
    const { data, error } = await supabase
      .from('dental_notes')
      .insert(note)
      .select()
      .single()

    if (error) {
      console.error('API: Error creating dental note:', error)
      throw new Error(`Failed to create dental note: ${error.message}`)
    }

    return data
  },

  // Get notes by patient (excluding private notes for patients)
  getByPatient: async (patientId: string, clinicId: string, includePrivate: boolean = false): Promise<DentalNote[]> => {
    let query = supabase
      .from('dental_notes')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (!includePrivate) {
      query = query.eq('is_private', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('API: Error getting dental notes:', error)
      throw new Error(`Failed to get dental notes: ${error.message}`)
    }

    return data || []
  },

  // Update note
  update: async (id: string, updates: Partial<DentalNote>): Promise<DentalNote> => {
    const { data, error } = await supabase
      .from('dental_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('API: Error updating dental note:', error)
      throw new Error(`Failed to update dental note: ${error.message}`)
    }

    return data
  },

  // Delete note
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('dental_notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('API: Error deleting dental note:', error)
      throw new Error(`Failed to delete dental note: ${error.message}`)
    }
  }
}
