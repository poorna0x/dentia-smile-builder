import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  Calendar, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  paymentApi, 
  paymentUtils, 
  type PaymentSummary, 
  type PaymentTransaction, 
  type PaymentMethod,
  type PaymentFormData
} from '@/lib/payment-system'

interface PaymentManagementProps {
  treatmentId: string
  clinicId: string
  patientId: string
  treatmentType: string
  onPaymentUpdate?: () => void
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
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
      
      // Get payment summary
      const summary = await paymentApi.getPaymentSummary(treatmentId)
      setPaymentSummary(summary)
      
      // If payment exists, get transactions
      if (summary) {
        const treatmentPayment = await paymentApi.getTreatmentPayment(treatmentId)
        if (treatmentPayment) {
          const paymentTransactions = await paymentApi.getPaymentTransactions(treatmentPayment.id)
          setTransactions(paymentTransactions)
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error)
      toast.error('Failed to load payment information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [treatmentId])

  // Handle form input changes
  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle payment submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.total_amount || formData.total_amount <= 0) {
      toast.error('Please enter a valid total amount')
      return
    }

    if (formData.payment_type === 'partial' && (!formData.partial_amount || formData.partial_amount <= 0)) {
      toast.error('Please enter a valid partial amount')
      return
    }

    try {
      setLoading(true)

      // Check if payment record exists
      let treatmentPayment = await paymentApi.getTreatmentPayment(treatmentId)
      
      if (!treatmentPayment) {
        // Create new payment record
        treatmentPayment = await paymentApi.createTreatmentPayment({
          treatment_id: treatmentId,
          clinic_id: clinicId,
          patient_id: patientId,
          total_amount: formData.total_amount,
          paid_amount: 0
        })
      }

      // Add payment transaction
      const paymentAmount = formData.payment_type === 'full' 
        ? (treatmentPayment?.remaining_amount || formData.total_amount)
        : (formData.partial_amount || 0)

      await paymentApi.addPaymentTransaction({
        treatment_payment_id: treatmentPayment.id,
        amount: paymentAmount,
        payment_date: formData.payment_date,
        notes: formData.notes || undefined
      })

      toast.success('Payment added successfully')
      setShowAddPaymentDialog(false)
      setFormData({
        total_amount: 0,
        payment_type: 'full',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      // Reload payment data
      await loadPaymentData()
      onPaymentUpdate?.()
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  // Calculate payment percentage
  const paymentPercentage = paymentSummary 
    ? paymentUtils.calculatePaymentPercentage(paymentSummary.paid_amount, paymentSummary.total_amount)
    : 0

  return (
    <div className="space-y-4">
      {/* Payment Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : paymentSummary ? (
            <div className="space-y-4">
              {/* Payment Status and Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={paymentUtils.getPaymentStatusColor(paymentSummary.payment_status)}>
                    {paymentSummary.payment_status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {paymentSummary.transaction_count} payment{paymentSummary.transaction_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddPaymentDialog(true)}
                  disabled={paymentSummary.payment_status === 'Completed'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Progress</span>
                  <span>{paymentPercentage}%</span>
                </div>
                <Progress value={paymentPercentage} className="h-2" />
              </div>

              {/* Amount Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {paymentUtils.formatAmount(paymentSummary.total_amount)}
                  </div>
                  <div className="text-xs text-gray-600">Total Amount</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {paymentUtils.formatAmount(paymentSummary.paid_amount)}
                  </div>
                  <div className="text-xs text-gray-600">Paid Amount</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {paymentUtils.formatAmount(paymentSummary.remaining_amount)}
                  </div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No payment information available</p>
              <Button onClick={() => setShowAddPaymentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                                         <div className="text-2xl">
                       💰
                     </div>
                    <div>
                      <div className="font-medium">
                        {paymentUtils.formatAmount(transaction.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.payment_date).toLocaleDateString()}
                      </div>
                      
                    </div>
                  </div>
                  {transaction.notes && (
                    <div className="text-sm text-gray-600 max-w-xs truncate" title={transaction.notes}>
                      {transaction.notes}
                    </div>
                  )}
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
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a new payment record for this patient's treatment.
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
                placeholder="Enter total cost"
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
                  placeholder="Enter partial amount"
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddPaymentDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentManagement
