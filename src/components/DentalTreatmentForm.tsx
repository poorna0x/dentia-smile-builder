import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Calendar, DollarSign, FileText, Circle, CreditCard, User, X } from 'lucide-react'
import { 
  DentalTreatment, 
  toothChartUtils,
  dentalTreatmentApi
} from '@/lib/dental-treatments'
import { dentistsApi, Dentist, treatmentTypesApi, TreatmentType } from '@/lib/supabase'
import PaymentManagementSimple from './PaymentManagementSimple'

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
    treatment_status: 'Planned' as 'Planned' | 'In Progress' | 'Completed' | 'Cancelled',
    treatment_date: '',
    notes: ''
  })
  
  // Doctor selection state
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
  const [otherDoctorName, setOtherDoctorName] = useState('')
  const [showOtherDoctorInput, setShowOtherDoctorInput] = useState(false)
  const [loadingDentists, setLoadingDentists] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [availableTeeth] = useState(toothChartUtils.getAllTeeth())
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([])
  const [loadingTreatmentTypes, setLoadingTreatmentTypes] = useState(true)
  const [createdTreatmentId, setCreatedTreatmentId] = useState<string | null>(null)
  const [showPaymentManagement, setShowPaymentManagement] = useState(false)

  // Load dentists and treatment types for the clinic
  useEffect(() => {
    const loadData = async () => {
      try {
        
        // Load dentists
        setLoadingDentists(true)
        const dentistsData = await dentistsApi.getAll(clinicId)
        setDentists(dentistsData)
        
        // Auto-select if only one dentist
        if (dentistsData.length === 1) {
          setSelectedDoctors([dentistsData[0].name])
        }
        
        // Load treatment types
        setLoadingTreatmentTypes(true)
        const treatmentTypesData = await treatmentTypesApi.getAll(clinicId)
        setTreatmentTypes(treatmentTypesData)
        
      } catch (error) {
        console.error('❌ Error loading data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoadingDentists(false)
        setLoadingTreatmentTypes(false)
      }
    }
    
    loadData()
  }, [clinicId])

  // Handle doctor selection change
  const handleDoctorChange = (value: string) => {
    if (value === 'other') {
      setShowOtherDoctorInput(true)
      setOtherDoctorName('')
    } else {
      setShowOtherDoctorInput(false)
      setOtherDoctorName('')
      
      // Add doctor to selected doctors (avoid duplicates)
      if (!selectedDoctors.includes(value)) {
        setSelectedDoctors(prev => [...prev, value])
      }
    }
  }

  // Remove doctor from selection
  const removeDoctor = (doctorName: string) => {
    setSelectedDoctors(prev => prev.filter(doc => doc !== doctorName))
  }

  // Get final doctor names as comma-separated string
  const getFinalDoctorNames = () => {
    const allDoctors = [...selectedDoctors]
    
    // Add other doctor name if provided
    if (otherDoctorName.trim()) {
      allDoctors.push(otherDoctorName.trim())
    }
    
    return allDoctors.length > 0 ? allDoctors.join(', ') : 'Unknown Doctor'
  }

  // Get doctor options for dropdown
  const getDoctorOptions = () => {
    const options = dentists.map(d => ({ value: d.name, label: d.name }))
    options.push({ value: 'other', label: 'Other (specify name)' })
    return options
  }

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
        treatment_status: (initialData.treatment_status as 'Planned' | 'In Progress' | 'Completed' | 'Cancelled') || 'Planned',
        treatment_date: initialData.treatment_date || '',
        notes: initialData.notes || ''
      })
      
      // Set doctor if available in initial data
      if (initialData.created_by) {
        setSelectedDoctors(initialData.created_by ? initialData.created_by.split(', ') : [])
      }
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
        cost: parseFloat(formData.cost) || 0,
        notes: formData.notes || undefined,
        created_by: getFinalDoctorNames()
      }

      if (initialData?.id) {
        // Update existing treatment
        await dentalTreatmentApi.update(initialData.id, treatmentData)
        toast.success('Treatment updated successfully')
        onSuccess?.()
      } else {
        // Create new treatment
        const newTreatment = await dentalTreatmentApi.create(treatmentData)
        toast.success('Treatment added successfully')
        setCreatedTreatmentId(newTreatment.id)
        setShowPaymentManagement(true)
      }
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
    <div className="space-y-6">
      {!showPaymentManagement ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
              <Label htmlFor="tooth_number">Tooth Number *</Label>
              <Select 
                value={formData.tooth_number} 
                onValueChange={(value) => handleInputChange('tooth_number', value)}
              >
                <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                  <SelectValue placeholder="Select tooth" className="text-base truncate" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeeth.map((tooth) => (
                    <SelectItem key={tooth} value={tooth} className="text-sm">
                      {tooth} - {toothChartUtils.getToothName(tooth)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tooth_position">Position</Label>
              <Input
                id="tooth_position"
                value={formData.tooth_position}
                readOnly
                className="bg-gray-50 h-12 text-base"
              />
            </div>
          </div>

          {/* Treatment Type */}
          <div>
            <Label htmlFor="treatment_type">Treatment Type *</Label>
            <Select 
              value={formData.treatment_type} 
              onValueChange={(value) => handleInputChange('treatment_type', value)}
            >
              <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                <SelectValue placeholder="Select treatment type" className="text-base truncate" />
              </SelectTrigger>
              <SelectContent>
                {loadingTreatmentTypes ? (
                  <SelectItem value="loading" disabled>Loading treatment types...</SelectItem>
                ) : treatmentTypes.length === 0 ? (
                  <SelectItem value="no-data" disabled>No treatment types available</SelectItem>
                ) : (
                  treatmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name} className="text-sm">
                      {type.name} - ₹{type.default_cost.toLocaleString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Description */}
          <div>
            <Label htmlFor="treatment_description">Description</Label>
            <Textarea
              id="treatment_description"
              value={formData.treatment_description}
              onChange={(e) => handleInputChange('treatment_description', e.target.value)}
              placeholder="Describe the treatment details..."
              rows={3}
              className="text-base"
            />
          </div>

          {/* Doctor Selection */}
          {!loadingDentists ? (
            <div>
              <Label htmlFor="doctor">Doctor(s) *</Label>
              {dentists.length === 1 ? (
                // Single dentist - show as read-only
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{dentists[0].name}</span>
                </div>
              ) : dentists.length > 1 ? (
                // Multiple dentists - show dropdown and selected doctors
                <div className="space-y-3">
                  {/* Selected Doctors Display */}
                  {selectedDoctors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Doctors:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctors.map((doctor) => (
                          <div key={doctor} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            <User className="h-3 w-3" />
                            <span>{doctor}</span>
                            <button
                              type="button"
                              onClick={() => removeDoctor(doctor)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Doctor Selection Dropdown */}
                  <Select 
                    value="" 
                    onValueChange={handleDoctorChange}
                  >
                    <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                      <SelectValue placeholder="Add doctor" className="text-base truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDoctorOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Other doctor name input */}
                  {showOtherDoctorInput && (
                    <div className="mt-2 p-3 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Enter Custom Doctor Name:</p>
                      <Input
                        placeholder="Enter doctor name (e.g., Dr. Specialist Name)"
                        value={otherDoctorName}
                        onChange={(e) => setOtherDoctorName(e.target.value)}
                        className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {otherDoctorName.trim() && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedDoctors.includes(otherDoctorName.trim())) {
                                setSelectedDoctors(prev => [...prev, otherDoctorName.trim()])
                                setOtherDoctorName('')
                                setShowOtherDoctorInput(false)
                              }
                            }}
                            className="text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Add Doctor
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // No dentists configured - show other input
                <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Enter Doctor Name:</p>
                  <Input
                    placeholder="Enter doctor name (e.g., Dr. Specialist Name)"
                    value={otherDoctorName}
                    onChange={(e) => setOtherDoctorName(e.target.value)}
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          ) : (
            // Show loading state
            <div>
              <Label htmlFor="doctor">Doctor(s) *</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading dentists...</span>
              </div>
            </div>
          )}

          {/* Treatment Status and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="treatment_status">Status *</Label>
              <Select 
                value={formData.treatment_status} 
                onValueChange={(value) => handleInputChange('treatment_status', value)}
              >
                <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                  <SelectValue className="text-base truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned" className="text-sm">Planned</SelectItem>
                  <SelectItem value="In Progress" className="text-sm">In Progress</SelectItem>
                  <SelectItem value="Completed" className="text-sm">Completed</SelectItem>
                  <SelectItem value="Cancelled" className="text-sm">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="treatment_date">Treatment Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="treatment_date"
                  type="date"
                  value={formData.treatment_date}
                  onChange={(e) => handleInputChange('treatment_date', e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </div>



          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="pl-10 text-base"
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
            {initialData?.id && formData.treatment_status !== 'In Progress' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentManagement(true)}
                disabled={loading}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Manage Payments
              </Button>
            )}
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
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Management
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentManagement(false)
                    onSuccess?.()
                  }}
                >
                  Done
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
          
          {(createdTreatmentId || initialData?.id) && (
            <PaymentManagementSimple
              treatmentId={createdTreatmentId || initialData?.id!}
              clinicId={clinicId}
              patientId={patientId}
              treatmentType={formData.treatment_type}
              onPaymentUpdate={() => {
                // Refresh data if needed
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default DentalTreatmentForm
