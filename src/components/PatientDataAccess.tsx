/**
 * Enhanced Patient Data Access Component
 * 
 * Features:
 * - Phone number validation with math captcha
 * - Multiple patient selection (mobile responsive)
 * - Conditional data display (only show if exists)
 * - Mobile responsive button layout
 * - Enhanced dental chart view with 32 teeth
 * - Lab work status and expected dates
 * - Prescription viewing with detailed dialog
 */

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/lib/patient-management';
import { patientUtils } from '@/lib/patient-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, 
  Search, 
  Calendar, 
  Stethoscope, 
  FileText, 
  User, 
  Pill,
  MessageSquare,
  Clock,
  MapPin,
  Circle,
  AlertCircle,
  Activity,
  Eye,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp Icon SVG
const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

// Math Captcha Component
const MathCaptcha = ({ onVerify }: { onVerify: (success: boolean) => void }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    generateNewProblem();
  }, []);

  const generateNewProblem = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setError('');
  };

  const handleSubmit = () => {
    const correctAnswer = num1 + num2;
    if (parseInt(userAnswer) === correctAnswer) {
      onVerify(true);
    } else {
      setError('Incorrect answer. Please try again.');
      generateNewProblem();
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-4 h-4" />
          Security Verification
        </CardTitle>
        <CardDescription className="text-orange-700">
          Please solve this simple math problem to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-800 mb-2">
            {num1} + {num2} = ?
          </div>
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="max-w-xs mx-auto border-2 border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
            Verify
          </Button>
          <Button onClick={generateNewProblem} variant="outline">
            New Problem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Multiple Patient Selection Component
const PatientSelection = ({ 
  patients, 
  onSelect, 
  onCancel 
}: { 
  patients: any[], 
  onSelect: (patient: any) => void, 
  onCancel: () => void 
}) => {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Patient
          </DialogTitle>
          <DialogDescription>
            Multiple patients found with this phone number. Please select the correct one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Multiple patients found with this phone number. Please select the correct one:
          </p>
          {patients.map((patient, index) => (
            <Card 
              key={patient.patient_id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onSelect(patient)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {patient.patient_id.slice(0, 8)}...
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={onCancel} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Prescriptions Detail Component
const PrescriptionsDetail = ({ 
  prescriptions, 
  onClose 
}: { 
  prescriptions: any[], 
  onClose: () => void 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPrescriptionStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Discontinued': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Prescriptions - {prescriptions.length} found
          </DialogTitle>
          <DialogDescription>
            View all prescriptions and medications for this patient.
          </DialogDescription>
        </DialogHeader>
        
        {prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prescriptions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-l-4 border-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {prescription.medication_name || 'Prescription'}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Dosage: {prescription.dosage}</span>
                        <span>Frequency: {prescription.frequency}</span>
                        <span>Duration: {prescription.duration}</span>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getPrescriptionStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </Badge>
                  </div>
                  
                  {prescription.instructions && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Instructions:</p>
                      <p className="text-sm text-blue-700">{prescription.instructions}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <p><strong>Prescribed by:</strong> {prescription.prescribed_by || 'Dentist'}</p>
                      <p><strong>Prescribed date:</strong> {formatDate(prescription.prescribed_date)}</p>
                    </div>
                    <div>
                      {prescription.refills_remaining > 0 && (
                        <p><strong>Refills remaining:</strong> {prescription.refills_remaining}</p>
                      )}
                      {prescription.notes && (
                        <p><strong>Notes:</strong> {prescription.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Detailed Dental Chart Component with 32 Teeth
const DetailedDentalChart = ({ 
  patient, 
  onClose 
}: { 
  patient: Patient, 
  onClose: () => void 
}) => {
  const [dentalData, setDentalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const { clinic } = useClinic();

  // Define all 32 teeth with their positions and user-friendly names
  const teeth = [
    // Upper right (1-8) - Patient's Right Side
    { number: 1, name: 'Upper Right Third Molar (Wisdom Tooth)', position: 'top', side: 'Right' },
    { number: 2, name: 'Upper Right Second Molar', position: 'top', side: 'Right' },
    { number: 3, name: 'Upper Right First Molar', position: 'top', side: 'Right' },
    { number: 4, name: 'Upper Right Second Premolar', position: 'top', side: 'Right' },
    { number: 5, name: 'Upper Right First Premolar', position: 'top', side: 'Right' },
    { number: 6, name: 'Upper Right Canine (Eye Tooth)', position: 'top', side: 'Right' },
    { number: 7, name: 'Upper Right Lateral Incisor', position: 'top', side: 'Right' },
    { number: 8, name: 'Upper Right Central Incisor', position: 'top', side: 'Right' },
    // Upper left (9-16) - Patient's Left Side
    { number: 9, name: 'Upper Left Central Incisor', position: 'top', side: 'Left' },
    { number: 10, name: 'Upper Left Lateral Incisor', position: 'top', side: 'Left' },
    { number: 11, name: 'Upper Left Canine (Eye Tooth)', position: 'top', side: 'Left' },
    { number: 12, name: 'Upper Left First Premolar', position: 'top', side: 'Left' },
    { number: 13, name: 'Upper Left Second Premolar', position: 'top', side: 'Left' },
    { number: 14, name: 'Upper Left First Molar', position: 'top', side: 'Left' },
    { number: 15, name: 'Upper Left Second Molar', position: 'top', side: 'Left' },
    { number: 16, name: 'Upper Left Third Molar (Wisdom Tooth)', position: 'top', side: 'Left' },
    // Lower left (17-24) - Patient's Left Side
    { number: 17, name: 'Lower Left Third Molar (Wisdom Tooth)', position: 'bottom', side: 'Left' },
    { number: 18, name: 'Lower Left Second Molar', position: 'bottom', side: 'Left' },
    { number: 19, name: 'Lower Left First Molar', position: 'bottom', side: 'Left' },
    { number: 20, name: 'Lower Left Second Premolar', position: 'bottom', side: 'Left' },
    { number: 21, name: 'Lower Left First Premolar', position: 'bottom', side: 'Left' },
    { number: 22, name: 'Lower Left Canine (Eye Tooth)', position: 'bottom', side: 'Left' },
    { number: 23, name: 'Lower Left Lateral Incisor', position: 'bottom', side: 'Left' },
    { number: 24, name: 'Lower Left Central Incisor', position: 'bottom', side: 'Left' },
    // Lower right (25-32) - Patient's Right Side
    { number: 25, name: 'Lower Right Central Incisor', position: 'bottom', side: 'Right' },
    { number: 26, name: 'Lower Right Lateral Incisor', position: 'bottom', side: 'Right' },
    { number: 27, name: 'Lower Right Canine (Eye Tooth)', position: 'bottom', side: 'Right' },
    { number: 28, name: 'Lower Right First Premolar', position: 'bottom', side: 'Right' },
    { number: 29, name: 'Lower Right Second Premolar', position: 'bottom', side: 'Right' },
    { number: 30, name: 'Lower Right First Molar', position: 'bottom', side: 'Right' },
    { number: 31, name: 'Lower Right Second Molar', position: 'bottom', side: 'Right' },
    { number: 32, name: 'Lower Right Third Molar (Wisdom Tooth)', position: 'bottom', side: 'Right' },
  ];

  useEffect(() => {
    loadDentalData();
  }, [patient.id]);

  const loadDentalData = async () => {
    if (!patient.id) return;
    
    try {
      setLoading(true);
      
      // Use patient's clinic ID if clinic context is not available
      const effectiveClinicId = clinic?.id || patient.clinic_id;
      console.log('Loading dental data for patient:', patient.id, 'clinic:', effectiveClinicId);
      
      // Get dental treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      console.log('Dental treatments data:', treatmentsData);
      console.log('Dental treatments error:', treatmentsError);

      // Get tooth conditions
      const { data: conditionsData, error: conditionsError } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      console.log('Tooth conditions data:', conditionsData);
      console.log('Tooth conditions error:', conditionsError);

      const allData = [
        ...(treatmentsData || []),
        ...(conditionsData || [])
      ];

      console.log('Combined dental data:', allData);
      
      // Debug: Check what data exists for each tooth
      for (let toothNum = 1; toothNum <= 32; toothNum++) {
        const toothData = allData.filter(item => item.tooth_number === toothNum.toString());
        if (toothData.length > 0) {
          console.log(`Tooth ${toothNum} has data:`, toothData);
        }
      }
      
      setDentalData(allData);
    } catch (error) {
      console.error('Error loading dental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToothData = (toothNumber: number) => {
    return dentalData.filter(item => item.tooth_number === toothNumber.toString());
  };

  const getToothColor = (toothNumber: number) => {
    const toothData = getToothData(toothNumber);
    console.log(`Tooth ${toothNumber} data:`, toothData);
    
    if (toothData.length === 0) return 'bg-gray-100 border-gray-300';
    
    const hasTreatment = toothData.some(item => item.treatment_type);
    const hasCondition = toothData.some(item => item.condition_type);
    
    console.log(`Tooth ${toothNumber} - hasTreatment:`, hasTreatment, 'hasCondition:', hasCondition);
    
    if (hasTreatment && hasCondition) return 'bg-purple-200 border-purple-500';
    if (hasTreatment) return 'bg-green-200 border-green-500';
    if (hasCondition) return 'bg-red-200 border-red-500';
    
    return 'bg-gray-100 border-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Circle className="w-5 h-5" />
            Dental Chart - {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading dental chart...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dental Chart Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dental Chart</CardTitle>
                <CardDescription>
                  Click on any tooth to view its treatments and conditions. This is how your teeth look from the dentist's perspective.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Patient Perspective Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This chart shows your teeth from the dentist's perspective. 
                      "Right" means your right side, "Left" means your left side.
                    </p>
                  </div>

                  {/* Upper Teeth Section */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-center text-gray-800">Upper Teeth (Top Jaw)</h3>
                    
                    {/* Side Labels */}
                    <div className="flex justify-between items-center px-2 sm:px-4">
                      <span className="text-xs sm:text-sm font-medium text-blue-600">Your Left Side</span>
                      <span className="text-xs sm:text-sm font-medium text-blue-600">Your Right Side</span>
                    </div>
                    
                    {/* Upper Teeth (1-16) */}
                    <div className="flex justify-center">
                      <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                        {teeth.slice(0, 16).map((tooth) => (
                          <button
                            key={tooth.number}
                            onClick={() => setSelectedTooth(tooth.number)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 text-xs font-bold transition-all hover:scale-110 ${getToothColor(tooth.number)} ${
                              selectedTooth === tooth.number ? 'ring-2 ring-blue-500' : ''
                            }`}
                            title={`Tooth ${tooth.number}: ${tooth.name}`}
                          >
                            {tooth.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lower Teeth Section */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-center text-gray-800">Lower Teeth (Bottom Jaw)</h3>
                    
                    {/* Side Labels */}
                    <div className="flex justify-between items-center px-2 sm:px-4">
                      <span className="text-xs sm:text-sm font-medium text-blue-600">Your Left Side</span>
                      <span className="text-xs sm:text-sm font-medium text-blue-600">Your Right Side</span>
                    </div>
                    
                    {/* Lower Teeth (17-32) */}
                    <div className="flex justify-center">
                      <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                        {teeth.slice(16, 32).map((tooth) => (
                          <button
                            key={tooth.number}
                            onClick={() => setSelectedTooth(tooth.number)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 text-xs font-bold transition-all hover:scale-110 ${getToothColor(tooth.number)} ${
                              selectedTooth === tooth.number ? 'ring-2 ring-blue-500' : ''
                            }`}
                            title={`Tooth ${tooth.number}: ${tooth.name}`}
                          >
                            {tooth.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2 text-center">Legend</h4>
                    <div className="grid grid-cols-2 sm:flex sm:justify-center sm:gap-6 text-xs gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                        <span>No Data</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-200 border border-green-500 rounded"></div>
                        <span>Treatment Done</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-200 border border-red-500 rounded"></div>
                        <span>Condition Found</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-purple-200 border border-purple-500 rounded"></div>
                        <span>Both Treatment & Condition</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Tooth Details */}
            {selectedTooth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Tooth {selectedTooth}: {teeth.find(t => t.number === selectedTooth)?.name}
                  </CardTitle>
                  <CardDescription>
                    {teeth.find(t => t.number === selectedTooth)?.side} side, {teeth.find(t => t.number === selectedTooth)?.position} jaw
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getToothData(selectedTooth).length === 0 ? (
                    <div className="text-center py-8">
                      <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No records found for this tooth</p>
                      <p className="text-sm text-gray-400 mt-2">This tooth has no treatments or conditions recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getToothData(selectedTooth).map((item) => (
                        <Card key={item.id} className="border-l-4 border-blue-500">
                          <CardContent className="p-4">
                                                          <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {item.treatment_type || item.condition_type || 'Dental Record'}
                                  </h3>
                                  <Badge className={`text-xs mt-1 ${
                                    item.treatment_type ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.treatment_type ? 'Treatment' : 'Condition'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {(item.treatment_description || item.condition_description) && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600">
                                    <strong>Description:</strong> {item.treatment_description || item.condition_description}
                                  </p>
                                </div>
                              )}
                            
                            {item.notes && (
                              <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Notes:</p>
                                <p className="text-sm text-yellow-700">{item.notes}</p>
                              </div>
                            )}
                            
                                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Date: {formatDate(item.created_at)}</span>
                                {(item.treatment_status || item.severity) && (
                                  <Badge className="text-xs">
                                    {item.treatment_status || item.severity}
                                  </Badge>
                                )}
                              </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Medical History Component
const MedicalHistory = ({ 
  patient, 
  dentalTreatments,
  toothConditions,
  prescriptions,
  labWork,
  appointments,
  onClose 
}: { 
  patient: Patient, 
  dentalTreatments: any[],
  toothConditions: any[],
  prescriptions: any[],
  labWork: any[],
  appointments: any[],
  onClose: () => void 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getLabWorkStatusColor = (status: string) => {
    switch (status) {
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Quality Check': return 'bg-indigo-100 text-indigo-800';
      case 'Ready for Pickup': return 'bg-purple-100 text-purple-800';
      case 'Patient Notified': return 'bg-pink-100 text-pink-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRecords = dentalTreatments.length + toothConditions.length + prescriptions.length + labWork.length + appointments.length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Medical History - {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>
        
        {totalRecords === 0 ? (
          <div className="text-center py-8">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No medical history found</p>
            <p className="text-sm text-gray-400 mt-2">No dental treatments, conditions, prescriptions, lab work, or appointments recorded</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical History Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{dentalTreatments.length}</div>
                    <div className="text-sm text-blue-800">Treatments</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{toothConditions.length}</div>
                    <div className="text-sm text-red-800">Conditions</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{prescriptions.length}</div>
                    <div className="text-sm text-green-800">Prescriptions</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{labWork.length}</div>
                    <div className="text-sm text-purple-800">Lab Work</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{appointments.length}</div>
                    <div className="text-sm text-orange-800">Appointments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dental Treatments */}
            {dentalTreatments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dental Treatments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dentalTreatments.map((treatment) => (
                    <div key={treatment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{treatment.treatment_type}</h4>
                          <p className="text-sm text-gray-600">Tooth: {treatment.tooth_number}</p>
                          {treatment.treatment_description && (
                            <p className="text-sm text-gray-600 mt-1">{treatment.treatment_description}</p>
                          )}
                          {treatment.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {treatment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${
                            treatment.treatment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                            treatment.treatment_status === 'In Progress' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {treatment.treatment_status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(treatment.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tooth Conditions */}
            {toothConditions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tooth Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {toothConditions.map((condition) => (
                    <div key={condition.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{condition.condition_type}</h4>
                          <p className="text-sm text-gray-600">Tooth: {condition.tooth_number}</p>
                          {condition.condition_description && (
                            <p className="text-sm text-gray-600 mt-1">{condition.condition_description}</p>
                          )}
                          {condition.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {condition.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${
                            condition.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                            condition.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {condition.severity}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(condition.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Prescriptions */}
            {prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prescriptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{prescription.medication_name}</h4>
                          <p className="text-sm text-gray-600">
                            {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                          </p>
                          {prescription.instructions && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Instructions:</strong> {prescription.instructions}</p>
                          )}
                          {prescription.instructions && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Instructions:</strong> {prescription.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${
                            prescription.status === 'Active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {prescription.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(prescription.prescribed_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Lab Work */}
            {labWork.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lab Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {labWork.map((order) => (
                    <div key={order.id} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{capitalizeFirst(order.work_type)}</h4>
                          {order.lab_name && (
                            <p className="text-sm text-gray-600">Lab: {order.lab_name}</p>
                          )}
                          {order.description && (
                            <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                          )}
                          {order.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {order.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getLabWorkStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(order.order_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Appointments */}
            {appointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Appointments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{appointment.service || 'Dental Appointment'}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(appointment.date)} at {appointment.time}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {appointment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getAppointmentStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PatientDataAccess = () => {
  const { clinic } = useClinic();
  
  // Debug clinic context
  useEffect(() => {
    console.log('Clinic context updated:', clinic);
    console.log('Clinic ID:', clinic?.id);
    console.log('Clinic name:', clinic?.name);
  }, [clinic]);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [multiplePatients, setMultiplePatients] = useState<any[]>([]);
  const [showPatientSelection, setShowPatientSelection] = useState(false);
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  
  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [labWork, setLabWork] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [dentalTreatments, setDentalTreatments] = useState<any[]>([]);
  const [toothConditions, setToothConditions] = useState<any[]>([]);

  // Handle phone number input
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  // Search for patient data
  const handleSearch = async () => {
    if (!clinic?.id) {
      toast.error('Clinic information not available');
      return;
    }

    if (!patientUtils.validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Show captcha first
    setShowCaptcha(true);
  };

  // Handle captcha verification
  const handleCaptchaVerify = async (success: boolean) => {
    if (success) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
      await performSearch();
    }
  };

  // Perform the actual search
  const performSearch = async () => {
    setIsLoading(true);
    try {
      console.log('Searching for patient with phone:', phone, 'clinic ID:', clinic.id);
      
      // Try RPC function first
      let data = null;
      let error = null;
      
      try {
        const rpcResult = await supabase
          .rpc('get_patient_by_phone', {
            p_phone: phone,
            p_clinic_id: clinic.id
          });
        
        data = rpcResult.data;
        error = rpcResult.error;
        
        console.log('RPC Patient search result:', data);
        console.log('RPC Patient search error:', error);
      } catch (rpcError) {
        console.error('RPC function failed, trying direct query:', rpcError);
        error = rpcError;
      }

      // If RPC failed, try direct query as fallback
      if (error) {
        console.log('Trying direct query as fallback...');
        
        const directResult = await supabase
          .from('patients')
          .select(`
            id as patient_id,
            first_name,
            last_name,
            email,
            clinic_id
          `)
          .eq('clinic_id', clinic.id)
          .eq('phone', phone);
        
        data = directResult.data;
        error = directResult.error;
        
        console.log('Direct query result:', data);
        console.log('Direct query error:', error);
      }

      if (error) {
        console.error('Detailed search error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error(`Error searching for patient: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error('No patient found with this phone number. Please contact the clinic to register.');
        return;
      }

      // If multiple patients found, show selection
      if (data.length > 1) {
        setMultiplePatients(data);
        setShowPatientSelection(true);
        return;
      }

      // Single patient found, load data
      await loadPatientData(data[0]);
    } catch (error) {
      console.error('Error searching for patient:', error);
      toast.error('Error searching for patient');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data for selected patient
  const loadPatientData = async (patientData: any) => {
    try {
      const patientId = patientData.patient_id;
      
      console.log('Loading patient data for ID:', patientId);
      console.log('Current clinic ID:', clinic?.id);
      
      // Get patient full details
      const { data: fullPatientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      console.log('Patient data:', fullPatientData);
      console.log('Patient error:', patientError);
      
      setPatient(fullPatientData);
      
      // Use patient's clinic ID if clinic context is not available
      const effectiveClinicId = clinic?.id || fullPatientData?.clinic_id;
      console.log('Effective clinic ID for queries:', effectiveClinicId);

      // Load appointments (only upcoming)
      console.log('Loading appointments for patient:', patientId);
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .in('status', ['Confirmed', 'Scheduled'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      console.log('Appointments data:', appointmentsData);
      console.log('Appointments error:', appointmentsError);
      setAppointments(appointmentsData || []);

      // Load lab work - Direct query instead of RPC function
      console.log('Loading lab work for patient:', patientId, 'clinic:', effectiveClinicId);
      const { data: labWorkData, error: labWorkError } = await supabase
        .from('lab_work')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      console.log('Lab work data:', labWorkData);
      console.log('Lab work error:', labWorkError);
      setLabWork(labWorkData || []);

      // Load prescriptions
      console.log('Loading prescriptions for patient:', patientId);
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .in('status', ['Active', 'Completed'])
        .order('prescribed_date', { ascending: false });

      console.log('Prescriptions data:', prescriptionsData);
      console.log('Prescriptions error:', prescriptionsError);
      setPrescriptions(prescriptionsData || []);

      // Load dental treatments
      console.log('Loading dental treatments for patient:', patientId);
      const { data: dentalTreatmentsData, error: dentalTreatmentsError } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      console.log('Dental treatments data:', dentalTreatmentsData);
      console.log('Dental treatments error:', dentalTreatmentsError);
      setDentalTreatments(dentalTreatmentsData || []);

      // Load tooth conditions
      console.log('Loading tooth conditions for patient:', patientId);
      const { data: toothConditionsData, error: toothConditionsError } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      console.log('Tooth conditions data:', toothConditionsData);
      console.log('Tooth conditions error:', toothConditionsError);
      setToothConditions(toothConditionsData || []);

      // Load treatment plans
      const { data: treatmentPlansData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      setTreatmentPlans(treatmentPlansData || []);

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Error loading patient data');
    }
  };

  // Handle patient selection from multiple patients
  const handlePatientSelect = async (selectedPatient: any) => {
    setShowPatientSelection(false);
    await loadPatientData(selectedPatient);
  };

  // Handle contact actions
  const handleWhatsApp = (message: string) => {
    const clinicPhone = clinic?.contact_phone || '';
    const whatsappUrl = `https://wa.me/${clinicPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCall = () => {
    const clinicPhone = clinic?.contact_phone || '';
    window.open(`tel:${clinicPhone}`, '_self');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getLabWorkStatusColor = (status: string) => {
    switch (status) {
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Quality Check': return 'bg-indigo-100 text-indigo-800';
      case 'Ready for Pickup': return 'bg-purple-100 text-purple-800';
      case 'Patient Notified': return 'bg-pink-100 text-pink-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Reset everything
  const handleReset = () => {
    setPhone('');
    setPatient(null);
    setShowCaptcha(false);
    setCaptchaVerified(false);
    setMultiplePatients([]);
    setShowPatientSelection(false);
    setShowDentalChart(false);
    setShowPrescriptions(false);
    setShowMedicalHistory(false);
    setAppointments([]);
    setLabWork([]);
    setPrescriptions([]);
    setTreatmentPlans([]);
    setDentalTreatments([]);
    setToothConditions([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Patient Portal
        </h1>
        <p className="text-gray-600">
          Access your dental care information securely
        </p>
      </div>

      {/* Phone Number Input */}
      {!patient && !showCaptcha && (
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Enter Your Phone Number
              </CardTitle>
              <CardDescription>
                We'll send you a verification code to access your records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  className="text-center text-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={phone.length !== 10 || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Records
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Math Captcha */}
      {showCaptcha && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <MathCaptcha onVerify={handleCaptchaVerify} />
          </div>
        </div>
      )}

      {/* Multiple Patient Selection */}
      {showPatientSelection && (
        <PatientSelection
          patients={multiplePatients}
          onSelect={handlePatientSelect}
          onCancel={() => setShowPatientSelection(false)}
        />
      )}

      {/* Dental Chart Detail */}
      {showDentalChart && patient && (
        <DetailedDentalChart
          patient={patient}
          onClose={() => setShowDentalChart(false)}
        />
      )}

      {/* Prescriptions Detail */}
      {showPrescriptions && (
        <PrescriptionsDetail
          prescriptions={prescriptions}
          onClose={() => setShowPrescriptions(false)}
        />
      )}

      {/* Medical History Detail */}
      {showMedicalHistory && (
        <MedicalHistory
          patient={patient}
          dentalTreatments={dentalTreatments}
          toothConditions={toothConditions}
          prescriptions={prescriptions}
          labWork={labWork}
          appointments={appointments}
          onClose={() => setShowMedicalHistory(false)}
        />
      )}

      {/* Patient Data Display */}
      {patient && (
        <div className="space-y-6">
          {/* Patient Info Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    Welcome, {patient.first_name} {patient.last_name}
                  </h2>
                  <p className="text-blue-700">
                    Phone: {patient.phone}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={() => handleWhatsApp(`Hi, I have a question about my dental care.`)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <WhatsAppIcon />
                    <span className="ml-2">WhatsApp</span>
                  </Button>
                  <Button 
                    onClick={handleCall}
                    variant="outline"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments - Only show if exists */}
          {appointments.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                  <Calendar className="w-4 h-4" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {formatDate(appointment.date)} at {appointment.time}
                        </h4>
                        <p className="text-xs text-gray-600">Status: {appointment.status}</p>
                      </div>
                      <Badge className={`text-xs ${getAppointmentStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Lab Work - Only show if exists */}
          {labWork.length > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                  <Activity className="w-4 h-4" />
                  Lab Work Orders ({labWork.length})
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Your lab work status and expected completion dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {labWork.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                                              <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {capitalizeFirst(order.work_type)}
                          </h3>
                        {order.lab_name && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Lab Facility:</strong> {order.lab_name}
                          </p>
                        )}
                        {order.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Description:</strong> {order.description}
                          </p>
                        )}
                      </div>
                      <Badge className={`text-xs ${getLabWorkStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <strong>Ordered Date:</strong> {formatDate(order.order_date)}
                        </p>
                        {order.expected_completion_date && (
                          <p className="text-gray-600">
                            <strong>Expected Completion:</strong> {formatDate(order.expected_completion_date)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {order.notes && (
                          <p className="text-gray-600">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        )}
                        {order.cost && (
                          <p className="text-gray-600">
                            <strong>Cost:</strong> ₹{order.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Mobile Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
              <CardDescription>
                Access your dental information and records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Prescriptions Button */}
                <Button 
                  onClick={() => setShowPrescriptions(true)}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Pill className="w-6 h-6" />
                  <span className="text-sm">Prescriptions</span>
                  {prescriptions.length > 0 && (
                    <Badge className="text-xs">{prescriptions.length}</Badge>
                  )}
                </Button>

                {/* Dental Chart Button */}
                <Button 
                  onClick={() => setShowDentalChart(true)}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Circle className="w-6 h-6" />
                  <span className="text-sm">Dental Chart</span>
                </Button>

                {/* Medical History Button */}
                <Button 
                  onClick={() => setShowMedicalHistory(true)}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Stethoscope className="w-6 h-6" />
                  <span className="text-sm">Medical History</span>
                  {(dentalTreatments.length + toothConditions.length + prescriptions.length + labWork.length + appointments.length) > 0 && (
                    <Badge className="text-xs">{dentalTreatments.length + toothConditions.length + prescriptions.length + labWork.length + appointments.length}</Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="text-center">
            <Button onClick={handleReset} variant="outline">
              Search Another Patient
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDataAccess;
