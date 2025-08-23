/**
 * 🧠 SMART PATIENT MATCHING SERVICE
 * 
 * This service handles intelligent patient matching when booking appointments:
 * - Splits full names into first/last names
 * - Checks for existing patients by phone
 * - Handles multiple phone numbers
 * - Creates new patients when needed
 * - Links appointments with patients automatically
 */

import { supabase } from './supabase';
import { Patient, PatientPhone } from './patient-management';

export interface AppointmentBookingData {
  name: string;        // Full name (e.g., "Poorna Shetty")
  phone: string;       // Phone number
  email: string;       // Email
  date: string;        // Appointment date
  time: string;        // Appointment time
  clinic_id: string;   // Clinic ID
}

export interface PatientMatchResult {
  patient: Patient;
  isNewPatient: boolean;
  patientId: string;
  matchedBy: 'phone' | 'name' | 'new';
  phones: PatientPhone[];
}

export class PatientMatchingService {
  
  /**
   * Split full name into first and last name (robust version)
   */
  static splitName(fullName: string): { firstName: string; lastName: string | null } {
    // Clean and normalize the name
    const cleanedName = fullName.trim().replace(/\s+/g, ' ');
    const nameParts = cleanedName.split(' ');
    
    if (nameParts.length === 0 || cleanedName === '') {
      return { firstName: '', lastName: null };
    }
    
    if (nameParts.length === 1) {
      // Single name only
      return { firstName: nameParts[0], lastName: null };
    }
    
    if (nameParts.length === 2) {
      // Two names: first and last
      return { firstName: nameParts[0], lastName: nameParts[1] };
    }
    
    if (nameParts.length === 3) {
      // Three names: handle common patterns
      const titles = ['Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof'];
      
      if (titles.includes(nameParts[0])) {
        // Title + first + last
        return { firstName: nameParts[1], lastName: nameParts[2] };
      } else {
        // First + middle + last
        return { firstName: nameParts[0], lastName: `${nameParts[1]} ${nameParts[2]}` };
      }
    }
    
    // Four or more names: first name + rest as last name
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }

  /**
   * Find patient by phone number (handles multiple phones)
   */
  static async findPatientByPhone(phone: string, clinicId: string): Promise<Patient | null> {
    try {
      // Use the database function to get patient by phone
      const { data, error } = await supabase
        .rpc('get_patient_by_phone', {
          p_phone: phone,
          p_clinic_id: clinicId
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get the full patient record
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', data[0].patient_id)
          .single();

        if (patientError) throw patientError;
        return patientData;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding patient by phone:', error);
      return null;
    }
  }

  /**
   * Get all phones for a patient
   */
  static async getPatientPhones(patientId: string): Promise<PatientPhone[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_patient_phones', {
          p_patient_id: patientId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting patient phones:', error);
      return [];
    }
  }

  /**
   * Check if names match (case-insensitive, normalized)
   */
  static namesMatch(name1: string, name2: string): boolean {
    const normalizeName = (name: string) => {
      return name.toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
    return normalizeName(name1) === normalizeName(name2);
  }

  /**
   * Create a new patient
   */
  static async createPatient(patientData: {
    clinic_id: string;
    first_name: string;
    last_name?: string;
    phone: string;
    email: string;
  }): Promise<Patient> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          clinic_id: patientData.clinic_id,
          first_name: patientData.first_name,
          last_name: patientData.last_name,
          phone: patientData.phone,
          email: patientData.email,
          is_active: true,
          medical_history: {},
          allergies: [],
          current_medications: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * Add phone to patient_phones table
   */
  static async addPatientPhone(patientId: string, phone: string, phoneType: 'primary' | 'secondary' | 'emergency' | 'family' = 'primary'): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_phones')
        .insert({
          patient_id: patientId,
          phone,
          phone_type: phoneType,
          is_primary: phoneType === 'primary',
          is_verified: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding patient phone:', error);
      throw error;
    }
  }

  /**
   * Smart patient matching and creation
   */
  static async findOrCreatePatient(appointmentData: AppointmentBookingData): Promise<PatientMatchResult> {
    const { name: fullName, phone, email, clinic_id } = appointmentData;
    
    try {
      // 1. Split the full name
      const { firstName, lastName } = this.splitName(fullName);
      
      // 2. Check if patient exists by phone
      const existingPatient = await this.findPatientByPhone(phone, clinic_id);
      
      if (existingPatient) {
        // 3. Patient exists - check name match
        const existingFullName = `${existingPatient.first_name} ${existingPatient.last_name || ''}`.trim();
        
        if (this.namesMatch(fullName, existingFullName)) {
          // Same person - return existing patient
          const phones = await this.getPatientPhones(existingPatient.id);
          
          return {
            patient: existingPatient,
            isNewPatient: false,
            patientId: existingPatient.id,
            matchedBy: 'phone',
            phones
          };
        } else {
          // Different person with same phone - create new patient
          const newPatient = await this.createPatient({
            clinic_id,
            first_name: firstName,
            last_name: lastName,
            phone,
            email
          });
          
          // Add phone to patient_phones table
          await this.addPatientPhone(newPatient.id, phone, 'primary');
          
          return {
            patient: newPatient,
            isNewPatient: true,
            patientId: newPatient.id,
            matchedBy: 'new',
            phones: []
          };
        }
      } else {
        // 4. New patient - create record
        const newPatient = await this.createPatient({
          clinic_id,
          first_name: firstName,
          last_name: lastName,
          phone,
          email
        });
        
        // Add phone to patient_phones table
        await this.addPatientPhone(newPatient.id, phone, 'primary');
        
        return {
          patient: newPatient,
          isNewPatient: true,
          patientId: newPatient.id,
          matchedBy: 'new',
          phones: []
        };
      }
    } catch (error) {
      console.error('Error in findOrCreatePatient:', error);
      throw error;
    }
  }

  /**
   * Book appointment with automatic patient linking
   */
  static async bookAppointmentWithPatientLinking(appointmentData: AppointmentBookingData): Promise<{
    appointment: any;
    patientMatch: PatientMatchResult;
  }> {
    try {
      // 1. Find or create patient
      const patientMatch = await this.findOrCreatePatient(appointmentData);
      
      // 2. Create appointment with patient_id
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: appointmentData.clinic_id,
          patient_id: patientMatch.patientId,
          name: appointmentData.name,
          phone: appointmentData.phone,
          email: appointmentData.email,
          date: appointmentData.date,
          time: appointmentData.time,
          status: 'Confirmed'
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        appointment,
        patientMatch
      };
    } catch (error) {
      console.error('Error booking appointment with patient linking:', error);
      throw error;
    }
  }

  /**
   * Get patient with all their phones
   */
  static async getPatientWithPhones(patientId: string): Promise<{
    patient: Patient;
    phones: PatientPhone[];
  } | null> {
    try {
      // Get patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      
      // Get phones
      const phones = await this.getPatientPhones(patientId);
      
      return {
        patient,
        phones
      };
    } catch (error) {
      console.error('Error getting patient with phones:', error);
      return null;
    }
  }

  /**
   * Add additional phone to existing patient
   */
  static async addPhoneToPatient(patientId: string, phone: string, phoneType: 'secondary' | 'emergency' | 'family' = 'secondary'): Promise<void> {
    try {
      await this.addPatientPhone(patientId, phone, phoneType);
    } catch (error) {
      console.error('Error adding phone to patient:', error);
      throw error;
    }
  }

  /**
   * Update patient's primary phone
   */
  static async updatePrimaryPhone(patientId: string, newPrimaryPhone: string): Promise<void> {
    try {
      // First, set all phones to non-primary
      await supabase
        .from('patient_phones')
        .update({ is_primary: false })
        .eq('patient_id', patientId);

      // Then, set the new primary phone
      await supabase
        .from('patient_phones')
        .update({ is_primary: true })
        .eq('patient_id', patientId)
        .eq('phone', newPrimaryPhone);
    } catch (error) {
      console.error('Error updating primary phone:', error);
      throw error;
    }
  }
}
