import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Circle } from 'lucide-react'

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

interface LabWorkPaymentSelectorProps {
  labWorkOrders: LabWorkOrder[]
  onSelectLabWork: (labWork: LabWorkOrder) => void
}

const LabWorkPaymentSelector: React.FC<LabWorkPaymentSelectorProps> = ({
  labWorkOrders,
  onSelectLabWork
}) => {
  const getLabWorkStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Pending': return 'bg-blue-100 text-blue-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (labWorkOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
        <Circle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">No lab work orders found</p>
        <p className="text-sm">Add a lab work order first to manage payments</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Select Lab Work for Payment</h3>
      </div>
      
      <div className="grid gap-3">
        {labWorkOrders
          .sort((a, b) => new Date(b.ordered_date).getTime() - new Date(a.ordered_date).getTime()) // Recent first
          .map((labWork) => (
          <Card 
            key={labWork.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
            onClick={() => onSelectLabWork(labWork)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      {labWork.lab_type}
                    </h4>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Order:</span>
                      <span>{labWork.order_number}</span>
                    </div>
                    {labWork.ordered_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(labWork.ordered_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {labWork.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">
                      {labWork.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-center justify-center sm:justify-end gap-1">
                  <Badge className={`text-xs ${getLabWorkStatusColor(labWork.status)}`}>
                    {labWork.status}
                  </Badge>
                  <span className="text-green-600 font-bold text-lg">₹</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default LabWorkPaymentSelector
