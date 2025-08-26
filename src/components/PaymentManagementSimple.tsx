import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'
import { simplePaymentApi, PaymentSummary, PaymentTransaction, PaymentFormData } from '@/lib/payment-system-simple'
import { toast } from 'sonner'

interface PaymentManagementSimpleProps {
  treatmentId: string
  clinicId: string
  patientId: string
  treatmentType: string
  onPaymentUpdate?: () => void
}

const PaymentManagementSimple: React.FC<PaymentManagementSimpleProps> = ({
  treatmentId,
  clinicId,
  patientId,
  treatmentType,
  onPaymentUpdate
}) => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    total_amount: 0,
    payment_type: 'full',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Load payment data
  const loadPaymentData = async () => {
    try {
      setLoading(true)
      const summary = await simplePaymentApi.getPaymentSummary(treatmentId)
      setPaymentSummary(summary)

      if (summary) {
        const treatmentPayment = await simplePaymentApi.getTreatmentPayment(treatmentId)
        if (treatmentPayment) {
          const transactions = await simplePaymentApi.getPaymentTransactions(treatmentPayment.id)
          setTransactions(transactions)
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
      setHasInitiallyLoaded(true)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [treatmentId])

  // Auto-open payment dialog only on initial load when no payment data exists
  useEffect(() => {
    if (hasInitiallyLoaded && !loading && paymentSummary === null) {
      setShowAddPaymentDialog(true)
    }
  }, [hasInitiallyLoaded, paymentSummary, loading])

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      // Check if payment record exists
      let treatmentPayment = await simplePaymentApi.getTreatmentPayment(treatmentId)
      
      if (!treatmentPayment) {
        // Create new payment record
        treatmentPayment = await simplePaymentApi.createTreatmentPayment({
          treatment_id: treatmentId,
          clinic_id: clinicId,
          patient_id: patientId,
          total_amount: formData.total_amount,
          paid_amount: 0,
          payment_status: 'Pending'
        })
      }

      // Calculate payment amount
      const paymentAmount = formData.payment_type === 'full' 
        ? formData.total_amount 
        : (formData.partial_amount || 0)

      // Add payment transaction
      await simplePaymentApi.addPaymentTransaction({
        treatment_payment_id: treatmentPayment.id,
        amount: paymentAmount,
        payment_date: formData.payment_date,
        notes: formData.notes || undefined
      })

      // Reload data
      await loadPaymentData()
      
      // Reset form
      setFormData({
        total_amount: 0,
        payment_type: 'full',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      setShowAddPaymentDialog(false)
      toast.success('Payment added successfully')
      
      if (onPaymentUpdate) {
        onPaymentUpdate()
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Partial': return 'bg-yellow-100 text-yellow-800'
      case 'Pending': return 'bg-gray-100 text-gray-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !paymentSummary) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Payment Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Summary</span>
            <Button 
              onClick={() => setShowAddPaymentDialog(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Payment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentSummary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Treatment Cost</span>
                <span className="text-lg font-semibold">₹{paymentSummary.total_amount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Amount Paid</span>
                <span className="text-lg font-semibold text-green-600">₹{paymentSummary.paid_amount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Remaining Balance</span>
                <span className="text-lg font-semibold text-red-600">₹{paymentSummary.remaining_amount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Payment Progress</span>
                  <span>{Math.round((paymentSummary.paid_amount / paymentSummary.total_amount) * 100)}%</span>
                </div>
                <Progress value={(paymentSummary.paid_amount / paymentSummary.total_amount) * 100} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge className={getStatusColor(paymentSummary.payment_status)}>
                  {paymentSummary.payment_status}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No payment record found for this treatment</p>
                          <Button 
              onClick={() => setShowAddPaymentDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Set Treatment Cost & Payment
            </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💰</div>
                    <div>
                                              <div className="font-medium">
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {transaction.notes && (
                      <div className="text-xs text-gray-500 max-w-32 truncate">
                        {transaction.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Treatment Cost & Payment</DialogTitle>
            <DialogDescription>
              Set the total treatment cost and payment details for this patient.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Total Amount */}
            <div>
              <Label htmlFor="total_amount">Total Treatment Cost (₹)</Label>
              <Input
                id="total_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                placeholder="Enter total cost in ₹"
                required
              />
            </div>

            {/* Payment Type */}
            <div>
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select 
                value={formData.payment_type} 
                onValueChange={(value: 'full' | 'partial') => handleInputChange('payment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Partial Amount */}
            {formData.payment_type === 'partial' && (
              <div>
                <Label htmlFor="partial_amount">Partial Amount (₹)</Label>
                <Input
                  id="partial_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={formData.total_amount}
                  value={formData.partial_amount || ''}
                  onChange={(e) => handleInputChange('partial_amount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter partial amount in ₹"
                  required
                />
              </div>
            )}

            {/* Payment Date */}
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this payment"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)} disabled={loading}>
                Cancel
              </Button>
                          <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Payment Details'}
            </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentManagementSimple
