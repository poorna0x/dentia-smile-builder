import { supabase } from './supabase';

// =====================================================
// 🧪 LAB WORK TYPES
// =====================================================

export interface LabWork {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id?: string;
  lab_name: string;
  work_type: string;
  description?: string;
  status: 'Ordered' | 'In Progress' | 'Quality Check' | 'Ready for Pickup' | 'Patient Notified' | 'Completed' | 'Cancelled' | 'Delayed';
  order_date: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 🧪 LAB WORK API
// =====================================================

export const labWorkApi = {
  // Create new lab work
  async create(labWorkData: Omit<LabWork, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>, clinicId: string): Promise<LabWork> {
    const { data, error } = await supabase
      .from('lab_work')
      .insert({
        ...labWorkData,
        clinic_id: clinicId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get lab work by ID
  async getById(id: string): Promise<LabWork | null> {
    const { data, error } = await supabase
      .from('lab_work')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get lab work by patient
  async getByPatient(patientId: string, clinicId: string): Promise<LabWork[]> {
    const { data, error } = await supabase
      .from('lab_work')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all lab work for clinic
  async getAll(clinicId: string): Promise<LabWork[]> {
    const { data, error } = await supabase
      .from('lab_work')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update lab work
  async update(id: string, updates: Partial<LabWork>): Promise<LabWork> {
    const { data, error } = await supabase
      .from('lab_work')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete lab work
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('lab_work')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get lab work by status
  async getByStatus(status: LabWork['status'], clinicId: string): Promise<LabWork[]> {
    const { data, error } = await supabase
      .from('lab_work')
      .select('*')
      .eq('status', status)
      .eq('clinic_id', clinicId)
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get overdue lab work
  async getOverdue(clinicId: string): Promise<LabWork[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('lab_work')
      .select('*')
      .eq('clinic_id', clinicId)
      .lt('expected_completion_date', today)
      .in('status', ['Ordered', 'In Progress', 'Quality Check'])
      .order('expected_completion_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// 🧪 LAB WORK UTILITIES
// =====================================================

export const labWorkUtils = {
  // Get status color
  getStatusColor: (status: LabWork['status']): string => {
    switch (status) {
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Quality Check': return 'bg-indigo-100 text-indigo-800';
      case 'Ready for Pickup': return 'bg-purple-100 text-purple-800';
      case 'Patient Notified': return 'bg-pink-100 text-pink-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  // Get status icon
  getStatusIcon: (status: LabWork['status']): string => {
    switch (status) {
      case 'Ordered': return '📋';
      case 'In Progress': return '⚙️';
      case 'Quality Check': return '🔍';
      case 'Ready for Pickup': return '📦';
      case 'Patient Notified': return '📞';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      case 'Delayed': return '⏰';
      default: return '📄';
    }
  },

  // Format date
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  },

  // Check if overdue
  isOverdue: (labWork: LabWork): boolean => {
    if (!labWork.expected_completion_date) return false;
    const today = new Date();
    const expectedDate = new Date(labWork.expected_completion_date);
    return today > expectedDate && ['Ordered', 'In Progress', 'Quality Check'].includes(labWork.status);
  },

  // Get work types
  getWorkTypes: () => [
    'Crown',
    'Bridge',
    'Denture',
    'Implant',
    'Veneer',
    'Inlay/Onlay',
    'Night Guard',
    'Retainer',
    'Splint',
    'Other'
  ],

  // Get lab names
  getLabNames: () => [
    'Dental Lab Pro',
    'Precision Dental Lab',
    'Quality Dental Lab',
    'Advanced Dental Lab',
    'Custom Dental Lab',
    'Other'
  ],
};
