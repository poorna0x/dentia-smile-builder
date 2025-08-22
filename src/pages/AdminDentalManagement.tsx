import React, { useState, useEffect } from 'react'
import { useClinic } from '@/contexts/ClinicContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Circle, 
  Plus, 
  Search, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Trash2
} from 'lucide-react'
import { patientApi } from '@/lib/patient-management'
import { 
  dentalTreatmentApi, 
  toothConditionApi, 
  toothChartUtils 
} from '@/lib/dental-treatments'
import { supabase } from '@/lib/supabase'

interface Patient {
  id: string
  first_name: string
  last_name?: string
  phone: string
  email?: string
}

const AdminDentalManagement = () => {
  const { clinic } = useClinic()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTreatmentForm, setShowTreatmentForm] = useState(false)
  const [showConditionForm, setShowConditionForm] = useState(false)
  
  // Treatment and condition data
  const [treatments, setTreatments] = useState<any[]>([])
  const [conditions, setConditions] = useState<any[]>([])
  const [loadingDentalData, setLoadingDentalData] = useState(false)
  
  // Form states
  const [treatmentForm, setTreatmentForm] = useState({
    tooth_number: '',
    tooth_position: '',
    treatment_type: '',
    custom_treatment_type: '',
    treatment_description: '',
    treatment_status: 'Completed',
    treatment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  const [conditionForm, setConditionForm] = useState({
    tooth_number: '',
    tooth_position: '',
    condition_type: '',
    condition_description: '',
    severity: 'Mild',
    notes: ''
  })

  // Load patients
  useEffect(() => {
    if (clinic?.id) {
      loadPatients()
    }
  }, [clinic?.id])

  const loadPatients = async () => {
    try {
      const patientsData = await patientApi.getAll(clinic!.id)
      setPatients(patientsData)
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Failed to load patients')
    }
  }

  // Load dental data for selected patient
  const loadDentalData = async (patientId: string) => {
    if (!clinic?.id) return
    
    setLoadingDentalData(true)
    try {
      const [treatmentsData, conditionsData] = await Promise.all([
        dentalTreatmentApi.getAllByPatient(clinic.id, patientId),
        toothConditionApi.getAllByPatient(clinic.id, patientId)
      ])
      
      setTreatments(treatmentsData)
      setConditions(conditionsData)
    } catch (error) {
      console.error('Error loading dental data:', error)
      toast.error('Failed to load dental data')
    } finally {
      setLoadingDentalData(false)
    }
  }

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    loadDentalData(patient.id)
  }

  // Handle add treatment
  const handleAddTreatment = async () => {
    if (!selectedPatient || !clinic?.id) return
    
    try {
      await dentalTreatmentApi.create({
        clinic_id: clinic.id,
        patient_id: selectedPatient.id,
        tooth_number: treatmentForm.tooth_number,
        tooth_position: treatmentForm.tooth_position,
        treatment_type: treatmentForm.treatment_type === 'Other' ? treatmentForm.custom_treatment_type : treatmentForm.treatment_type,
        treatment_description: treatmentForm.treatment_description,
        treatment_status: treatmentForm.treatment_status,
        treatment_date: treatmentForm.treatment_date,
        notes: treatmentForm.notes
      })
      
      // Reset form and close dialog
      setTreatmentForm({
        tooth_number: '',
        tooth_position: '',
        treatment_type: '',
        custom_treatment_type: '',
        treatment_description: '',
        treatment_status: 'Completed',
        treatment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowTreatmentForm(false)
      
      // Reload data
      await loadDentalData(selectedPatient.id)
      toast.success('Treatment added successfully')
    } catch (error) {
      console.error('Error adding treatment:', error)
      toast.error('Failed to add treatment')
    }
  }

  // Handle add condition
  const handleAddCondition = async () => {
    if (!selectedPatient || !clinic?.id) return
    
    try {
      await toothConditionApi.upsert({
        clinic_id: clinic.id,
        patient_id: selectedPatient.id,
        tooth_number: conditionForm.tooth_number,
        tooth_position: conditionForm.tooth_position,
        condition_type: conditionForm.condition_type,
        condition_description: conditionForm.condition_description,
        severity: conditionForm.severity,
        notes: conditionForm.notes
      })
      
      // Reset form and close dialog
      setConditionForm({
        tooth_number: '',
        tooth_position: '',
        condition_type: '',
        condition_description: '',
        severity: 'Mild',
        notes: ''
      })
      setShowConditionForm(false)
      
      // Reload data
      await loadDentalData(selectedPatient.id)
      toast.success('Condition updated successfully')
    } catch (error) {
      console.error('Error adding condition:', error)
      toast.error('Failed to update condition')
    }
  }

  const filteredPatients = patients.filter(patient => 
    patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Circle className="h-8 w-8" />
          Dental Management
        </h1>
        <Button onClick={() => window.history.back()}>
          Back to Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Search Patients</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedPatient?.id === patient.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="font-semibold">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.phone}
                  </div>
                  {patient.email && (
                    <div className="text-sm text-gray-500">
                      {patient.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dental Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5" />
              {selectedPatient ? `Dental Records - ${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Select a patient to view dental records'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPatient ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4" />
                <p>Please select a patient to view and manage their dental records</p>
              </div>
            ) : (
              <Tabs defaultValue="treatments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="treatments">Treatments</TabsTrigger>
                  <TabsTrigger value="conditions">Conditions</TabsTrigger>
                </TabsList>

                <TabsContent value="treatments" className="space-y-4">
                                                    <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Dental Treatments</h3>
                    <Button onClick={() => setShowTreatmentForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Treatment
                    </Button>
                  </div>

                  {loadingDentalData ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading treatments...</p>
                    </div>
                  ) : treatments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <p>No treatments recorded for this patient</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {treatments.map((treatment) => (
                        <div key={treatment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{treatment.treatment_type}</h4>
                              <p className="text-sm text-gray-600">Tooth {treatment.tooth_number} ({treatment.tooth_position})</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(treatment.treatment_date).toLocaleDateString()}
                              </p>
                              {treatment.treatment_description && (
                                <p className="text-sm text-gray-700 mt-2">{treatment.treatment_description}</p>
                              )}
                              {treatment.notes && (
                                <p className="text-sm text-gray-600 mt-1 italic">"{treatment.notes}"</p>
                              )}
                            </div>
                            <Badge variant={treatment.treatment_status === 'Completed' ? 'default' : 'secondary'}>
                              {treatment.treatment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conditions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Tooth Conditions</h3>
                    <Button onClick={() => setShowConditionForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>

                  {loadingDentalData ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading conditions...</p>
                    </div>
                  ) : conditions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Circle className="w-12 h-12 mx-auto mb-4" />
                      <p>No conditions recorded for this patient</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conditions.map((condition) => (
                        <div key={condition.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{condition.condition_type}</h4>
                              <p className="text-sm text-gray-600">Tooth {condition.tooth_number} ({condition.tooth_position})</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Severity: {condition.severity}
                              </p>
                              {condition.condition_description && (
                                <p className="text-sm text-gray-700 mt-2">{condition.condition_description}</p>
                              )}
                              {condition.notes && (
                                <p className="text-sm text-gray-600 mt-1 italic">"{condition.notes}"</p>
                              )}
                            </div>
                            <Badge variant={condition.severity === 'Severe' ? 'destructive' : condition.severity === 'Moderate' ? 'secondary' : 'default'}>
                              {condition.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Treatment Form Dialog */}
      <Dialog open={showTreatmentForm} onOpenChange={setShowTreatmentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Treatment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tooth_number">Tooth Number (1-32)</Label>
                <Input
                  id="tooth_number"
                  type="number"
                  min="1"
                  max="32"
                  value={treatmentForm.tooth_number}
                  onChange={(e) => setTreatmentForm({...treatmentForm, tooth_number: e.target.value})}
                  placeholder="e.g., 14"
                />
              </div>
              <div>
                <Label htmlFor="tooth_position">Tooth Position</Label>
                <Select value={treatmentForm.tooth_position} onValueChange={(value) => setTreatmentForm({...treatmentForm, tooth_position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upper Right">Upper Right</SelectItem>
                    <SelectItem value="Upper Left">Upper Left</SelectItem>
                    <SelectItem value="Lower Right">Lower Right</SelectItem>
                    <SelectItem value="Lower Left">Lower Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="treatment_type">Treatment Type</Label>
              <Select value={treatmentForm.treatment_type} onValueChange={(value) => setTreatmentForm({...treatmentForm, treatment_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  {toothChartUtils.getTreatmentTypes().map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {treatmentForm.treatment_type === 'Other' && (
              <div>
                <Label htmlFor="custom_treatment_type">Custom Treatment Type</Label>
                <Input
                  id="custom_treatment_type"
                  value={treatmentForm.custom_treatment_type}
                  onChange={(e) => setTreatmentForm({...treatmentForm, custom_treatment_type: e.target.value})}
                  placeholder="Enter custom treatment type"
                />
              </div>
            )}

            <div>
              <Label htmlFor="treatment_description">Treatment Description</Label>
              <Textarea
                id="treatment_description"
                value={treatmentForm.treatment_description}
                onChange={(e) => setTreatmentForm({...treatmentForm, treatment_description: e.target.value})}
                placeholder="Describe the treatment performed..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="treatment_status">Treatment Status</Label>
                <Select value={treatmentForm.treatment_status} onValueChange={(value) => setTreatmentForm({...treatmentForm, treatment_status: value})}>
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
              <div>
                <Label htmlFor="treatment_date">Treatment Date</Label>
                <Input
                  id="treatment_date"
                  type="date"
                  value={treatmentForm.treatment_date}
                  onChange={(e) => setTreatmentForm({...treatmentForm, treatment_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={treatmentForm.notes}
                onChange={(e) => setTreatmentForm({...treatmentForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTreatmentForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTreatment}>
                Add Treatment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Condition Form Dialog */}
      <Dialog open={showConditionForm} onOpenChange={setShowConditionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add/Update Tooth Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition_tooth_number">Tooth Number (1-32)</Label>
                <Input
                  id="condition_tooth_number"
                  type="number"
                  min="1"
                  max="32"
                  value={conditionForm.tooth_number}
                  onChange={(e) => setConditionForm({...conditionForm, tooth_number: e.target.value})}
                  placeholder="e.g., 14"
                />
              </div>
              <div>
                <Label htmlFor="condition_tooth_position">Tooth Position</Label>
                <Select value={conditionForm.tooth_position} onValueChange={(value) => setConditionForm({...conditionForm, tooth_position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upper Right">Upper Right</SelectItem>
                    <SelectItem value="Upper Left">Upper Left</SelectItem>
                    <SelectItem value="Lower Right">Lower Right</SelectItem>
                    <SelectItem value="Lower Left">Lower Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="condition_type">Condition Type</Label>
              <Select value={conditionForm.condition_type} onValueChange={(value) => setConditionForm({...conditionForm, condition_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  {toothChartUtils.getConditionTypes().map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition_description">Condition Description</Label>
              <Textarea
                id="condition_description"
                value={conditionForm.condition_description}
                onChange={(e) => setConditionForm({...conditionForm, condition_description: e.target.value})}
                placeholder="Describe the condition..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={conditionForm.severity} onValueChange={(value) => setConditionForm({...conditionForm, severity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition_notes">Notes</Label>
              <Textarea
                id="condition_notes"
                value={conditionForm.notes}
                onChange={(e) => setConditionForm({...conditionForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConditionForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCondition}>
                Update Condition
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDentalManagement
