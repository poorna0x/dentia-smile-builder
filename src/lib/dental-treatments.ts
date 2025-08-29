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
// 🦷 TOOTH CHART UTILITIES - CORRECT IMPLEMENTATION
// =====================================================

export const toothChartUtils = {
  // Get all teeth in FDI numbering system
  getAllTeeth: () => {
    const teeth = []
    // Upper Right Quadrant: 18 17 16 15 14 13 12 11
    teeth.push('18', '17', '16', '15', '14', '13', '12', '11')
    // Upper Left Quadrant: 21 22 23 24 25 26 27 28
    teeth.push('21', '22', '23', '24', '25', '26', '27', '28')
    // Lower Left Quadrant: 31 32 33 34 35 36 37 38
    teeth.push('31', '32', '33', '34', '35', '36', '37', '38')
    // Lower Right Quadrant: 48 47 46 45 44 43 42 41
    teeth.push('48', '47', '46', '45', '44', '43', '42', '41')
    return teeth
  },

  // Get tooth position based on FDI number
  getToothPosition: (toothNumber: string): string => {
    const quadrant = parseInt(toothNumber.charAt(0))
    switch (quadrant) {
      case 1: return 'Maxillary Right'
      case 2: return 'Maxillary Left'
      case 3: return 'Mandibular Left'
      case 4: return 'Mandibular Right'
      default: return 'Unknown'
    }
  },

  // Get tooth name based on FDI position
  getToothName: (toothNumber: string): string => {
    const position = parseInt(toothNumber.charAt(1))

    // Tooth names based on position (from mesial to distal)
    const toothNames = [
      'Central Incisor',    // Position 1
      'Lateral Incisor',    // Position 2
      'Canine',            // Position 3
      'First Premolar',    // Position 4
      'Second Premolar',   // Position 5
      'First Molar',       // Position 6
      'Second Molar',      // Position 7
      'Third Molar'        // Position 8
    ]

    return toothNames[position - 1] || 'Unknown'
  },

  // Get quadrant number
  getQuadrant: (toothNumber: string): number => {
    return parseInt(toothNumber.charAt(0))
  },

  // No conversion needed - only FDI system
  convertNumbering: (toothNumber: string): string => {
    return toothNumber
  },

  // Get tooth type (anterior/posterior)
  getToothType: (toothNumber: string): string => {
    const position = parseInt(toothNumber.charAt(1))

    if (position <= 3) return 'Anterior'  // Incisors and Canines
    return 'Posterior'                    // Premolars and Molars
  },

  // Get arch (maxillary/mandibular)
  getArch: (toothNumber: string): string => {
    const position = toothChartUtils.getToothPosition(toothNumber)
    if (position.includes('Maxillary')) return 'Maxillary'
    if (position.includes('Mandibular')) return 'Mandibular'
    return 'Unknown'
  },

  // Get side (left/right)
  getSide: (toothNumber: string): string => {
    const position = toothChartUtils.getToothPosition(toothNumber)
    if (position.includes('Right')) return 'Right'
    if (position.includes('Left')) return 'Left'
    return 'Unknown'
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
    const { data, error } = await supabase
      .from('dental_treatments')
      .insert(treatment)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create dental treatment: ${error.message}`)
    }

    return data
  },

  // Get treatments by patient
  getByPatient: async (patientId: string, clinicId: string): Promise<DentalTreatment[]> => {
    const { data, error } = await supabase
      .from('dental_treatments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('treatment_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get dental treatments: ${error.message}`)
    }

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
