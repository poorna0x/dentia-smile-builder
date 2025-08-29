import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { simplePaymentApi } from '@/lib/payment-system-simple'
import { 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building, 
  FileText, 
  Shield, 
  MoreHorizontal 
} from 'lucide-react'

interface PaymentAnalyticsProps {
  clinicId: string
  patientId?: string
  startDate?: string
  endDate?: string
  daysBack?: number
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({
  clinicId,
  patientId,
  startDate,
  endDate,
  daysBack = 30
}) => {
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let data: any[] = []
        
        if (patientId) {
          // Get patient-specific analytics
          data = await simplePaymentApi.getPatientPaymentAnalytics(patientId, clinicId)
        } else {
          // Get clinic-wide analytics
          data = await simplePaymentApi.getClinicPaymentAnalytics(clinicId, startDate, endDate)
        }
        
        setAnalytics(data)
      } catch (err) {
        console.error('Error loading payment analytics:', err)
        setError('Failed to load payment analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [clinicId, patientId, startDate, endDate])

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash': return <DollarSign className="h-4 w-4" />
      case 'Card': return <CreditCard className="h-4 w-4" />
      case 'UPI': return <Smartphone className="h-4 w-4" />
      case 'Bank Transfer': return <Building className="h-4 w-4" />
      case 'Cheque': return <FileText className="h-4 w-4" />
      case 'Insurance': return <Shield className="h-4 w-4" />
      default: return <MoreHorizontal className="h-4 w-4" />
    }
  }

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'Cash': return 'bg-green-100 text-green-800'
      case 'Card': return 'bg-blue-100 text-blue-800'
      case 'UPI': return 'bg-purple-100 text-purple-800'
      case 'Bank Transfer': return 'bg-indigo-100 text-indigo-800'
      case 'Cheque': return 'bg-orange-100 text-orange-800'
      case 'Insurance': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No payment data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = analytics.reduce((sum, item) => sum + parseFloat(item.total_amount), 0)
  const totalTransactions = analytics.reduce((sum, item) => sum + parseInt(item.transaction_count), 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Modes</p>
                <p className="text-2xl font-bold">{analytics.length}</p>
              </div>
              <MoreHorizontal className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Mode Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Mode Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.map((item) => (
              <div key={item.payment_mode} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getPaymentModeColor(item.payment_mode)}`}>
                    {getPaymentModeIcon(item.payment_mode)}
                  </div>
                  <div>
                    <div className="font-medium">{item.payment_mode}</div>
                    <div className="text-sm text-gray-600">
                      {item.transaction_count} transaction{item.transaction_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {parseFloat(item.percentage).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentAnalytics
