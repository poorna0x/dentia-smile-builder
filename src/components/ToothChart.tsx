import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Circle, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  CreditCard
} from 'lucide-react'
import { 
  DentalTreatment, 
  ToothCondition, 
  toothChartUtils,
  dentalTreatmentApi,
  toothConditionApi
} from '@/lib/dental-treatments'
import DentalTreatmentForm from './DentalTreatmentForm'
import PaymentManagementSimple from './PaymentManagementSimple'
import PaymentTreatmentSelector from './PaymentTreatmentSelector'
import EnhancedPaymentManagement from './EnhancedPaymentManagement'

interface ToothChartProps {
  patientId: string
  clinicId: string
  onTreatmentAdded?: () => void
  onConditionUpdated?: () => void
}

interface ToothData {
  number: string
  position: string
  name: string
  condition?: any
  treatments: any[]
  isSelected: boolean
}

const ToothChart: React.FC<ToothChartProps> = ({ 
  patientId, 
  clinicId, 
  onTreatmentAdded, 
  onConditionUpdated 
}) => {
  const [teeth, setTeeth] = useState<ToothData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null)
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false)
  const [showConditionDialog, setShowConditionDialog] = useState(false)
  const [showAddTreatmentDialog, setShowAddTreatmentDialog] = useState(false)
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false)
  const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<DentalTreatment | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [treatmentToDelete, setTreatmentToDelete] = useState<DentalTreatment | null>(null)
  const [selectedPaymentTreatment, setSelectedPaymentTreatment] = useState<DentalTreatment | null>(null)
  
  // Treatment form state
  const [treatmentForm, setTreatmentForm] = useState({
    treatment_type: '',
    custom_treatment_type: '',
    treatment_description: '',
    treatment_status: 'Completed' as const,
    treatment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Condition form state
  const [conditionForm, setConditionForm] = useState({
    condition_type: '',
    condition_description: '',
    severity: 'Mild' as const,
    notes: ''
  })

  // Load tooth data
  useEffect(() => {
    loadToothData()
  }, [patientId, clinicId])

  const loadToothData = async () => {
    setLoading(true)
    try {
      // Get all teeth (1-32)
      const allTeeth = []
      for (let i = 1; i <= 32; i++) {
        allTeeth.push(i.toString().padStart(2, '0'))
      }
      
      // Load real data from database
      const [treatments, conditions] = await Promise.all([
        dentalTreatmentApi.getByPatient(patientId, clinicId),
        toothConditionApi.getByPatient(patientId, clinicId)
      ])
      
      // Create tooth data with real data
      const teethData: ToothData[] = allTeeth.map(toothNumber => {
        const num = parseInt(toothNumber)
        let position = 'Unknown'
        if (num >= 1 && num <= 8) position = 'Upper Right'
        else if (num >= 9 && num <= 16) position = 'Upper Left'
        else if (num >= 17 && num <= 24) position = 'Lower Left'
        else if (num >= 25 && num <= 32) position = 'Lower Right'
        
        const positions = ['Central Incisor', 'Lateral Incisor', 'Canine', 'First Premolar', 'Second Premolar', 'First Molar', 'Second Molar', 'Third Molar']
        const positionName = positions[(num - 1) % 8]
        const quadrant = Math.ceil(num / 8)
        const name = `${positionName} (Quadrant ${quadrant})`

        // Get treatments and condition for this tooth
        const toothTreatments = treatments.filter(t => t.tooth_number === toothNumber)
        const toothCondition = conditions.find(c => c.tooth_number === toothNumber)

        return {
          number: toothNumber,
          position,
          name,
          condition: toothCondition || null,
          treatments: toothTreatments,
          isSelected: false
        }
      })

      setTeeth(teethData)
    } catch (error) {
      console.error('Error loading tooth data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get color for tooth based on condition
  const getToothColor = (tooth: ToothData): string => {
    if (!tooth.condition) return 'bg-gray-100 hover:bg-gray-200'
    
    const conditionType = tooth.condition.condition_type.toLowerCase()
    
    // Common conditions
    if (conditionType.includes('healthy')) return 'bg-green-100 hover:bg-green-200'
    if (conditionType.includes('cavity') || conditionType.includes('decay')) return 'bg-red-100 hover:bg-red-200'
    if (conditionType.includes('filled')) return 'bg-blue-100 hover:bg-blue-200'
    if (conditionType.includes('crown')) return 'bg-purple-100 hover:bg-purple-200'
    if (conditionType.includes('missing')) return 'bg-gray-300 hover:bg-gray-400'
    if (conditionType.includes('sensitive')) return 'bg-yellow-100 hover:bg-yellow-200'
    if (conditionType.includes('chipped') || conditionType.includes('cracked')) return 'bg-orange-100 hover:bg-orange-200'
    
    // Orthodontic conditions
    if (conditionType.includes('braces on')) return 'bg-emerald-100 hover:bg-emerald-200'
    if (conditionType.includes('braces off')) return 'bg-emerald-50 hover:bg-emerald-100'
    if (conditionType.includes('retainer on')) return 'bg-teal-100 hover:bg-teal-200'
    if (conditionType.includes('retainer off')) return 'bg-teal-50 hover:bg-teal-100'
    if (conditionType.includes('aligner on')) return 'bg-indigo-100 hover:bg-indigo-200'
    if (conditionType.includes('aligner off')) return 'bg-indigo-50 hover:bg-indigo-100'
    if (conditionType.includes('orthodontic treatment')) return 'bg-cyan-100 hover:bg-cyan-200'
    
    return 'bg-gray-100 hover:bg-gray-200'
  }

  // Get treatment status color
  const getTreatmentStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return 'bg-green-500'
      case 'In Progress': return 'bg-blue-500'
      case 'Planned': return 'bg-yellow-500'
      case 'Cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Handle tooth click
  const handleToothClick = (tooth: ToothData) => {
    setSelectedTooth(tooth)
    setSelectedPaymentTreatment(null) // Reset payment treatment selection
    setShowTreatmentDialog(true)
  }

  // Handle add treatment
  const handleAddTreatment = async () => {
    if (!selectedTooth) return
    
    try {
      await dentalTreatmentApi.create({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        tooth_position: selectedTooth.position,
        treatment_type: treatmentForm.treatment_type === 'Other' ? treatmentForm.custom_treatment_type : treatmentForm.treatment_type,
        treatment_description: treatmentForm.treatment_description,
        treatment_status: treatmentForm.treatment_status,
        treatment_date: treatmentForm.treatment_date,
        notes: treatmentForm.notes
      })
      
      // Reset form and close dialog
      setTreatmentForm({
        treatment_type: '',
        custom_treatment_type: '',
        treatment_description: '',
        treatment_status: 'Completed',
        treatment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowAddTreatmentDialog(false)
      
      // Reload data
      await loadToothData()
      onTreatmentAdded?.()
    } catch (error) {
      console.error('Error adding treatment:', error)
    }
  }

  // Handle add condition
  const handleAddCondition = async () => {
    if (!selectedTooth) return
    
    try {
      await toothConditionApi.upsert({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        tooth_position: selectedTooth.position,
        condition_type: conditionForm.condition_type,
        condition_description: conditionForm.condition_description,
        severity: conditionForm.severity,
        notes: conditionForm.notes
      })
      
      // Reset form and close dialog
      setConditionForm({
        condition_type: '',
        condition_description: '',
        severity: 'Mild',
        notes: ''
      })
      setShowAddConditionDialog(false)
      
      // Reload data
      await loadToothData()
      onConditionUpdated?.()
    } catch (error) {
      console.error('Error adding condition:', error)
    }
  }

  // Handle edit treatment
  const handleEditTreatment = (treatment: DentalTreatment) => {
    setEditingTreatment(treatment)
    setShowEditTreatmentDialog(true)
  }

  const handleDeleteTreatment = (treatment: DentalTreatment) => {
    setTreatmentToDelete(treatment)
    setShowDeleteConfirmDialog(true)
  }

  const confirmDeleteTreatment = async () => {
    if (!treatmentToDelete) return
    
    try {
      await dentalTreatmentApi.delete(treatmentToDelete.id)
      setShowDeleteConfirmDialog(false)
      setTreatmentToDelete(null)
      loadToothData() // Reload data
      if (onTreatmentAdded) {
        onTreatmentAdded()
      }
    } catch (error) {
      console.error('Error deleting treatment:', error)
      // You can add toast notification here
    }
  }

  // Handle treatment updated
  const handleTreatmentUpdated = async () => {
    setShowEditTreatmentDialog(false)
    setEditingTreatment(null)
    await loadToothData()
    onTreatmentAdded?.()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Dental Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading dental chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-5 w-5" />
          Dental Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Human Teeth Formation Chart with Universal Numbering */}
        <div className="flex flex-col items-center space-y-4">
          {/* Upper Jaw */}
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Upper Jaw (Maxilla) - Universal Numbers 1-16</h3>
            <div className="flex items-center justify-center flex-wrap gap-1">
              {/* Upper Right Quadrant (1-8) */}
              {teeth.slice(0, 8).reverse().map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-t-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Upper Left Quadrant (9-16) */}
              {teeth.slice(8, 16).map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-t-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Lower Jaw */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lower Jaw (Mandible) - Universal Numbers 17-32</h3>
            <div className="flex items-center justify-center flex-wrap gap-1">
              {/* Lower Right Quadrant (25-32) */}
              {teeth.slice(24, 32).reverse().map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-b-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Lower Left Quadrant (17-24) */}
              {teeth.slice(16, 24).map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-b-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Center Line Indicator */}
          <div className="text-xs text-gray-500 mt-2">
            <div className="flex items-center justify-center space-x-8">
              <span>Patient's Right</span>
              <div className="w-8 h-px bg-gray-300"></div>
              <span>Patient's Left</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm sm:text-base">Universal Numbering System (1-32)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">1-8</div>
              <span>Upper Right</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">9-16</div>
              <span>Upper Left</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">17-24</div>
              <span>Lower Left</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">25-32</div>
              <span>Lower Right</span>
            </div>
          </div>
          
          <h5 className="font-semibold mb-2 text-sm sm:text-base">Tooth Condition Legend</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Cavity/Decay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Crown</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Missing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Sensitive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Chipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>No Data</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold mb-2 text-sm sm:text-base">Instructions</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Click any tooth</strong> to view its details and treatment history</li>
              <li>• <strong>Numbers 1-32</strong> follow the Universal Numbering System</li>
              <li>• <strong>Colors</strong> indicate the current condition of each tooth</li>
              <li>• <strong>Blue numbers</strong> show how many treatments have been performed</li>
            </ul>
          </div>
        </div>

        {/* Tooth Details Dialog */}
        {selectedTooth && (
          <Dialog open={showTreatmentDialog} onOpenChange={(open) => {
            setShowTreatmentDialog(open)
            if (!open) {
              setSelectedPaymentTreatment(null) // Reset when dialog closes
            }
          }}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] h-[80vh] rounded-2xl border-2 overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Circle className="h-5 w-5" />
                  Tooth {selectedTooth.number} - {selectedTooth.name}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="treatments" className="w-full h-full flex flex-col min-h-0" style={{ height: 'calc(100% - 60px)' }}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 text-xs sm:text-sm flex-shrink-0 mb-6 bg-transparent">
                  <TabsTrigger value="treatments" className="text-xs sm:text-sm">Treatments</TabsTrigger>
                  <TabsTrigger value="condition" className="text-xs sm:text-sm">Condition</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs sm:text-sm">Payments</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="treatments" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold">Treatment History</h3>
                      <Button size="sm" onClick={() => setShowAddTreatmentDialog(true)} className="w-full sm:w-auto min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Treatment
                      </Button>
                    </div>

                  {selectedTooth.treatments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
                      <Circle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No treatments recorded</p>
                      <p className="text-sm">for this tooth</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTooth.treatments.map((treatment) => (
                        <Card key={treatment.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base">{treatment.treatment_type}</h4>
                                {treatment.treatment_description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{treatment.treatment_description}</p>
                                )}
                                {treatment.treatment_date && (
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-2">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    {new Date(treatment.treatment_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={`text-xs ${getTreatmentStatusColor(treatment.treatment_status)}`}>
                                  {treatment.treatment_status}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {(treatment.treatment_status === 'In Progress' || treatment.treatment_status === 'Planned') && (
                                                                      <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditTreatment(treatment)}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    title="Edit Treatment"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteTreatment(treatment)}
                                    className="h-8 w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Treatment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  </div>
                </TabsContent>

                <TabsContent value="condition" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Current Condition</h3>
                      <Button size="sm" onClick={() => setShowAddConditionDialog(true)} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Condition
                      </Button>
                    </div>

                  {selectedTooth.condition ? (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="font-semibold text-gray-600">Condition:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.condition_type}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600">Severity:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.severity}</p>
                            </div>
                          </div>
                          {selectedTooth.condition.condition_description && (
                            <div>
                              <span className="font-semibold text-gray-600">Description:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.condition_description}</p>
                            </div>
                          )}
                          {selectedTooth.condition.notes && (
                            <div>
                              <span className="font-semibold text-gray-600">Notes:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.notes}</p>
                            </div>
                          )}
                          <div className="text-xs sm:text-sm text-gray-500 pt-2 border-t">
                            Last updated: {new Date(selectedTooth.condition.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
                      <Circle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No condition recorded</p>
                      <p className="text-sm">for this tooth</p>
                    </div>
                  )}
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  {selectedPaymentTreatment ? (
                    <EnhancedPaymentManagement
                      treatment={selectedPaymentTreatment}
                      treatments={selectedTooth.treatments}
                      clinicId={clinicId}
                      patientId={patientId}
                      onBack={() => setSelectedPaymentTreatment(null)}
                      onTreatmentChange={(newTreatment) => setSelectedPaymentTreatment(newTreatment)}
                      onPaymentUpdate={() => {
                        // Refresh data if needed
                      }}
                    />
                  ) : (
                    <div>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Payment Management</h3>
                      </div>
                      <PaymentTreatmentSelector
                        treatments={selectedTooth.treatments}
                        onSelectTreatment={setSelectedPaymentTreatment}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold">Tooth Information</h3>
                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-600">Number:</span>
                              <span className="font-medium">{selectedTooth.number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-600">Position:</span>
                              <span className="font-medium">{selectedTooth.position}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-600">Total Treatments:</span>
                              <span className="font-medium">{selectedTooth.treatments.length}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-600">Name:</span>
                              <span className="font-medium text-right">{selectedTooth.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-600">Current Condition:</span>
                              <span className="font-medium text-right">{selectedTooth.condition?.condition_type || 'Not recorded'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional spacing to match other tabs */}
                        <div className="pt-8">
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="font-medium text-gray-700 mb-3">Tooth Summary</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{selectedTooth.number}</div>
                                <div className="text-xs text-gray-600">Tooth Number</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">{selectedTooth.treatments.length}</div>
                                <div className="text-xs text-gray-600">Total Treatments</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">{selectedTooth.condition ? 'Yes' : 'No'}</div>
                                <div className="text-xs text-gray-600">Has Condition</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Treatment Dialog */}
        <Dialog open={showAddTreatmentDialog} onOpenChange={setShowAddTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Add Treatment - Tooth {selectedTooth?.number}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="treatment_type">Treatment Type *</Label>
                  <Select value={treatmentForm.treatment_type} onValueChange={(value) => setTreatmentForm(prev => ({ ...prev, treatment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Common treatments first */}
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Filling">Filling</SelectItem>
                      <SelectItem value="Root Canal">Root Canal</SelectItem>
                      <SelectItem value="Extraction">Extraction</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Implant">Implant</SelectItem>
                      
                      {/* Orthodontic treatments */}
                      <SelectItem value="Braces Installation">Braces Installation</SelectItem>
                      <SelectItem value="Braces Adjustment">Braces Adjustment</SelectItem>
                      <SelectItem value="Braces Removal">Braces Removal</SelectItem>
                      <SelectItem value="Retainer Fitting">Retainer Fitting</SelectItem>
                      <SelectItem value="Retainer Adjustment">Retainer Adjustment</SelectItem>
                      <SelectItem value="Clear Aligners">Clear Aligners</SelectItem>
                      
                      {/* Preventive treatments */}
                      <SelectItem value="Whitening">Whitening</SelectItem>
                      <SelectItem value="Sealant">Sealant</SelectItem>
                      <SelectItem value="Fluoride Treatment">Fluoride Treatment</SelectItem>
                      <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="Scaling">Scaling</SelectItem>
                      
                      {/* Restorative treatments */}
                      <SelectItem value="Veneer">Veneer</SelectItem>
                      <SelectItem value="Inlay">Inlay</SelectItem>
                      <SelectItem value="Onlay">Onlay</SelectItem>
                      <SelectItem value="Denture">Denture</SelectItem>
                      <SelectItem value="Partial Denture">Partial Denture</SelectItem>
                      
                      {/* Diagnostic and other */}
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Emergency Treatment">Emergency Treatment</SelectItem>
                      <SelectItem value="Pain Management">Pain Management</SelectItem>
                      <SelectItem value="Gum Treatment">Gum Treatment</SelectItem>
                      <SelectItem value="Oral Surgery">Oral Surgery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="treatment_status">Status *</Label>
                  <Select value={treatmentForm.treatment_status} onValueChange={(value: any) => setTreatmentForm(prev => ({ ...prev, treatment_status: value }))}>
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
              </div>

              {/* Custom treatment type input */}
              {treatmentForm.treatment_type === 'Other' && (
                <div>
                  <Label htmlFor="custom_treatment_type">Custom Treatment Type *</Label>
                  <Input
                    id="custom_treatment_type"
                    placeholder="Enter custom treatment type..."
                    value={treatmentForm.custom_treatment_type}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, custom_treatment_type: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="treatment_date">Treatment Date *</Label>
                <Input
                  id="treatment_date"
                  type="date"
                  value={treatmentForm.treatment_date}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="treatment_description">Description</Label>
                <Textarea
                  id="treatment_description"
                  placeholder="Describe the treatment performed..."
                  value={treatmentForm.treatment_description}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddTreatmentDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleAddTreatment} 
                disabled={
                  !treatmentForm.treatment_type || 
                  (treatmentForm.treatment_type === 'Other' && !treatmentForm.custom_treatment_type.trim())
                }
                className="w-full sm:w-auto"
              >
                Add Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Condition Dialog */}
        <Dialog open={showAddConditionDialog} onOpenChange={setShowAddConditionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Update Condition - Tooth {selectedTooth?.number}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition_type">Condition Type *</Label>
                  <Select value={conditionForm.condition_type} onValueChange={(value) => setConditionForm(prev => ({ ...prev, condition_type: value }))}>
                    <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                      <SelectValue placeholder="Select condition type" className="text-base truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Common conditions first */}
                      <SelectItem value="Healthy">Healthy</SelectItem>
                      <SelectItem value="Cavity">Cavity</SelectItem>
                      <SelectItem value="Filled">Filled</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                      <SelectItem value="Sensitive">Sensitive</SelectItem>
                      <SelectItem value="Chipped">Chipped</SelectItem>
                      <SelectItem value="Cracked">Cracked</SelectItem>
                      
                      {/* Orthodontic conditions */}
                      <SelectItem value="Braces On">Braces On</SelectItem>
                      <SelectItem value="Braces Off">Braces Off</SelectItem>
                      <SelectItem value="Retainer On">Retainer On</SelectItem>
                      <SelectItem value="Retainer Off">Retainer Off</SelectItem>
                      <SelectItem value="Aligner On">Aligner On</SelectItem>
                      <SelectItem value="Aligner Off">Aligner Off</SelectItem>
                      
                      {/* Serious conditions */}
                      <SelectItem value="Infected">Infected</SelectItem>
                      <SelectItem value="Decay">Decay</SelectItem>
                      <SelectItem value="Abscess">Abscess</SelectItem>
                      <SelectItem value="Root Canal Treated">Root Canal Treated</SelectItem>
                      
                      {/* Restorative conditions */}
                      <SelectItem value="Veneer">Veneer</SelectItem>
                      <SelectItem value="Implant">Implant</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Denture">Denture</SelectItem>
                      
                      {/* Other conditions */}
                      <SelectItem value="Gum Disease">Gum Disease</SelectItem>
                      <SelectItem value="Stained">Stained</SelectItem>
                      <SelectItem value="Worn">Worn</SelectItem>
                      <SelectItem value="Erupting">Erupting</SelectItem>
                      <SelectItem value="Impacted">Impacted</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={conditionForm.severity} onValueChange={(value: any) => setConditionForm(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                      <SelectValue className="text-base truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mild">Mild</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="condition_description">Description</Label>
                <Textarea
                  id="condition_description"
                  placeholder="Describe the condition..."
                  value={conditionForm.condition_description}
                  onChange={(e) => setConditionForm(prev => ({ ...prev, condition_description: e.target.value }))}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="condition_notes">Notes</Label>
                <Textarea
                  id="condition_notes"
                  placeholder="Additional notes..."
                  value={conditionForm.notes}
                  onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddConditionDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddCondition} disabled={!conditionForm.condition_type} className="w-full sm:w-auto">
                Update Condition
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Treatment Dialog */}
        <Dialog open={showEditTreatmentDialog} onOpenChange={setShowEditTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Edit Treatment - Tooth {selectedTooth?.number}</DialogTitle>
            </DialogHeader>
            
            {editingTreatment && (
              <DentalTreatmentForm
                patientId={patientId}
                clinicId={clinicId}
                selectedTooth={selectedTooth?.number}
                initialData={editingTreatment}
                onSuccess={handleTreatmentUpdated}
                onCancel={() => setShowEditTreatmentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Treatment Confirmation Dialog */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Treatment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this treatment? This action cannot be undone.
              </p>
              
              {treatmentToDelete && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{treatmentToDelete.treatment_type}</p>
                  <p className="text-sm text-gray-600">Tooth {treatmentToDelete.tooth_number}</p>
                  <p className="text-sm text-gray-500">
                    {treatmentToDelete.treatment_date && new Date(treatmentToDelete.treatment_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTreatment}>
                Delete Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ToothChart
