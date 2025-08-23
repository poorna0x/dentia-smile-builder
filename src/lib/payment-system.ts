import { supabase } from './supabase';

// =====================================================
// 💰 SIMPLE PAYMENT TRACKING SYSTEM
// =====================================================

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Insurance' | 'Other';

export interface TreatmentPayment {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_id: string;
  appointment_id?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  due_date?: string;
  payment_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_id: string;
  payment_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_date: string;
  reference_number?: string;
  receipt_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface PatientPaymentSummary {
  total_treatments: number;
  total_amount: number;
  total_paid: number;
  total_remaining: number;
  pending_count: number;
  partial_count: number;
  overdue_count: number;
}

export interface CreatePaymentData {
  clinic_id: string;
  patient_id: string;
  treatment_id: string;
  appointment_id?: string;
  total_amount: number;
  due_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface AddPaymentTransactionData {
  clinic_id: string;
  patient_id: string;
  treatment_id: string;
  payment_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  receipt_number?: string;
  notes?: string;
}

// =====================================================
// 💰 PAYMENT API FUNCTIONS
// =====================================================

export const paymentApi = {
  // Create a new payment record for a treatment
  async createPayment(data: CreatePaymentData): Promise<TreatmentPayment> {
    const { data: payment, error } = await supabase
      .from('treatment_payments')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return payment;
  },

  // Get payment by treatment ID
  async getPaymentByTreatment(treatmentId: string): Promise<TreatmentPayment | null> {
    const { data: payment, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('treatment_id', treatmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return payment;
  },

  // Get all payments for a patient
  async getPaymentsByPatient(patientId: string): Promise<TreatmentPayment[]> {
    const { data: payments, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return payments || [];
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<TreatmentPayment> {
    const { data: payment, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return payment;
  },

  // Update payment
  async updatePayment(paymentId: string, updates: Partial<TreatmentPayment>): Promise<TreatmentPayment> {
    const { data: payment, error } = await supabase
      .from('treatment_payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return payment;
  },

  // Delete payment
  async deletePayment(paymentId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  },

  // Get payment summary for a patient
  async getPatientPaymentSummary(patientId: string): Promise<PatientPaymentSummary> {
    const { data, error } = await supabase
      .rpc('get_patient_payment_summary', { patient_uuid: patientId });

    if (error) throw error;
    return data[0] || {
      total_treatments: 0,
      total_amount: 0,
      total_paid: 0,
      total_remaining: 0,
      pending_count: 0,
      partial_count: 0,
      overdue_count: 0
    };
  },

  // Get overdue payments
  async getOverduePayments(clinicId?: string): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_overdue_payments', { clinic_uuid: clinicId || null });

    if (error) throw error;
    return data || [];
  }
};

export const paymentTransactionApi = {
  // Add a payment transaction
  async addTransaction(data: AddPaymentTransactionData): Promise<PaymentTransaction> {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return transaction;
  },

  // Get all transactions for a payment
  async getTransactionsByPayment(paymentId: string): Promise<PaymentTransaction[]> {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return transactions || [];
  },

  // Get all transactions for a patient
  async getTransactionsByPatient(patientId: string): Promise<PaymentTransaction[]> {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('patient_id', patientId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return transactions || [];
  },

  // Get transaction by ID
  async getTransactionById(transactionId: string): Promise<PaymentTransaction> {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return transaction;
  },

  // Update transaction
  async updateTransaction(transactionId: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return transaction;
  },

  // Delete transaction
  async deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }
};

// =====================================================
// 💰 PAYMENT UTILITY FUNCTIONS
// =====================================================

export const paymentUtils = {
  // Format amount to INR
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Get payment status color
  getPaymentStatusColor(status: PaymentStatus): string {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },

  // Get payment method icon
  getPaymentMethodIcon(method: PaymentMethod): string {
    switch (method) {
      case 'Cash':
        return '💵';
      case 'Card':
        return '💳';
      case 'UPI':
        return '📱';
      case 'Bank Transfer':
        return '🏦';
      case 'Cheque':
        return '📄';
      case 'Insurance':
        return '🛡️';
      case 'Other':
        return '💰';
      default:
        return '💰';
    }
  },

  // Calculate payment percentage
  calculatePaymentPercentage(paid: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((paid / total) * 100);
  },

  // Check if payment is overdue
  isPaymentOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  },

  // Get days overdue
  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get payment status icon
  getPaymentStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case 'Paid':
        return '✅';
      case 'Partial':
        return '⚠️';
      case 'Pending':
        return '⏳';
      case 'Overdue':
        return '🚨';
      case 'Cancelled':
        return '❌';
      default:
        return '❓';
    }
  }
};

// =====================================================
// 💰 PAYMENT CONSTANTS
// =====================================================

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Cancelled', label: 'Cancelled' }
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Other', label: 'Other' }
];
