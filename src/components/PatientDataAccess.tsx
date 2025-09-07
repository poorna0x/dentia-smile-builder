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
import { toothImageApi, ToothImage } from '@/lib/tooth-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  XCircle,
  Image as ImageIcon,
  Download,
  X,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { toothChartUtils } from '@/lib/dental-treatments';

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
            className="w-full max-w-xs mx-auto text-center border-2 border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
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

// Detailed Dental Chart Component with FDI Numbering System
const DetailedDentalChart = ({ 
  patient, 
  dentalTreatments,
  toothConditions,
  onClose
}: { 
  patient: Patient, 
  dentalTreatments: any[],
  toothConditions: any[],
  onClose: () => void
}) => {
  const [dentalData, setDentalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);

  // Define all 32 teeth using FDI numbering system (same as dentist chart)
  const teeth = [
    // Upper right (11-18) - Patient's Right Side
    { number: '11', name: 'Upper Right Central Incisor', position: 'top', side: 'Right' },
    { number: '12', name: 'Upper Right Lateral Incisor', position: 'top', side: 'Right' },
    { number: '13', name: 'Upper Right Canine (Eye Tooth)', position: 'top', side: 'Right' },
    { number: '14', name: 'Upper Right First Premolar', position: 'top', side: 'Right' },
    { number: '15', name: 'Upper Right Second Premolar', position: 'top', side: 'Right' },
    { number: '16', name: 'Upper Right First Molar', position: 'top', side: 'Right' },
    { number: '17', name: 'Upper Right Second Molar', position: 'top', side: 'Right' },
    { number: '18', name: 'Upper Right Third Molar (Wisdom Tooth)', position: 'top', side: 'Right' },
    // Upper left (21-28) - Patient's Left Side
    { number: '21', name: 'Upper Left Central Incisor', position: 'top', side: 'Left' },
    { number: '22', name: 'Upper Left Lateral Incisor', position: 'top', side: 'Left' },
    { number: '23', name: 'Upper Left Canine (Eye Tooth)', position: 'top', side: 'Left' },
    { number: '24', name: 'Upper Left First Premolar', position: 'top', side: 'Left' },
    { number: '25', name: 'Upper Left Second Premolar', position: 'top', side: 'Left' },
    { number: '26', name: 'Upper Left First Molar', position: 'top', side: 'Left' },
    { number: '27', name: 'Upper Left Second Molar', position: 'top', side: 'Left' },
    { number: '28', name: 'Upper Left Third Molar (Wisdom Tooth)', position: 'top', side: 'Left' },
    // Lower left (31-38) - Patient's Left Side
    { number: '31', name: 'Lower Left Central Incisor', position: 'bottom', side: 'Left' },
    { number: '32', name: 'Lower Left Lateral Incisor', position: 'bottom', side: 'Left' },
    { number: '33', name: 'Lower Left Canine (Eye Tooth)', position: 'bottom', side: 'Left' },
    { number: '34', name: 'Lower Left First Premolar', position: 'bottom', side: 'Left' },
    { number: '35', name: 'Lower Left Second Premolar', position: 'bottom', side: 'Left' },
    { number: '36', name: 'Lower Left First Molar', position: 'bottom', side: 'Left' },
    { number: '37', name: 'Lower Left Second Molar', position: 'bottom', side: 'Left' },
    { number: '38', name: 'Lower Left Third Molar (Wisdom Tooth)', position: 'bottom', side: 'Left' },
    // Lower right (41-48) - Patient's Right Side
    { number: '41', name: 'Lower Right Central Incisor', position: 'bottom', side: 'Right' },
    { number: '42', name: 'Lower Right Lateral Incisor', position: 'bottom', side: 'Right' },
    { number: '43', name: 'Lower Right Canine (Eye Tooth)', position: 'bottom', side: 'Right' },
    { number: '44', name: 'Lower Right First Premolar', position: 'bottom', side: 'Right' },
    { number: '45', name: 'Lower Right Second Premolar', position: 'bottom', side: 'Right' },
    { number: '46', name: 'Lower Right First Molar', position: 'bottom', side: 'Right' },
    { number: '47', name: 'Lower Right Second Molar', position: 'bottom', side: 'Right' },
    { number: '48', name: 'Lower Right Third Molar (Wisdom Tooth)', position: 'bottom', side: 'Right' },
  ];

  // Update dental data when props change
  useEffect(() => {
    const allData = [
      ...(dentalTreatments || []),
      ...(toothConditions || [])
    ];
    setDentalData(allData);
  }, [dentalTreatments, toothConditions]);

  const getToothData = (toothNumber: string) => {
    return dentalData.filter(item => {
      const itemToothNumber = item.tooth_number;
      const searchToothNumber = toothNumber.toString();
      
      // Direct match for FDI system
      return itemToothNumber === searchToothNumber;
    });
  };

  const getToothColor = (toothNumber: string) => {
    const toothData = getToothData(toothNumber);
    
    if (toothData.length === 0) return 'bg-gray-100 border-gray-300';
    
    const hasTreatment = toothData.some(item => item.treatment_type);
    const hasCondition = toothData.some(item => item.condition_type);
    
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
          <DialogDescription>
            Interactive dental chart showing treatments and conditions for each tooth. Click on teeth to view details.
          </DialogDescription>
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
                <CardTitle className="text-lg">Dental Chart (FDI System)</CardTitle>
                <CardDescription>
                  Click on any tooth to view its treatments and conditions. This chart uses the same numbering system as your dentist.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Patient Perspective Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This chart shows your teeth from the dentist's perspective using the FDI numbering system. 
                      "Right" means your right side, "Left" means your left side. The numbers match what your dentist uses.
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
                    
                    {/* Upper Teeth (18-11, 21-28) - Match dentist layout */}
                    <div className="flex justify-center">
                      <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                        {/* Left side teeth (18-11) - Upper Right Quadrant */}
                        {teeth.slice(0, 8).reverse().map((tooth) => (
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
                        {/* Right side teeth (21-28) - Upper Left Quadrant */}
                        {teeth.slice(8, 16).map((tooth) => (
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
                    
                    {/* Lower Teeth (48-41, 31-38) - Match dentist layout */}
                    <div className="flex justify-center">
                      <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                        {/* Left side teeth (48-41) - Lower Right Quadrant */}
                        {teeth.slice(24, 32).reverse().map((tooth) => (
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
                        {/* Right side teeth (31-38) - Lower Left Quadrant */}
                        {teeth.slice(16, 24).map((tooth) => (
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Color Legend:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
                        <span>Has Treatment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
                        <span>Has Condition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-200 border-2 border-purple-500 rounded"></div>
                        <span>Treatment + Condition</span>
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
                    <Circle className="w-4 h-4" />
                    Tooth {selectedTooth} Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const toothData = getToothData(selectedTooth);
                    const selectedToothInfo = teeth.find(t => t.number === selectedTooth);
                    
                    if (toothData.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No treatments or conditions recorded for this tooth.</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {selectedToothInfo?.name} - {selectedToothInfo?.position}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>{selectedToothInfo?.name}</strong> - {selectedToothInfo?.position}
                          </p>
                        </div>

                        {/* Treatments */}
                        {toothData.filter(item => item.treatment_type).length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-700 mb-2">Treatments:</h4>
                            <div className="space-y-2">
                              {toothData
                                .filter(item => item.treatment_type)
                                .map((treatment, index) => (
                                  <div key={index} className="bg-green-50 border border-green-200 rounded p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-medium text-green-800">{treatment.treatment_type}</h5>
                                        {treatment.treatment_description && (
                                          <p className="text-sm text-green-700 mt-1">{treatment.treatment_description}</p>
                                        )}
                                        {treatment.notes && (
                                          <p className="text-sm text-green-600 mt-1"><strong>Notes:</strong> {treatment.notes}</p>
                                        )}
                                        {treatment.created_by && (
                                          <p className="text-sm text-green-600 mt-1">
                                            <User className="h-3 w-3 inline mr-1" />
                                            Doctor: {treatment.created_by}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          {treatment.treatment_status}
                                        </Badge>
                                        {treatment.treatment_date && (
                                          <p className="text-xs text-green-600 mt-1">
                                            {formatDate(treatment.treatment_date)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Conditions */}
                        {toothData.filter(item => item.condition_type).length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-700 mb-2">Conditions:</h4>
                            <div className="space-y-2">
                              {toothData
                                .filter(item => item.condition_type)
                                .map((condition, index) => (
                                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-medium text-red-800">{condition.condition_type}</h5>
                                        {condition.condition_description && (
                                          <p className="text-sm text-red-700 mt-1">{condition.condition_description}</p>
                                        )}
                                        {condition.notes && (
                                          <p className="text-sm text-red-600 mt-1"><strong>Notes:</strong> {condition.notes}</p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                          {condition.severity}
                                        </Badge>
                                        <p className="text-xs text-red-600 mt-1">
                                          {formatDate(condition.last_updated)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Tooth Images Dialog Component
const ToothImagesDialog = ({ 
  patient, 
  images, 
  onClose 
}: { 
  patient: Patient; 
  images: ToothImage[]; 
  onClose: () => void;
}) => {
  const [selectedImage, setSelectedImage] = useState<ToothImage | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'xray' | 'photo' | 'scan'>('all');

  // Filter images by type and remove duplicates
  const filteredImages = images
    .filter(img => {
      const typeMatch = filterType === 'all' || img.image_type === filterType;
      return typeMatch;
    })
    // Remove duplicates based on Cloudinary URL (same image uploaded multiple times)
    .filter((img, index, self) => 
      index === self.findIndex(t => t.cloudinary_url === img.cloudinary_url)
    );

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'xray': return '🦷';
      case 'photo': return '📷';
      case 'scan': return '🔬';
      default: return '🖼️';
    }
  };

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'xray': return 'X-Ray';
      case 'photo': return 'Photo';
      case 'scan': return '3D Scan';
      default: return 'Image';
    }
  };

  // Helper function to get deduplicated count for a specific image type
  const getDeduplicatedCount = (imageType: 'xray' | 'photo' | 'scan') => {
    return images
      .filter(img => img.image_type === imageType)
      .filter((img, index, self) => 
        index === self.findIndex(t => t.cloudinary_url === img.cloudinary_url)
      ).length;
  };

  // Helper function to get all teeth associated with a specific image URL
  const getAssociatedTeeth = (imageUrl: string) => {
    return images
      .filter(img => img.cloudinary_url === imageUrl)
      .map(img => img.tooth_number)
      .sort((a, b) => parseInt(a) - parseInt(b));
  };

  const handleDownload = async (image: ToothImage) => {
    try {
      const response = await fetch(image.cloudinary_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tooth-${image.tooth_number}-${image.image_type}-${new Date(image.uploaded_at).toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Image download has started",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Tooth Images - {patient.first_name} {patient.last_name}
          </DialogTitle>
          <DialogDescription>
            View and download your X-rays, photos, and 3D scans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Images</h3>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({filteredImages.length})</TabsTrigger>
                <TabsTrigger value="xray">X-Rays ({getDeduplicatedCount('xray')})</TabsTrigger>
                <TabsTrigger value="photo">Photos ({getDeduplicatedCount('photo')})</TabsTrigger>
                <TabsTrigger value="scan">Scans ({getDeduplicatedCount('scan')})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Images Grid */}
            {filteredImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredImages.map((image) => (
                  <Card key={image.id} className="group relative overflow-hidden">
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={image.cloudinary_url}
                        alt={image.description}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                        loading="lazy"
                      />
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedImage(image)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(image)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getImageTypeIcon(image.image_type)}</span>
                          <div className="flex flex-wrap gap-1">
                            {getAssociatedTeeth(image.cloudinary_url).map(toothNumber => (
                              <Badge key={toothNumber} variant="outline" className="text-xs">
                                Tooth #{toothNumber}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {getImageTypeLabel(image.image_type)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate" title={image.description}>
                        {image.description}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(image.uploaded_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      No images found
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getImageTypeIcon(selectedImage.image_type)} 
                  {getAssociatedTeeth(selectedImage.cloudinary_url).length > 1 
                    ? `Teeth ${getAssociatedTeeth(selectedImage.cloudinary_url).join(', ')}` 
                    : `Tooth #${selectedImage.tooth_number}`} - {getImageTypeLabel(selectedImage.image_type)}
                </DialogTitle>
                <DialogDescription>
                  {selectedImage.description}
                  {getAssociatedTeeth(selectedImage.cloudinary_url).length > 1 && (
                    <span className="block mt-1 text-sm text-blue-600">
                      This image is associated with multiple teeth
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="relative">
                <img
                  src={selectedImage.cloudinary_url}
                  alt={selectedImage.description}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Uploaded: {new Date(selectedImage.uploaded_at).toLocaleString()}
                </div>
                <Button onClick={() => handleDownload(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
  const [showToothImages, setShowToothImages] = useState(false);
  
  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [toothImages, setToothImages] = useState<ToothImage[]>([]);
  const [labWork, setLabWork] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [dentalTreatments, setDentalTreatments] = useState<any[]>([]);
  const [toothConditions, setToothConditions] = useState<any[]>([]);

  // Phone number formatting function (same as booking form)
  const formatPhoneNumber = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  };

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
      // Format the phone number before searching
      const formattedPhone = formatPhoneNumber(phone);
      
      // Try RPC function first
      let data = null;
      let error = null;
      
      try {
        const rpcResult = await supabase
          .rpc('get_patient_by_phone', {
            p_phone: formattedPhone,
            p_clinic_id: clinic.id
          });
        
        data = rpcResult.data;
        error = rpcResult.error;
        
      } catch (rpcError) {
        console.error('RPC function failed, trying direct query:', rpcError);
        error = rpcError;
      }

      // If RPC returned no data or failed, try direct queries as fallback
      if (error || !data || data.length === 0) {
        
        // First try searching in patient_phones table (same as RPC function)
        const phoneResult = await supabase
          .from('patient_phones')
          .select(`
            patient_id,
            patients!inner(
              id,
              first_name,
              last_name,
              email,
              clinic_id
            )
          `)
          .eq('phone', formattedPhone)
          .eq('patients.clinic_id', clinic.id);
        
        if (phoneResult.data && phoneResult.data.length > 0) {
          // Transform the data to match expected format
          data = phoneResult.data.map(item => ({
            patient_id: item.patient_id,
            first_name: item.patients.first_name,
            last_name: item.patients.last_name,
            email: item.patients.email,
            clinic_id: item.patients.clinic_id
          }));
          error = null;
        } else {
          // Fallback to searching in patients table directly
          const directResult = await supabase
            .from('patients')
            .select('id, first_name, last_name, email, clinic_id')
            .eq('clinic_id', clinic.id)
            .eq('phone', formattedPhone);
          
          if (directResult.data && directResult.data.length > 0) {
            // Map the data to match expected format
            data = directResult.data.map(item => ({
              patient_id: item.id,
              first_name: item.first_name,
              last_name: item.last_name,
              email: item.email,
              clinic_id: item.clinic_id
            }));
            error = null;
          } else {
            // Try with different phone number formats
            // Try with +91 prefix
            const withCountryCode = `91${formattedPhone}`;
            const countryCodeResult = await supabase
              .from('patients')
              .select('id, first_name, last_name, email, clinic_id')
              .eq('clinic_id', clinic.id)
              .eq('phone', withCountryCode);
            
            if (countryCodeResult.data && countryCodeResult.data.length > 0) {
              data = countryCodeResult.data.map(item => ({
                patient_id: item.id,
                first_name: item.first_name,
                last_name: item.last_name,
                email: item.email,
                clinic_id: item.clinic_id
              }));
              error = null;
            } else {
              // Try with 0 prefix
              const withZeroPrefix = `0${formattedPhone}`;
              const zeroPrefixResult = await supabase
                .from('patients')
                .select('id, first_name, last_name, email, clinic_id')
                .eq('clinic_id', clinic.id)
                .eq('phone', withZeroPrefix);
              
              if (zeroPrefixResult.data && zeroPrefixResult.data.length > 0) {
                data = zeroPrefixResult.data.map(item => ({
                  patient_id: item.id,
                  first_name: item.first_name,
                  last_name: item.last_name,
                  email: item.email,
                  clinic_id: item.clinic_id
                }));
                error = null;
              } else {
                data = null;
                error = new Error('No patients found with any phone number format');
              }
            }
          }
        }
        
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
      
      
      // Get patient full details
      const { data: fullPatientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      
      setPatient(fullPatientData);
      
      // Use patient's clinic ID if clinic context is not available
      const effectiveClinicId = clinic?.id || fullPatientData?.clinic_id;

      // Load appointments (only upcoming)
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .in('status', ['Confirmed', 'Scheduled'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      setAppointments(appointmentsData || []);

      // Load lab work - Direct query instead of RPC function
      const { data: labWorkData, error: labWorkError } = await supabase
        .from('lab_work')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      setLabWork(labWorkData || []);

      // Load prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .in('status', ['Active', 'Completed'])
        .order('prescribed_date', { ascending: false });

      setPrescriptions(prescriptionsData || []);

      // Load dental treatments
      const { data: dentalTreatmentsData, error: dentalTreatmentsError } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      setDentalTreatments(dentalTreatmentsData || []);

      // Load tooth conditions
      const { data: toothConditionsData, error: toothConditionsError } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('clinic_id', effectiveClinicId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      setToothConditions(toothConditionsData || []);

      // Load tooth images
      try {
        const toothImagesData = await toothImageApi.getByPatient(patientId, effectiveClinicId);
        setToothImages(toothImagesData || []);
      } catch (toothImagesError) {
        console.error('Error loading tooth images:', toothImagesError);
        setToothImages([]);
      }

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

  // Refresh patient data
  const handleRefreshPatientData = async () => {
    if (!patient) return;
    await loadPatientData(patient);
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
    setShowToothImages(false);
    setAppointments([]);
    setLabWork([]);
    setPrescriptions([]);
    setTreatmentPlans([]);
    setDentalTreatments([]);
    setToothConditions([]);
    setToothImages([]);
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
                Enter your phone number to access your medical records
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
          dentalTreatments={dentalTreatments}
          toothConditions={toothConditions}
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

      {/* Tooth Images Detail */}
      {showToothImages && patient && (
        <ToothImagesDialog
          patient={patient}
          images={toothImages}
          onClose={() => setShowToothImages(false)}
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
            <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
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
                  <div key={appointment.id} className="bg-white rounded-lg p-3 border-2 border-blue-200">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

                {/* Tooth Images Button */}
                <Button 
                  onClick={() => setShowToothImages(true)}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm">Tooth Images</span>
                  {toothImages.length > 0 && (
                    <Badge className="text-xs">{toothImages.length}</Badge>
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
