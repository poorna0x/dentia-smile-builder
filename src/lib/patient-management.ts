/**
 * PATIENT MANAGEMENT API
 * 
 * This file provides API functions for patient management in the multi-clinic system.
 * All functions are clinic-aware and automatically separate data by clinic_id.
 * 
 * Features:
 * - Patient CRUD operations
 * - Phone number authentication
 * - Treatment plan management
 * - Medical records management
 * - Multi-clinic data separation
 */

import { supabase } from './supabase';
import { useClinic } from '@/contexts/ClinicContext';

// Types
export interface Patient {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history: Record<string, any>;
  allergies: string[];
  current_medications: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientAuth {
  id: string;
  clinic_id: string;
  patient_id: string;
  phone: string;
  otp_code?: string;
  otp_expires_at?: string;
  last_login?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_name: string;
  treatment_description?: string;
  treatment_type?: string;
  status: 'Active' | 'Completed' | 'Cancelled' | 'On Hold';
  start_date?: string;
  end_date?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  file_url?: string;
  record_date: string;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Patient API Functions
export const patientApi = {
  // Create a new patient
  async create(patientData: Omit<Patient, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>, clinicId: string): Promise<Patient> {
    console.log('API: Creating patient with data:', JSON.stringify(patientData, null, 2));
    console.log('API: Clinic ID:', clinicId);
    console.log('API: Clinic ID type:', typeof clinicId);
    
    // Validate clinic ID
    if (!clinicId || clinicId === 'undefined' || clinicId === 'null') {
      throw new Error('Invalid clinic ID');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicId)) {
      console.error('API: Invalid UUID format for clinic ID:', clinicId);
      throw new Error('Invalid clinic ID format');
    }
    
    // Clean the data to ensure it matches the database schema
    const cleanData = {
      first_name: patientData.first_name?.trim() || '',
      last_name: patientData.last_name?.trim() || null,
      email: patientData.email?.trim() || null,
      phone: patientData.phone?.trim() || '',
      date_of_birth: patientData.date_of_birth || null,
      gender: patientData.gender || null,
      address: patientData.address?.trim() || null,
      emergency_contact_name: patientData.emergency_contact_name?.trim() || null,
      emergency_contact_phone: patientData.emergency_contact_phone?.trim() || null,
      medical_history: patientData.medical_history || {},
      allergies: Array.isArray(patientData.allergies) ? patientData.allergies.filter(item => item && item.trim() !== '') : [],
      current_medications: Array.isArray(patientData.current_medications) ? patientData.current_medications.filter(item => item && item.trim() !== '') : [],
      notes: patientData.notes?.trim() || null,
      is_active: true
    };
    
    console.log('API: Cleaned data:', JSON.stringify(cleanData, null, 2));
    
    const insertData = {
      ...cleanData,
      clinic_id: clinicId
    };
    
    console.log('API: Final insert data:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('patients')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('API: Error creating patient:', error);
      console.error('API: Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('API: Patient created successfully:', data);
    return data;
  },

  // Get patient by ID
  async getById(patientId: string, clinicId: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get patient by phone number
  async getByPhone(phone: string, clinicId: string): Promise<Patient | null> {
    console.log('API: Searching for patient with phone:', phone);
    console.log('API: Clinic ID:', clinicId);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .eq('clinic_id', clinicId)
      .single();

    console.log('API: Search result:', data);
    console.log('API: Search error:', error);
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Search patients
  async search(query: string, clinicId: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all patients for a clinic
  async getAll(clinicId: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get patients with pagination for better performance
  async getAllWithPagination(clinicId: string, page: number = 1, pageSize: number = 50): Promise<{ data: Patient[], total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  // Update patient
  async update(patientId: string, updates: Partial<Patient>, clinicId: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete patient
  async delete(patientId: string, clinicId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('clinic_id', clinicId);

    if (error) throw error;
  }
};

// Patient Authentication API Functions
export const patientAuthApi = {
  // Generate OTP for patient login
  async generateOTP(phone: string, clinicId: string): Promise<string> {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if patient exists
    const patient = await patientApi.getByPhone(phone, clinicId);
    
    if (!patient) {
      throw new Error('Patient not found. Please register first.');
    }

    // Create or update auth record
    const { error } = await supabase
      .from('patient_auth')
      .upsert({
        clinic_id: clinicId,
        patient_id: patient.id,
        phone,
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
    return otp;
  },

  // Verify OTP and login patient
  async verifyOTP(phone: string, otp: string, clinicId: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patient_auth')
      .select('*, patients(*)')
      .eq('phone', phone)
      .eq('clinic_id', clinicId)
      .eq('otp_code', otp)
      .gt('otp_expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired OTP');
    }

    // Update last login
    await supabase
      .from('patient_auth')
      .update({ 
        last_login: new Date().toISOString(),
        is_verified: true 
      })
      .eq('id', data.id);

    return data.patients;
  },

  // Get patient auth by phone
  async getByPhone(phone: string, clinicId: string): Promise<PatientAuth | null> {
    const { data, error } = await supabase
      .from('patient_auth')
      .select('*')
      .eq('phone', phone)
      .eq('clinic_id', clinicId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// Treatment Plans API Functions
export const treatmentPlanApi = {
  // Create treatment plan
  async create(planData: Omit<TreatmentPlan, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>, clinicId: string): Promise<TreatmentPlan> {
    const { data, error } = await supabase
      .from('treatment_plans')
      .insert({
        ...planData,
        clinic_id: clinicId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get treatment plans for a patient
  async getByPatient(patientId: string, clinicId: string): Promise<TreatmentPlan[]> {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update treatment plan
  async update(planId: string, updates: Partial<TreatmentPlan>, clinicId: string): Promise<TreatmentPlan> {
    const { data, error } = await supabase
      .from('treatment_plans')
      .update(updates)
      .eq('id', planId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete treatment plan
  async delete(planId: string, clinicId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', planId)
      .eq('clinic_id', clinicId);

    if (error) throw error;
  }
};

// Medical Records API Functions
export const medicalRecordApi = {
  // Create medical record
  async create(recordData: Omit<MedicalRecord, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>, clinicId: string): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        ...recordData,
        clinic_id: clinicId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get medical records for a patient
  async getByPatient(patientId: string, clinicId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('record_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update medical record
  async update(recordId: string, updates: Partial<MedicalRecord>, clinicId: string): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', recordId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete medical record
  async delete(recordId: string, clinicId: string): Promise<void> {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)
      .eq('clinic_id', clinicId);

    if (error) throw error;
  }
};

// Utility Functions
export const patientUtils = {
  // Format patient name
  formatName(patient: Patient): string {
    return `${patient.first_name} ${patient.last_name || ''}`.trim();
  },

  // Get patient age
  getAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Validate phone number
  validatePhone(phone: string): boolean {
    // Basic validation for phone numbers (allow any 10-digit number)
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  }
};
