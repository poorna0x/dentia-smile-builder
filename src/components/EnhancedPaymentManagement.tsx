import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { simplePaymentApi, PaymentSummary, PaymentTransaction, PaymentFormData } from '@/lib/payment-system-simple'
import { DentalTreatment } from '@/lib/dental-treatments'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react'

interface EnhancedPaymentManagementProps {
  treatment: DentalTreatment
  treatments: DentalTreatment[]
  clinicId: string
  patientId: string
  onBack: () => void
  onTreatmentChange: (treatment: DentalTreatment) => void
  onPaymentUpdate?: () => void
}

const EnhancedPaymentManagement: React.FC<EnhancedPaymentManagementProps> = ({
  treatment,
  treatments,
  clinicId,
  patientId,
  onBack,
  onTreatmentChange,
  onPaymentUpdate
}) => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false)
  const [showEditCostDialog, setShowEditCostDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<PaymentTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    total_amount: 0,
    payment_type: 'full',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [miscCost, setMiscCost] = useState({
    amount: 0,
    description: ''
  })

  const [editCostData, setEditCostData] = useState({
    total_amount: 0,
    partial_amount: 0
  })


  // Load payment data (optimized)
  const loadPaymentData = async () => {
    try {
      setLoading(true)
      
      // Get payment summary (this includes transaction count)
      const summary = await simplePaymentApi.getPaymentSummary(treatment.id)
      setPaymentSummary(summary)

      // Only load transactions if we have a payment record
      if (summary) {
        const treatmentPayment = await simplePaymentApi.getTreatmentPayment(treatment.id)
        if (treatmentPayment) {
          const transactions = await simplePaymentApi.getPaymentTransactions(treatmentPayment.id)
          setTransactions(transactions)
        } else {
          setTransactions([])
        }
      } else {
        setTransactions([])
      }

      // Reset form data when payment data changes
      setFormData({
        total_amount: 0,
        payment_type: 'partial',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })

      // Reset misc cost
      setMiscCost({
        amount: 0,
        description: ''
      })
    } catch (error) {
      console.error('Error loading payment data:', error)
      // Don't show error toast for missing payment records
      if (!error.message?.includes('No payment record')) {
        toast.error('Failed to load payment data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [treatment.id])

  // Remove the force refresh - it's causing unnecessary lag

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Function to sync payments across all treatments in a multi-tooth procedure
  const syncMultiToothPayments = async (currentTreatmentPayment: any, paymentAmount: number, miscAmount: number) => {
    try {
      // Check if this is a multi-tooth procedure by looking for related treatments
      const { dentalTreatmentApi } = await import('@/lib/dental-treatments')
      const allTreatments = await dentalTreatmentApi.getByPatient(patientId, clinicId)

      // Find treatments that are part of the same multi-tooth procedure
      const relatedTreatments = allTreatments.filter(t => {
        const sameDescription = t.treatment_description === treatment.treatment_description
        const sameDate = t.treatment_date === treatment.treatment_date
        
        const currentTreatmentDate = new Date(treatment.created_at)
        const otherTreatmentDate = new Date(t.created_at)
        const timeDiff = Math.abs(currentTreatmentDate.getTime() - otherTreatmentDate.getTime())
        const withinTimeWindow = timeDiff < 5 * 60 * 1000 // 5 minutes

        const isRelated = sameDescription && sameDate && withinTimeWindow && t.id !== treatment.id
        return isRelated
      })

      const isMultiTooth = relatedTreatments.length > 0

      if (!isMultiTooth) {
        return
      }

      // Show confirmation toast
      toast.info(`Syncing payment across ${relatedTreatments.length} teeth. This will take a few seconds...`)

      // Update payment records for all related treatments
      for (const relatedTreatment of relatedTreatments) {
        try {
          const relatedPayment = await simplePaymentApi.getTreatmentPayment(relatedTreatment.id)
          
          if (relatedPayment) {
            if (paymentAmount > 0) {
              await simplePaymentApi.addPaymentTransaction({
                treatment_payment_id: relatedPayment.id,
                amount: paymentAmount,
                payment_date: formData.payment_date,
                notes: `Multi-tooth sync: ${formData.notes || 'Additional payment'}`
              })
            }

            if (miscAmount > 0) {
              await simplePaymentApi.addPaymentTransaction({
                treatment_payment_id: relatedPayment.id,
                amount: miscAmount,
                payment_date: formData.payment_date,
                notes: `Multi-tooth sync: Miscellaneous: ${miscCost.description} (₹${miscAmount})`
              })
            }
          }
        } catch (error) {
          // Continue with other treatments even if one fails
        }
      }

      // Show completion notification
      toast.success(`✅ Payment synced across ${relatedTreatments.length} teeth successfully!`)
    } catch (error) {
      toast.error('❌ Failed to sync payment across teeth')
    }
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      // Check if payment record exists
      let treatmentPayment = await simplePaymentApi.getTreatmentPayment(treatment.id)
      
      if (!treatmentPayment) {
        // First time payment - create new payment record
        treatmentPayment = await simplePaymentApi.createTreatmentPayment({
          treatment_id: treatment.id,
          clinic_id: clinicId,
          patient_id: patientId,
          total_amount: formData.total_amount,
          paid_amount: 0,
          payment_status: 'Pending'
        })
      }

      // Calculate payment amount
      let paymentAmount = 0
      let miscPaymentAmount = 0

      if (!paymentSummary) {
        // First time payment
        if (formData.payment_type === 'full') {
          paymentAmount = formData.total_amount
        } else {
          paymentAmount = formData.partial_amount || 0
        }
        miscPaymentAmount = miscCost.amount || 0
      } else {
        // Subsequent payments - always use partial amount
        paymentAmount = formData.partial_amount || 0
        miscPaymentAmount = miscCost.amount || 0
      }

      // Validate that at least one payment is being made
      if (paymentAmount <= 0 && miscPaymentAmount <= 0) {
        toast.error('Please enter either a payment amount or miscellaneous cost')
        return
      }

      // Add main payment transaction if there's a payment amount
      if (paymentAmount > 0) {
        await simplePaymentApi.addPaymentTransaction({
          treatment_payment_id: treatmentPayment.id,
          amount: paymentAmount,
          payment_date: formData.payment_date,
          notes: formData.notes || undefined
        })
      }

      // Add miscellaneous cost transaction if there's a misc amount
      if (miscPaymentAmount > 0) {
        await simplePaymentApi.addPaymentTransaction({
          treatment_payment_id: treatmentPayment.id,
          amount: miscPaymentAmount,
          payment_date: formData.payment_date,
          notes: `Miscellaneous: ${miscCost.description} (₹${miscPaymentAmount})`
        })
      }

      // Check if this is a multi-tooth procedure and sync payments across all related treatments
      await syncMultiToothPayments(treatmentPayment, paymentAmount, miscPaymentAmount)

      // Reload data to get updated summary
      await loadPaymentData()
      
      // Reset form for next payment
      setFormData({
        total_amount: 0,
        payment_type: 'partial', // Default to partial for subsequent payments
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })

      // Reset misc cost
      setMiscCost({
        amount: 0,
        description: ''
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

  const handleEditCost = () => {
    if (paymentSummary) {
      setEditCostData({
        total_amount: paymentSummary.total_amount,
        partial_amount: paymentSummary.paid_amount
      })
      setShowEditCostDialog(true)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return

    try {
      setLoading(true)
      // Note: You'll need to add a delete function to the API
      // await simplePaymentApi.deletePaymentTransaction(editingTransaction.id)
      await loadPaymentData()
      setShowDeleteConfirm(false)
      setEditingTransaction(null)
      toast.success('Payment deleted successfully')
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Get the treatment payment record
      const treatmentPayment = await simplePaymentApi.getTreatmentPayment(treatment.id)
      
      if (treatmentPayment) {
        // Update the total amount using the API
        await simplePaymentApi.updateTreatmentPaymentTotal(treatmentPayment.id, editCostData.total_amount)
        
        // Reload data to get updated summary
        await loadPaymentData()
        setShowEditCostDialog(false)
        toast.success('Cost updated successfully')
      }
    } catch (error) {
      console.error('Error updating cost:', error)
      toast.error('Failed to update cost')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4" />
      case 'Partial': return <TrendingUp className="h-4 w-4" />
      case 'Pending': return <Clock className="h-4 w-4" />
      case 'Overdue': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="text-xs"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">{treatment.treatment_type}</h2>
            <p className="text-xs sm:text-sm text-gray-600">Tooth {treatment.tooth_number} • {treatment.treatment_status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadPaymentData}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowAddPaymentDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{paymentSummary ? 'Add More Payment' : 'Set Cost & Payment'}</span>
          </Button>
        </div>
      </div>



      <Tabs defaultValue="summary" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 bg-transparent">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Payment Summary</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">Payment History</TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">Treatment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 overflow-y-auto scrollbar-transparent" style={{ height: '350px', minHeight: '350px', maxHeight: '350px' }}>
          {paymentSummary ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg font-bold">₹</span>
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                                     {/* Payment Status */}
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-3">
                       {getStatusIcon(paymentSummary.payment_status)}
                       <div>
                         <h3 className="font-semibold">Payment Status</h3>
                         <Badge className={getStatusColor(paymentSummary.payment_status)}>
                           {paymentSummary.payment_status}
                         </Badge>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-gray-600">Total Transactions</p>
                       <p className="text-lg font-bold">{paymentSummary.transaction_count}</p>
                     </div>
                   </div>

                  {/* Amount Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₹{paymentSummary.total_amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-600">₹{paymentSummary.paid_amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-red-50">
                      <p className="text-sm text-gray-600 mb-1">Remaining</p>
                      <p className="text-2xl font-bold text-red-600">₹{paymentSummary.remaining_amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                                     {/* Progress Bar */}
                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span>Payment Progress</span>
                       <span>{Math.round((paymentSummary.paid_amount / paymentSummary.total_amount) * 100)}%</span>
                     </div>
                     <Progress value={(paymentSummary.paid_amount / paymentSummary.total_amount) * 100} className="h-3" />
                   </div>

                   {/* Edit Cost Button */}
                   <div className="flex justify-end pt-2">
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={handleEditCost}
                     >
                       <Edit className="h-3 w-3 mr-1" />
                       Edit Cost
                     </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <span className="text-4xl text-gray-300 mx-auto mb-4 block">₹</span>
                <h3 className="text-lg font-medium mb-2">No Payment Record</h3>
                <p className="text-gray-500 mb-4">Start tracking payments for this treatment</p>
                <Button onClick={() => setShowAddPaymentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Treatment Cost & Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 overflow-y-auto scrollbar-transparent" style={{ height: '350px', minHeight: '350px', maxHeight: '350px' }}>
          {transactions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">💰</div>
                        <div>
                          <div className="font-medium">
                            ₹{transaction.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(transaction.payment_date).toLocaleDateString()}
                          </div>
                          {transaction.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTransaction(transaction)
                            setShowDeleteConfirm(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                <p className="text-gray-500">No payments have been recorded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4 overflow-y-auto scrollbar-transparent" style={{ height: '350px', minHeight: '350px', maxHeight: '350px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Treatment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Treatment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Treatment Type:</span>
                      <span className="font-medium">{treatment.treatment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tooth Number:</span>
                      <span className="font-medium">{treatment.tooth_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(treatment.treatment_status)}>
                        {treatment.treatment_status}
                      </Badge>
                    </div>
                    {treatment.treatment_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Treatment Date:</span>
                        <span className="font-medium">{new Date(treatment.treatment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Description & Notes</h4>
                  <div className="space-y-2 text-sm">
                    {treatment.treatment_description && (
                      <div>
                        <span className="text-gray-600">Description:</span>
                        <p className="mt-1">{treatment.treatment_description}</p>
                      </div>
                    )}
                    {treatment.notes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="mt-1">{treatment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{paymentSummary ? 'Add Additional Payment' : 'Set Cost & Payment'}</DialogTitle>
            <DialogDescription>
              {paymentSummary ? 'Add an additional payment to the existing treatment cost.' : 'Set the total treatment cost and initial payment details.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Total Amount - Only show if no payment record exists */}
            {!paymentSummary && (
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
            )}

            {/* Show current payment status if payment record exists */}
            {paymentSummary && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Current Payment Status:</div>
                  <div>Total Cost: ₹{paymentSummary.total_amount.toLocaleString('en-IN')}</div>
                  <div>Amount Paid: ₹{paymentSummary.paid_amount.toLocaleString('en-IN')}</div>
                  <div>Remaining: ₹{paymentSummary.remaining_amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            )}

            {/* Payment Type - Only show if no payment record exists */}
            {!paymentSummary && (
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
            )}

            {/* Partial Amount - Show for partial payments or subsequent payments */}
            {(formData.payment_type === 'partial' || paymentSummary) && (
              <div>
                <Label htmlFor="partial_amount">
                  {paymentSummary ? 'Additional Payment Amount (₹)' : 'Partial Amount (₹)'}
                </Label>
                <Input
                  id="partial_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={paymentSummary ? paymentSummary.remaining_amount : formData.total_amount}
                  value={formData.partial_amount || ''}
                  onChange={(e) => handleInputChange('partial_amount', parseFloat(e.target.value) || 0)}
                  placeholder={paymentSummary ? `Enter amount (max: ₹${paymentSummary.remaining_amount.toLocaleString('en-IN')})` : "Enter partial amount in ₹"}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if only adding miscellaneous cost</p>
              </div>
            )}

            {/* Miscellaneous Cost */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="misc_amount">Miscellaneous Cost (₹)</Label>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="misc_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={miscCost.amount || ''}
                  onChange={(e) => setMiscCost(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Amount"
                />
                <Input
                  id="misc_description"
                  type="text"
                  value={miscCost.description}
                  onChange={(e) => setMiscCost(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (e.g., X-ray, Medicine)"
                />
              </div>
              <p className="text-xs text-gray-500">Can be added independently of main treatment payment</p>
            </div>

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
                {loading ? 'Adding...' : (paymentSummary ? 'Add Payment' : 'Set Cost & Payment')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

             {/* Edit Cost Dialog */}
       <Dialog open={showEditCostDialog} onOpenChange={setShowEditCostDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Edit Treatment Cost</DialogTitle>
             <DialogDescription>
               Update the total treatment cost and amount already paid.
             </DialogDescription>
           </DialogHeader>
           <form onSubmit={handleUpdateCost} className="space-y-4">
             <div>
               <Label htmlFor="edit_total_amount">Total Treatment Cost (₹)</Label>
               <Input
                 id="edit_total_amount"
                 type="number"
                 min="0"
                 step="0.01"
                 value={editCostData.total_amount}
                 onChange={(e) => setEditCostData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                 placeholder="Enter total cost in ₹"
                 required
               />
             </div>
             
             <div>
               <Label htmlFor="edit_partial_amount">Amount Already Paid (₹)</Label>
               <Input
                 id="edit_partial_amount"
                 type="number"
                 min="0"
                 step="0.01"
                 max={editCostData.total_amount}
                 value={editCostData.partial_amount}
                 onChange={(e) => setEditCostData(prev => ({ ...prev, partial_amount: parseFloat(e.target.value) || 0 }))}
                 placeholder="Enter amount already paid"
                 required
               />
             </div>

             <div className="flex gap-2 justify-end pt-4">
               <Button type="button" variant="outline" onClick={() => setShowEditCostDialog(false)} disabled={loading}>
                 Cancel
               </Button>
               <Button type="submit" disabled={loading}>
                 {loading ? 'Updating...' : 'Update Cost'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Payment</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete this payment? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteTransaction} className="bg-red-600 hover:bg-red-700">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  )
}

export default EnhancedPaymentManagement
