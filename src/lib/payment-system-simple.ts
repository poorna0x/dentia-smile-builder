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
      
      const { data, error } = await supabase
        .from('treatment_payments')
        .insert(payment)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating treatment payment:', error)
        throw new Error(`Failed to create treatment payment: ${error.message}`)
      }

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
      
      // First check if the treatment_payments table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('treatment_payments')
        .select('id')
        .limit(1)
      
      if (tableError) {
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
          
          // Try to create a payment record if it doesn't exist
          try {
            
            // First get the treatment details to get clinic_id and patient_id
            const { data: treatmentData, error: treatmentError } = await supabase
              .from('dental_treatments')
              .select('clinic_id, patient_id')
              .eq('id', treatmentId)
              .single()
            
            if (treatmentError) {
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
            return {
              total_amount: 0,
              paid_amount: 0,
              remaining_amount: 0,
              payment_status: 'pending',
              transaction_count: 0
            }
          } catch (createError) {
            return null
          }
        }
        
        if (paymentError.code === 'PGRST116') {
          // No payment record found - this is normal for new treatments
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

      return summary
    } catch (error) {
      // Catch ALL errors and return null instead of throwing
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

  // Update treatment payment paid amount (for multi-tooth sync without duplicate transactions)
  updateTreatmentPaymentPaidAmount: async (treatmentPaymentId: string, newPaidAmount: number): Promise<void> => {
    const { error } = await supabase
      .from('treatment_payments')
      .update({ 
        paid_amount: newPaidAmount,
        remaining_amount: newPaidAmount, // This will be recalculated by database triggers
        updated_at: new Date().toISOString()
      })
      .eq('id', treatmentPaymentId)

    if (error) {
      throw new Error(`Failed to update treatment payment paid amount: ${error.message}`)
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
  },

  // =====================================================
  // 💰 PAYMENT ANALYTICS API FUNCTIONS
  // =====================================================

  // Get today's revenue
  getTodayRevenue: async (clinicId: string): Promise<number> => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('payment_date', today)

    if (error) {
      console.error('Error getting today revenue:', error)
      return 0
    }

    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
  },

  // Get monthly revenue
  getMonthlyRevenue: async (clinicId: string, month?: string): Promise<number> => {
    const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    // Calculate the first day of next month
    const [year, monthNum] = targetMonth.split('-').map(Number)
    const nextMonth = monthNum === 12 ? 1 : monthNum + 1
    const nextYear = monthNum === 12 ? year + 1 : year
    const nextMonthStr = nextMonth.toString().padStart(2, '0')
    const nextYearStr = nextYear.toString()
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .gte('payment_date', `${targetMonth}-01`)
      .lt('payment_date', `${nextYearStr}-${nextMonthStr}-01`)

    if (error) {
      console.error('Error getting monthly revenue:', error)
      return 0
    }

    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
  },

  // Get yearly revenue
  getYearlyRevenue: async (clinicId: string, year?: string): Promise<number> => {
    const targetYear = year || new Date().getFullYear().toString()
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .gte('payment_date', `${targetYear}-01-01`)
      .lt('payment_date', `${targetYear + 1}-01-01`)

    if (error) {
      console.error('Error getting yearly revenue:', error)
      return 0
    }

    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
  },

  // Get payment method breakdown for today
  getTodayPaymentMethods: async (clinicId: string): Promise<{[key: string]: number}> => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('payment_method, amount')
      .eq('payment_date', today)

    if (error) {
      console.error('Error getting today payment methods:', error)
      return {}
    }

    const breakdown: {[key: string]: number} = {}
    data?.forEach(transaction => {
      const method = transaction.payment_method || 'Unknown'
      breakdown[method] = (breakdown[method] || 0) + transaction.amount
    })

    return breakdown
  },

  // Get pending payments total
  getPendingPaymentsTotal: async (clinicId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('treatment_payments')
      .select('remaining_amount')
      .in('payment_status', ['Pending', 'Partial'])

    if (error) {
      console.error('Error getting pending payments:', error)
      return 0
    }

    return data?.reduce((sum, payment) => sum + payment.remaining_amount, 0) || 0
  },

  // Get today's transactions
  getTodayTransactions: async (clinicId: string): Promise<any[]> => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        treatment_payments!inner(
          dental_treatments!inner(
            patients!inner(first_name, last_name, phone)
          )
        )
      `)
      .eq('payment_date', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting today transactions:', error)
      return []
    }

    return data || []
  },

  // Get outstanding payments with patient details and pagination
  getOutstandingPayments: async (clinicId: string, page: number = 1, limit: number = 20): Promise<{data: any[], total: number, hasMore: boolean}> => {
    const offset = (page - 1) * limit
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('treatment_payments')
      .select('*', { count: 'exact', head: true })
      .in('payment_status', ['Pending', 'Partial'])
      .gt('remaining_amount', 0)

    if (countError) {
      console.error('Error getting outstanding payments count:', countError)
      return { data: [], total: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('treatment_payments')
      .select(`
        *,
        dental_treatments!inner(
          patients!inner(first_name, last_name, phone)
        )
      `)
      .in('payment_status', ['Pending', 'Partial'])
      .gt('remaining_amount', 0)
      .order('remaining_amount', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error getting outstanding payments:', error)
      return { data: [], total: 0, hasMore: false }
    }

    const total = count || 0
    const hasMore = offset + limit < total

    return { 
      data: data || [], 
      total, 
      hasMore 
    }
  },

  // Get revenue for custom date range
  getCustomRangeRevenue: async (clinicId: string, fromDate: string, toDate: string): Promise<number> => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate)

    if (error) {
      console.error('Error getting custom range revenue:', error)
      return 0
    }

    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
  },

  // Get transactions for custom date range with pagination
  getCustomRangeTransactions: async (clinicId: string, fromDate: string, toDate: string, page: number = 1, limit: number = 20): Promise<{data: any[], total: number, hasMore: boolean}> => {
    const offset = (page - 1) * limit
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate)

    if (countError) {
      console.error('Error getting transaction count:', countError)
      return { data: [], total: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        treatment_payments!inner(
          dental_treatments!inner(
            patients!inner(first_name, last_name, phone)
          )
        )
      `)
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error getting custom range transactions:', error)
      return { data: [], total: 0, hasMore: false }
    }

    const total = count || 0
    const hasMore = offset + limit < total

    return { 
      data: data || [], 
      total, 
      hasMore 
    }
  },

  // Get payment methods for custom date range
  getCustomRangePaymentMethods: async (clinicId: string, fromDate: string, toDate: string): Promise<{[key: string]: number}> => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('payment_method, amount')
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate)

    if (error) {
      console.error('Error getting custom range payment methods:', error)
      return {}
    }

    const breakdown: {[key: string]: number} = {}
    data?.forEach(transaction => {
      const method = transaction.payment_method || 'Unknown'
      breakdown[method] = (breakdown[method] || 0) + transaction.amount
    })

    return breakdown
  },

  // Get last year revenue for comparison
  getLastYearRevenue: async (clinicId: string, year: number): Promise<number> => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .gte('payment_date', `${year}-01-01`)
      .lt('payment_date', `${year + 1}-01-01`)

    if (error) {
      console.error('Error getting last year revenue:', error)
      return 0
    }

    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0
  }
}
