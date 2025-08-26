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
  Clock
} from 'lucide-react'

interface LabWorkOrder {
  id: string
  test_name: string
  lab_type: string
  order_number: string
  status: string
  ordered_date: string
  expected_date?: string
  cost?: number
  description?: string
}

interface LabWorkPaymentSummary {
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: string
  transaction_count: number
}

interface LabWorkPaymentTransaction {
  id: string
  amount: number
  payment_date: string
  notes?: string
  created_at: string
}

interface LabWorkPaymentFormData {
  total_amount: number
  payment_type: 'full' | 'partial'
  partial_amount?: number
  payment_date: string
  notes: string
}

interface EnhancedLabWorkPaymentManagementProps {
  labWork: LabWorkOrder
  labWorkOrders: LabWorkOrder[]
  clinicId: string
  patientId: string
  onBack: () => void
  onLabWorkChange: (labWork: LabWorkOrder) => void
  onPaymentUpdate?: () => void
}

const EnhancedLabWorkPaymentManagement: React.FC<EnhancedLabWorkPaymentManagementProps> = ({
  labWork,
  labWorkOrders,
  clinicId,
  patientId,
  onBack,
  onLabWorkChange,
  onPaymentUpdate
}) => {
  const [paymentSummary, setPaymentSummary] = useState<LabWorkPaymentSummary | null>(null)
  const [transactions, setTransactions] = useState<LabWorkPaymentTransaction[]>([])
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false)
  const [showEditCostDialog, setShowEditCostDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<LabWorkPaymentTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<LabWorkPaymentFormData>({
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

  // Load payment data
  const loadPaymentData = async () => {
    try {
      setLoading(true)
      // TODO: Implement lab work payment API calls
      // For now, using mock data - cost is set in payment dialog, NOT from lab work order
      const mockSummary: LabWorkPaymentSummary = {
        total_amount: 0, // Cost will be set in payment dialog
        paid_amount: 0,
        remaining_amount: 0,
        payment_status: 'Pending',
        transaction_count: 0
      }
      setPaymentSummary(mockSummary)
      setTransactions([])

      // Reset form data when payment data changes
      setFormData({
        total_amount: 0, // Cost will be set in payment dialog
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
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [labWork.id])

  const handleInputChange = (field: keyof LabWorkPaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      // TODO: Implement lab work payment API calls
      // For now, using mock data
      console.log('Lab work payment details:', {
        labWorkId: labWork.id,
        paymentSummary: !!paymentSummary,
        paymentType: formData.payment_type,
        totalAmount: formData.total_amount,
        partialAmount: formData.partial_amount,
        miscAmount: miscCost.amount,
        miscDescription: miscCost.description
      })

      // Mock successful payment
      await new Promise(resolve => setTimeout(resolve, 1000))

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
      // TODO: Implement delete function
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
      
      // TODO: Implement cost update API
      console.log('Updating lab work cost:', editCostData)
      
      // Mock successful update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reload data to get updated summary
      await loadPaymentData()
      setShowEditCostDialog(false)
      toast.success('Cost updated successfully')
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
            <h2 className="text-lg sm:text-xl font-semibold">{labWork.lab_type}</h2>
            <p className="text-xs sm:text-sm text-gray-600">Order {labWork.order_number} • {labWork.status}</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowAddPaymentDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{paymentSummary ? 'Add More Payment' : 'Set Cost & Payment'}</span>
        </Button>
      </div>

      <Tabs defaultValue="summary" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 bg-transparent">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Payment Summary</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">Payment History</TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">Lab Work Details</TabsTrigger>
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
                <p className="text-gray-500 mb-4">Start tracking payments for this lab work</p>
                <Button onClick={() => setShowAddPaymentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Lab Work Cost & Payment
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
              <CardTitle>Lab Work Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Lab Work Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lab Type:</span>
                      <span className="font-medium">{labWork.lab_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">{labWork.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{labWork.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ordered Date:</span>
                      <span className="font-medium">{new Date(labWork.ordered_date).toLocaleDateString()}</span>
                    </div>
                    {labWork.expected_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Date:</span>
                        <span className="font-medium">{new Date(labWork.expected_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <div className="text-sm text-gray-700">
                    {labWork.description || 'No description provided'}
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
              {paymentSummary ? 'Add an additional payment to the existing lab work cost.' : 'Set the total lab work cost and initial payment details.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Total Cost - Only show if no payment record exists */}
            {!paymentSummary && (
              <div>
                <Label htmlFor="total_amount">Total Lab Work Cost (₹)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_amount || ''}
                  onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter total cost in ₹"
                  required
                />
              </div>
            )}

            {/* Current Payment Status - Show if payment record exists */}
            {paymentSummary && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Current Payment Status</p>
                <p className="text-xs text-gray-600">
                  Paid: ₹{paymentSummary.paid_amount.toLocaleString('en-IN')} / 
                  Total: ₹{paymentSummary.total_amount.toLocaleString('en-IN')} 
                  (₹{paymentSummary.remaining_amount.toLocaleString('en-IN')} remaining)
                </p>
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
              <p className="text-xs text-gray-500">Can be added independently of main lab work payment</p>
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
                {paymentSummary ? 'Add Payment' : 'Set Cost & Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Cost Dialog */}
      <Dialog open={showEditCostDialog} onOpenChange={setShowEditCostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lab Work Cost</DialogTitle>
            <DialogDescription>
              Update the total lab work cost for this patient.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCost} className="space-y-4">
            <div>
              <Label htmlFor="edit_total_amount">Total Cost (₹)</Label>
              <Input
                id="edit_total_amount"
                type="number"
                min="0"
                step="0.01"
                value={editCostData.total_amount || ''}
                onChange={(e) => setEditCostData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter new total cost"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditCostDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Update Cost
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

export default EnhancedLabWorkPaymentManagement
