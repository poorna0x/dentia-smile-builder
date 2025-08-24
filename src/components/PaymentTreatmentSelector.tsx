import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Circle } from 'lucide-react'
import { DentalTreatment } from '@/lib/dental-treatments'

interface PaymentTreatmentSelectorProps {
  treatments: DentalTreatment[]
  onSelectTreatment: (treatment: DentalTreatment) => void
}

const PaymentTreatmentSelector: React.FC<PaymentTreatmentSelectorProps> = ({
  treatments,
  onSelectTreatment
}) => {
  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Planned': return 'bg-blue-100 text-blue-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Treatment for Payment</h3>
        <span className="text-sm text-gray-500">{treatments.length} treatments</span>
      </div>
      
      <div className="grid gap-3">
        {treatments.map((treatment) => (
          <Card 
            key={treatment.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
            onClick={() => onSelectTreatment(treatment)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      {treatment.treatment_type}
                    </h4>
                    <Badge className={`text-xs ${getTreatmentStatusColor(treatment.treatment_status)}`}>
                      {treatment.treatment_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600">
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
                  </div>
                  
                  {treatment.treatment_description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">
                      {treatment.treatment_description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <Button size="sm" variant="outline" className="text-xs">
                    Manage Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PaymentTreatmentSelector
