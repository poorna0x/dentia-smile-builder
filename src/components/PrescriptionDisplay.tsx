/**
 * Prescription Display Component
 * 
 * Shows patient prescriptions with:
 * - Medication details
 * - Dosage instructions
 * - Prescribed date
 * - Doctor information
 * - Status (Active/Completed/Discontinued)
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Calendar, 
  User, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Prescription {
  id: string;
  patient_id: string;
  clinic_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  prescribed_by: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  refills_remaining: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PrescriptionDisplayProps {
  prescriptions: Prescription[];
}

const PrescriptionDisplay: React.FC<PrescriptionDisplayProps> = ({ prescriptions }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4" />;
      case 'Completed':
        return <Clock className="w-4 h-4" />;
      case 'Discontinued':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (prescriptions.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
            <Pill className="w-4 h-4" />
            Prescriptions
          </CardTitle>
          <CardDescription className="text-gray-500">
            No prescriptions found
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
          <Pill className="w-4 h-4" />
          Active Prescriptions
        </CardTitle>
        <CardDescription className="text-purple-700">
          Your current medications and prescriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {prescriptions.map((prescription) => (
          <div key={prescription.id} className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900">
                  {prescription.medication_name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                </p>
                {prescription.instructions && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Instructions:</strong> {prescription.instructions}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(prescription.prescribed_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Dr. {prescription.prescribed_by}
                  </span>
                  {prescription.refills_remaining > 0 && (
                    <span className="text-blue-600">
                      {prescription.refills_remaining} refills left
                    </span>
                  )}
                </div>
              </div>
              <Badge className={`text-xs ${getStatusColor(prescription.status)}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(prescription.status)}
                  {prescription.status}
                </div>
              </Badge>
            </div>
            
            {prescription.notes && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Notes:</strong> {prescription.notes}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PrescriptionDisplay;
