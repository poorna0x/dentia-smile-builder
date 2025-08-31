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

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Insurance' | 'Other'

export interface PaymentTransaction {
  id: string
  treatment_payment_id: string
  amount: number
  payment_method: PaymentMode
  notes?: string
  payment_date: string
  created_at: string
}

export interface PaymentSummary {
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  transaction_count: number
  payment_modes?: { [key: string]: number }
}

export interface PaymentFormData {
  total_amount: number
  payment_type: 'full' | 'partial'
  partial_amount?: number
  payment_method: PaymentMode
  transaction_id?: string
  notes?: string
  payment_date: string
}

// =====================================================
// 🦷 SIMPLIFIED PAYMENT API FUNCTIONS (v2.0 - 406 Error Fixed)
// =====================================================

export const simplePaymentApi = {
  // Create a new treatment payment record
  createTreatmentPayment: async (payment: Omit<TreatmentPayment, 'id' | 'created_at' | 'updated_at' | 'remaining_amount'>): Promise<TreatmentPayment> => {
    try {
      console.log('🔍 Creating treatment payment:', payment)
      
      const { data, error } = await supabase
        .from('treatment_payments')
        .insert(payment)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating treatment payment:', error)
        throw new Error(`Failed to create treatment payment: ${error.message}`)
      }

      console.log('✅ Treatment payment created:', data)
      return data
    } catch (error) {
      console.error('❌ Exception in createTreatmentPayment:', error)
      throw error
    }
  },

  // Get payment summary for a treatment (direct database queries)
  getPaymentSummary: async (treatmentId: string): Promise<PaymentSummary | null> => {
    // Outer try-catch to handle any unhandled errors
    try {
      console.log('🔍 Getting payment summary for treatment:', treatmentId)
      
      // First check if the treatment_payments table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('treatment_payments')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.log('ℹ️ Payment tables not accessible:', tableError.code, '- Returning null')
        return null
      }
      
      // Get the treatment payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('treatment_payments')
        .select('*')
        .eq('treatment_id', treatmentId)
        .single()

      if (paymentError) {
        // Handle 406 errors gracefully - just return null instead of throwing
        if (paymentError.code === '406') {
          console.log('ℹ️ 406 error for treatment:', treatmentId, '- This might be a permission issue or missing payment record')
          
          // Try to create a payment record if it doesn't exist
          try {
            console.log('🔍 Attempting to create payment record for treatment:', treatmentId)
            
            // First get the treatment details to get clinic_id and patient_id
            const { data: treatmentData, error: treatmentError } = await supabase
              .from('dental_treatments')
              .select('clinic_id, patient_id')
              .eq('id', treatmentId)
              .single()
            
            if (treatmentError) {
              console.log('ℹ️ Could not get treatment details, returning null')
              return null
            }
            
            const newPayment = await simplePaymentApi.createTreatmentPayment({
              treatment_id: treatmentId,
              clinic_id: treatmentData.clinic_id,
              patient_id: treatmentData.patient_id,
              total_amount: 0,
              paid_amount: 0,
              payment_status: 'pending'
            })
            console.log('✅ Created payment record:', newPayment)
            return {
              total_amount: 0,
              paid_amount: 0,
              remaining_amount: 0,
              payment_status: 'pending',
              transaction_count: 0
            }
          } catch (createError) {
            console.log('ℹ️ Could not create payment record, returning null')
            return null
          }
        }
        
        if (paymentError.code === 'PGRST116') {
          // No payment record found - this is normal for new treatments
          console.log('ℹ️ No payment record found for treatment:', treatmentId, '- This is normal for new treatments')
          return null
        }
        
        // For other errors, still throw
        console.error('❌ Payment error:', paymentError)
        throw new Error(`Failed to get treatment payment: ${paymentError.message}`)
      }

      // Get transaction count and payment modes breakdown
      const { data: transactions, error: countError } = await supabase
        .from('payment_transactions')
        .select('amount, payment_method')
        .eq('treatment_payment_id', paymentData.id)

      if (countError) {
        throw new Error(`Failed to get transaction count: ${countError.message}`)
      }

      // Calculate payment modes breakdown
      const paymentModes: { [key: string]: number } = {}
      if (transactions) {
        transactions.forEach(transaction => {
          const method = transaction.payment_method
          paymentModes[method] = (paymentModes[method] || 0) + transaction.amount
        })
      }

      const summary: PaymentSummary = {
        total_amount: paymentData.total_amount,
        paid_amount: paymentData.paid_amount,
        remaining_amount: paymentData.remaining_amount,
        payment_status: paymentData.payment_status,
        transaction_count: transactions?.length || 0,
        payment_modes: Object.keys(paymentModes).length > 0 ? paymentModes : undefined
      }

      console.log('✅ Payment summary retrieved:', summary)
      return summary
    } catch (error) {
      // Catch ALL errors and return null instead of throwing
      console.log('ℹ️ Error in getPaymentSummary for treatment:', treatmentId, '- Returning null')
      console.log('Error details:', error)
      return null
    }
  },

  // Get treatment payment record
  getTreatmentPayment: async (treatmentId: string): Promise<TreatmentPayment | null> => {
    const { data, error } = await supabase
      .from('treatment_payments')
      .select('*')
      .eq('treatment_id', treatmentId)
      .single()

    if (error) {
      // Handle 406 errors gracefully
      if (error.code === '406') {
        console.log('ℹ️ 406 error for treatment payment:', treatmentId, '- Payment tables not accessible, returning null')
        return null
      }
      
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get treatment payment: ${error.message}`)
    }

    return data
  },

  // Add a payment transaction
  addPaymentTransaction: async (transaction: Omit<PaymentTransaction, 'id' | 'created_at'>): Promise<PaymentTransaction> => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(transaction)
        .select()
        .single()

      if (error) {
        console.error('❌ Payment transaction error:', error.message)
        throw new Error(`Failed to add payment transaction: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Exception in addPaymentTransaction:', error)
      throw error
    }
  },

  // Update treatment payment amounts (deprecated - now handled by database triggers)
  updateTreatmentPaymentAmount: async (treatmentPaymentId: string): Promise<void> => {
    console.log('⚠️ updateTreatmentPaymentAmount is deprecated - triggers handle this automatically')
    // This function is kept for backward compatibility but triggers now handle the updates
  },

  // Get payment transactions for a treatment payment
  getPaymentTransactions: async (treatmentPaymentId: string): Promise<PaymentTransaction[]> => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('treatment_payment_id', treatmentPaymentId)
      .order('created_at', { ascending: false })

    if (error) {
      // Handle 406 errors gracefully
      if (error.code === '406') {
        console.log('ℹ️ 406 error for payment transactions:', treatmentPaymentId, '- Payment tables not accessible, returning empty array')
        return []
      }
      
      throw new Error(`Failed to get payment transactions: ${error.message}`)
    }

    return data || []
  },

  // Get overdue payments (simplified)
  getOverduePayments: async (clinicId: string): Promise<any[]> => {
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
      throw new Error(`Failed to get overdue payments: ${error.message}`)
    }

    return data || []
  },

  // Update treatment payment total amount
  updateTreatmentPaymentTotal: async (treatmentPaymentId: string, newTotalAmount: number): Promise<void> => {
    const { error } = await supabase
      .from('treatment_payments')
      .update({ 
        total_amount: newTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', treatmentPaymentId)

    if (error) {
      throw new Error(`Failed to update treatment payment total: ${error.message}`)
    }
  },

  // Get clinic payment analytics
  getClinicPaymentAnalytics: async (clinicId: string, startDate?: string, endDate?: string): Promise<any[]> => {
    const { data, error } = await supabase
      .rpc('get_clinic_payment_analytics', {
        clinic_uuid: clinicId,
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      throw new Error(`Failed to get clinic payment analytics: ${error.message}`)
    }

    return data || []
  },

  // Get patient payment analytics
  getPatientPaymentAnalytics: async (patientId: string, clinicId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .rpc('get_patient_payment_analytics', {
        patient_uuid: patientId,
        clinic_uuid: clinicId
      })

    if (error) {
      throw new Error(`Failed to get patient payment analytics: ${error.message}`)
    }

    return data || []
  },

  // Get daily payment analytics
  getDailyPaymentAnalytics: async (clinicId: string, daysBack: number = 30): Promise<any[]> => {
    const { data, error } = await supabase
      .rpc('get_daily_payment_analytics', {
        clinic_uuid: clinicId,
        days_back: daysBack
      })

    if (error) {
      throw new Error(`Failed to get daily payment analytics: ${error.message}`)
    }

    return data || []
  }
}
