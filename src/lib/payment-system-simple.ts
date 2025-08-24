import { supabase } from './supabase'

// =====================================================
// 🦷 SIMPLIFIED PAYMENT SYSTEM TYPES
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

export interface PaymentFormData {
  total_amount: number
  payment_type: 'full' | 'partial'
  partial_amount?: number
  payment_date: string
  notes?: string
}

// =====================================================
// 🦷 SIMPLIFIED PAYMENT API FUNCTIONS
// =====================================================

export const simplePaymentApi = {
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

  // Get payment summary for a treatment (simplified - no database function)
  getPaymentSummary: async (treatmentId: string): Promise<PaymentSummary | null> => {
    console.log('API: Getting payment summary for treatment:', treatmentId)
    
    // Get the treatment payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('treatment_id', treatmentId)
      .single()

    if (paymentError) {
      if (paymentError.code === 'PGRST116') {
        // No payment record found
        return null
      }
      console.error('API: Error getting treatment payment:', paymentError)
      throw new Error(`Failed to get treatment payment: ${paymentError.message}`)
    }

    // Get transaction count
    const { count: transactionCount, error: countError } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('treatment_payment_id', paymentData.id)

    if (countError) {
      console.error('API: Error getting transaction count:', countError)
      throw new Error(`Failed to get transaction count: ${countError.message}`)
    }

    const summary: PaymentSummary = {
      total_amount: paymentData.total_amount,
      paid_amount: paymentData.paid_amount,
      remaining_amount: paymentData.remaining_amount,
      payment_status: paymentData.payment_status,
      transaction_count: transactionCount || 0
    }

    console.log('API: Payment summary retrieved:', summary)
    return summary
  },

  // Get treatment payment record
  getTreatmentPayment: async (treatmentId: string): Promise<TreatmentPayment | null> => {
    console.log('API: Getting treatment payment for treatment:', treatmentId)
    
    const { data, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('treatment_id', treatmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
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

    // Update the treatment payment record
    await simplePaymentApi.updateTreatmentPaymentAmount(transaction.treatment_payment_id)

    console.log('API: Payment transaction added successfully:', data)
    return data
  },

  // Update treatment payment amounts
  updateTreatmentPaymentAmount: async (treatmentPaymentId: string): Promise<void> => {
    console.log('API: Updating treatment payment amounts for:', treatmentPaymentId)
    
    // Get total paid amount from transactions
    const { data: transactions, error: sumError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('treatment_payment_id', treatmentPaymentId)

    if (sumError) {
      console.error('API: Error getting transaction amounts:', sumError)
      throw new Error(`Failed to get transaction amounts: ${sumError.message}`)
    }

    const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0)

    // Update the treatment payment record
    const { error: updateError } = await supabase
      .from('treatment_payments')
      .update({ 
        paid_amount: totalPaid,
        payment_status: totalPaid === 0 ? 'Pending' : 
                       totalPaid < 0 ? 'Partial' : 'Completed'
      })
      .eq('id', treatmentPaymentId)

    if (updateError) {
      console.error('API: Error updating treatment payment:', updateError)
      throw new Error(`Failed to update treatment payment: ${updateError.message}`)
    }

    console.log('API: Treatment payment amounts updated successfully')
  },

  // Get payment transactions for a treatment payment
  getPaymentTransactions: async (treatmentPaymentId: string): Promise<PaymentTransaction[]> => {
    console.log('API: Getting payment transactions for:', treatmentPaymentId)
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('treatment_payment_id', treatmentPaymentId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('API: Error getting payment transactions:', error)
      throw new Error(`Failed to get payment transactions: ${error.message}`)
    }

    console.log('API: Payment transactions retrieved:', data)
    return data || []
  },

  // Get overdue payments (simplified)
  getOverduePayments: async (clinicId: string): Promise<any[]> => {
    console.log('API: Getting overdue payments for clinic:', clinicId)
    
    const { data, error } = await supabase
      .from('treatment_payments')
      .select(`
        *,
        dental_treatments!inner(treatment_type),
        patients!inner(name)
      `)
      .eq('clinic_id', clinicId)
      .eq('payment_status', 'Partial')
      .lt('remaining_amount', 0)

    if (error) {
      console.error('API: Error getting overdue payments:', error)
      throw new Error(`Failed to get overdue payments: ${error.message}`)
    }

    console.log('API: Overdue payments retrieved:', data)
    return data || []
  },

  // Update treatment payment total amount
  updateTreatmentPaymentTotal: async (treatmentPaymentId: string, newTotalAmount: number): Promise<void> => {
    console.log('API: Updating treatment payment total:', treatmentPaymentId, newTotalAmount)
    
    const { error } = await supabase
      .from('treatment_payments')
      .update({ 
        total_amount: newTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', treatmentPaymentId)

    if (error) {
      console.error('API: Error updating treatment payment total:', error)
      throw new Error(`Failed to update treatment payment total: ${error.message}`)
    }

    console.log('API: Treatment payment total updated successfully')
  }
}
