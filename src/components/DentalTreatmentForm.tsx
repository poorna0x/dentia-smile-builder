import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Calendar, DollarSign, FileText, Circle } from 'lucide-react'
import { 
  DentalTreatment, 
  toothChartUtils,
  dentalTreatmentApi
} from '@/lib/dental-treatments'

interface DentalTreatmentFormProps {
  patientId: string
  clinicId: string
  appointmentId?: string
  selectedTooth?: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<DentalTreatment>
}

const DentalTreatmentForm: React.FC<DentalTreatmentFormProps> = ({
  patientId,
  clinicId,
  appointmentId,
  selectedTooth,
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    tooth_number: selectedTooth || '',
    tooth_position: '',
    treatment_type: '',
    treatment_description: '',
    treatment_status: 'Planned' as const,
    treatment_date: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [availableTeeth] = useState(toothChartUtils.getAllTeeth())
  const [treatmentTypes] = useState(toothChartUtils.getTreatmentTypes())

  // Update tooth position when tooth number changes
  useEffect(() => {
    if (formData.tooth_number) {
      const position = toothChartUtils.getToothPosition(formData.tooth_number)
      setFormData(prev => ({ ...prev, tooth_position: position }))
    }
  }, [formData.tooth_number])

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        tooth_number: initialData.tooth_number || '',
        tooth_position: initialData.tooth_position || '',
        treatment_type: initialData.treatment_type || '',
        treatment_description: initialData.treatment_description || '',
        treatment_status: initialData.treatment_status || 'Planned',
        treatment_date: initialData.treatment_date || '',

        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const treatmentData = {
        clinic_id: clinicId,
        patient_id: patientId,
        appointment_id: appointmentId,
        tooth_number: formData.tooth_number,
        tooth_position: formData.tooth_position,
        treatment_type: formData.treatment_type,
        treatment_description: formData.treatment_description || undefined,
        treatment_status: formData.treatment_status,
        treatment_date: formData.treatment_date || undefined,

        notes: formData.notes || undefined,
        created_by: 'Doctor' // TODO: Get from auth context
      }

      if (initialData?.id) {
        // Update existing treatment
        await dentalTreatmentApi.update(initialData.id, treatmentData)
        toast.success('Treatment updated successfully')
      } else {
        // Create new treatment
        await dentalTreatmentApi.create(treatmentData)
        toast.success('Treatment added successfully')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error saving treatment:', error)
      toast.error('Failed to save treatment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-5 w-5" />
          {initialData?.id ? 'Edit Treatment' : 'Add New Treatment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tooth Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tooth_number">Tooth Number *</Label>
              <Select 
                value={formData.tooth_number} 
                onValueChange={(value) => handleInputChange('tooth_number', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tooth" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeeth.map((tooth) => (
                    <SelectItem key={tooth} value={tooth}>
                      {tooth} - {toothChartUtils.getToothName(tooth)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tooth_position">Position</Label>
              <Input
                id="tooth_position"
                value={formData.tooth_position}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Treatment Type */}
          <div className="space-y-2">
            <Label htmlFor="treatment_type">Treatment Type *</Label>
            <Select 
              value={formData.treatment_type} 
              onValueChange={(value) => handleInputChange('treatment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Description */}
          <div className="space-y-2">
            <Label htmlFor="treatment_description">Description</Label>
            <Textarea
              id="treatment_description"
              value={formData.treatment_description}
              onChange={(e) => handleInputChange('treatment_description', e.target.value)}
              placeholder="Describe the treatment details..."
              rows={3}
            />
          </div>

          {/* Treatment Status and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treatment_status">Status *</Label>
              <Select 
                value={formData.treatment_status} 
                onValueChange={(value) => handleInputChange('treatment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_date">Treatment Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="treatment_date"
                  type="date"
                  value={formData.treatment_date}
                  onChange={(e) => handleInputChange('treatment_date', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>



          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="pl-10"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.tooth_number || !formData.treatment_type}
            >
              {loading ? 'Saving...' : (initialData?.id ? 'Update Treatment' : 'Add Treatment')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default DentalTreatmentForm
