import { supabase } from './supabase'

// =====================================================
// 🦷 PAYMENT SYSTEM TYPES
// =====================================================

export type PaymentStatus = 'Pending' | 'Partial' | 'Completed' | 'Overdue'


export interface TreatmentPayment {
  id: string
  treatment_id: string
  clinic_id: string
  patient_id: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  treatment_payment_id: string
  amount: number
  payment_date: string
  notes?: string
  created_at: string
}

export interface PaymentSummary {
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  transaction_count: number
}

export interface OverduePayment {
  treatment_id: string
  patient_name: string
  treatment_type: string
  total_amount: number
  remaining_amount: number
  days_overdue: number
}

export interface PaymentFormData {
  total_amount: number
  payment_type: 'full' | 'partial'
  partial_amount?: number
  payment_date: string
  notes?: string
}

// =====================================================
// 🦷 PAYMENT API FUNCTIONS
// =====================================================

export const paymentApi = {
  // Create a new treatment payment record
  createTreatmentPayment: async (payment: Omit<TreatmentPayment, 'id' | 'created_at' | 'updated_at' | 'remaining_amount'>): Promise<TreatmentPayment> => {
    console.log('API: Creating treatment payment:', payment)
    
    const { data, error } = await supabase
      .from('treatment_payments')
      .insert(payment)
      .select()
      .single()

    if (error) {
      console.error('API: Error creating treatment payment:', error)
      throw new Error(`Failed to create treatment payment: ${error.message}`)
    }

    console.log('API: Treatment payment created successfully:', data)
    return data
  },

  // Get payment summary for a treatment
  getPaymentSummary: async (treatmentId: string): Promise<PaymentSummary | null> => {
    console.log('API: Getting payment summary for treatment:', treatmentId)
    
    const { data, error } = await supabase
      .rpc('get_treatment_payment_summary', { treatment_uuid: treatmentId })

    if (error) {
      console.error('API: Error getting payment summary:', error)
      throw new Error(`Failed to get payment summary: ${error.message}`)
    }

    console.log('API: Payment summary retrieved:', data)
    return data?.[0] || null
  },

  // Get treatment payment record
  getTreatmentPayment: async (treatmentId: string): Promise<TreatmentPayment | null> => {
    console.log('API: Getting treatment payment for treatment:', treatmentId)
    
    const { data, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('treatment_id', treatmentId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('API: Error getting treatment payment:', error)
      throw new Error(`Failed to get treatment payment: ${error.message}`)
    }

    console.log('API: Treatment payment retrieved:', data)
    return data
  },

  // Add a payment transaction
  addPaymentTransaction: async (transaction: Omit<PaymentTransaction, 'id' | 'created_at'>): Promise<PaymentTransaction> => {
    console.log('API: Adding payment transaction:', transaction)
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) {
      console.error('API: Error adding payment transaction:', error)
      throw new Error(`Failed to add payment transaction: ${error.message}`)
    }

    console.log('API: Payment transaction added successfully:', data)
    return data
  },

  // Get payment transactions for a treatment payment
  getPaymentTransactions: async (treatmentPaymentId: string): Promise<PaymentTransaction[]> => {
    console.log('API: Getting payment transactions for payment:', treatmentPaymentId)
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('treatment_payment_id', treatmentPaymentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API: Error getting payment transactions:', error)
      throw new Error(`Failed to get payment transactions: ${error.message}`)
    }

    console.log('API: Payment transactions retrieved:', data)
    return data || []
  },

  // Get overdue payments for a clinic
  getOverduePayments: async (clinicId: string): Promise<OverduePayment[]> => {
    console.log('API: Getting overdue payments for clinic:', clinicId)
    
    const { data, error } = await supabase
      .rpc('get_overdue_payments', { clinic_uuid: clinicId })

    if (error) {
      console.error('API: Error getting overdue payments:', error)
      throw new Error(`Failed to get overdue payments: ${error.message}`)
    }

    console.log('API: Overdue payments retrieved:', data)
    return data || []
  },

  // Update treatment payment
  updateTreatmentPayment: async (id: string, updates: Partial<TreatmentPayment>): Promise<TreatmentPayment> => {
    console.log('API: Updating treatment payment:', id, updates)
    
    const { data, error } = await supabase
      .from('treatment_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('API: Error updating treatment payment:', error)
      throw new Error(`Failed to update treatment payment: ${error.message}`)
    }

    console.log('API: Treatment payment updated successfully:', data)
    return data
  }
}

// =====================================================
// 🦷 PAYMENT UTILITY FUNCTIONS
// =====================================================

export const paymentUtils = {
  // Format amount to INR currency
  formatAmount: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  },

  // Get payment status color for UI
  getPaymentStatusColor: (status: PaymentStatus): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Pending':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  },

  // Get payment method icon
  getPaymentMethodIcon: (method: PaymentMethod): string => {
    switch (method) {
      case 'Cash':
        return '💵'
      case 'Card':
        return '💳'
      case 'UPI':
        return '📱'
      case 'Bank Transfer':
        return '🏦'
      case 'Cheque':
        return '📄'
      case 'Insurance':
        return '🛡️'
      case 'Other':
        return '📋'
      default:
        return '💰'
    }
  },

  // Validate payment amount
  validatePaymentAmount: (amount: number, remainingAmount: number): boolean => {
    return amount > 0 && amount <= remainingAmount
  },

  // Calculate payment percentage
  calculatePaymentPercentage: (paid: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((paid / total) * 100)
  }
}
