import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Circle, DollarSign } from 'lucide-react'
import { DentalTreatment } from '@/lib/dental-treatments'
import { simplePaymentApi, PaymentSummary } from '@/lib/payment-system-simple'

interface PaymentTreatmentSelectorProps {
  treatments: DentalTreatment[]
  onSelectTreatment: (treatment: DentalTreatment) => void
}

const PaymentTreatmentSelector: React.FC<PaymentTreatmentSelectorProps> = ({
  treatments,
  onSelectTreatment
}) => {
  const [paymentSummaries, setPaymentSummaries] = useState<{[key: string]: PaymentSummary}>({})
  const [loading, setLoading] = useState(true)

  // Load payment summaries for all treatments
  useEffect(() => {
    const loadPaymentSummaries = async () => {
      setLoading(true)
      const summaries: {[key: string]: PaymentSummary} = {}
      
      try {
        // Load payment summaries for each treatment
        for (const treatment of treatments) {
          try {
            const summary = await simplePaymentApi.getPaymentSummary(treatment.id)
            if (summary) {
              summaries[treatment.id] = summary
            }
          } catch (error) {
            console.log(`🦷 No payment data for treatment ${treatment.id}:`, error)
            // Continue with other treatments even if one fails
          }
        }
      } catch (error) {
        console.error('🦷 Error loading payment summaries:', error)
      }
      
      console.log('🦷 Loaded payment summaries:', summaries)
      setPaymentSummaries(summaries)
      setLoading(false)
    }

    if (treatments.length > 0) {
      loadPaymentSummaries()
    } else {
      setLoading(false)
    }
  }, [treatments])

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Planned': return 'bg-blue-100 text-blue-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Partial': return 'bg-yellow-100 text-yellow-800'
      case 'Pending': return 'bg-blue-100 text-blue-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm">Loading payment information...</p>
      </div>
    )
  }

  if (treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
        <Circle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">No treatments found</p>
        <p className="text-sm">Add a treatment first to manage payments</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Select Treatment for Payment</h3>
      </div>
      
      <div className="grid gap-3">
        {treatments.map((treatment) => {
          const paymentSummary = paymentSummaries[treatment.id]
          const hasPayment = paymentSummary !== undefined
          
          return (
            <Card 
              key={treatment.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow border-2 ${
                hasPayment ? 'border-green-300 hover:border-green-400' : 'hover:border-blue-300'
              }`}
              onClick={() => {
                console.log('🦷 Treatment selected for payment:', treatment)
                console.log('🦷 Treatment cost:', treatment.cost)
                onSelectTreatment(treatment)
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Circle className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-sm sm:text-base truncate">
                        {treatment.treatment_type}
                      </h4>
                      {hasPayment && (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      )}
                      {treatment.created_at && new Date(treatment.created_at).toDateString() === new Date().toDateString() && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">NEW</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Tooth:</span>
                        <span>{treatment.tooth_number}</span>
                      </div>
                      {treatment.treatment_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(treatment.treatment_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {treatment.created_at && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="text-xs">Created:</span>
                          <span className="text-xs">{new Date(treatment.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {treatment.treatment_description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">
                        {treatment.treatment_description}
                      </p>
                    )}

                    {/* Payment Information */}
                    {hasPayment && (
                      <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-800">Payment Status:</span>
                          </div>
                          <Badge className={`text-xs ${getPaymentStatusColor(paymentSummary.payment_status)}`}>
                            {paymentSummary.payment_status}
                          </Badge>
                        </div>
                        <div className="text-xs text-green-700 mt-1 space-y-1">
                          <div>
                            <span className="font-medium">Total Cost:</span> ₹{paymentSummary.total_amount.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Amount Paid:</span> ₹{paymentSummary.paid_amount.toFixed(2)}
                          </div>
                          {paymentSummary.remaining_amount > 0 && (
                            <div className="text-orange-600">
                              <span className="font-medium">Remaining:</span> ₹{paymentSummary.remaining_amount.toFixed(2)}
                            </div>
                          )}
                          {paymentSummary.remaining_amount <= 0 && paymentSummary.paid_amount > 0 && (
                            <div className="text-green-600">
                              <span className="font-medium">✓ Fully Paid</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center sm:justify-end gap-1">
                    <Badge className={`text-xs ${getTreatmentStatusColor(treatment.treatment_status)}`}>
                      {treatment.treatment_status}
                    </Badge>
                    {!hasPayment && (
                      <div className="text-center">
                        <span className="text-gray-400 font-bold text-lg">₹</span>
                        <div className="text-xs text-gray-500 mt-1">No Payment</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default PaymentTreatmentSelector
