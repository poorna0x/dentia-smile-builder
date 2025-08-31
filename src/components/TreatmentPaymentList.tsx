/**
 * Treatment Payment List Component
 * 
 * Shows a list of treatments and allows direct access to payment management.
 * This is the component that should be used when clicking "Payment" button.
 */

import React, { useState, useEffect } from 'react'
import { useClinic } from '@/contexts/ClinicContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, DollarSign, Calendar, User, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import PaymentManagementSimple from './PaymentManagementSimple'
import { getTreatmentCost } from '@/config/treatment-costs'

interface Treatment {
  id: string
  treatment_type: string
  treatment_description?: string
  treatment_status: string
  treatment_date?: string
  patient_id: string
  clinic_id: string
  created_at: string
  patient_name?: string
  patient_phone?: string
}

interface TreatmentPaymentListProps {
  onClose?: () => void
}

const TreatmentPaymentList: React.FC<TreatmentPaymentListProps> = ({ onClose }) => {
  const { clinic } = useClinic()
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Load treatments
  useEffect(() => {
    if (clinic?.id) {
      loadTreatments()
    }
  }, [clinic?.id])

  const loadTreatments = async () => {
    try {
      setLoading(true)
      
      // Get treatments with patient information
      const { data: treatmentsData, error } = await supabase
        .from('dental_treatments')
        .select(`
          *,
          patients:patient_id (
            name,
            phone
          )
        `)
        .eq('clinic_id', clinic?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading treatments:', error)
        toast.error('Failed to load treatments')
        return
      }

      // Transform data to include patient info
      const transformedTreatments = treatmentsData?.map(treatment => ({
        ...treatment,
        patient_name: treatment.patients?.name,
        patient_phone: treatment.patients?.phone
      })) || []

      setTreatments(transformedTreatments)
    } catch (error) {
      console.error('Error loading treatments:', error)
      toast.error('Failed to load treatments')
    } finally {
      setLoading(false)
    }
  }

  // Filter treatments
  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = 
      treatment.treatment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.patient_phone?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || treatment.treatment_status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleTreatmentClick = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setShowPaymentDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Planned': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading treatments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Treatment Payments</h2>
          <p className="text-gray-600">Manage payments for dental treatments</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search treatments, patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Treatments List */}
      <div className="space-y-3">
        {filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No treatments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTreatments.map((treatment) => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTreatmentClick(treatment)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{treatment.treatment_type}</h3>
                      <Badge className={getStatusColor(treatment.treatment_status)}>
                        {treatment.treatment_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{treatment.patient_name || 'Unknown Patient'}</span>
                      </div>
                      {treatment.treatment_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(treatment.treatment_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>₹{getTreatmentCost(treatment.treatment_type).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {treatment.treatment_description && (
                      <p className="text-sm text-gray-500 mt-2">{treatment.treatment_description}</p>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Management - {selectedTreatment?.treatment_type}
            </DialogTitle>
            <DialogDescription>
              Manage payment for {selectedTreatment?.patient_name}'s {selectedTreatment?.treatment_type} treatment
            </DialogDescription>
          </DialogHeader>
          
          {selectedTreatment && (
            <PaymentManagementSimple
              treatmentId={selectedTreatment.id}
              clinicId={selectedTreatment.clinic_id}
              patientId={selectedTreatment.patient_id}
              treatmentType={selectedTreatment.treatment_type}
              onPaymentUpdate={() => {
                // Refresh treatments list
                loadTreatments()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TreatmentPaymentList
