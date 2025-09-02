/**
 * Simple Active Treatments Display
 * 
 * Shows active treatments and appointments on the home page with:
 * - Treatment status
 * - Contact options (WhatsApp, Phone)
 * - Simple, clean design
 */

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  MessageCircle, 
  Calendar, 
  AlertCircle,
  Clock,
  Pill
} from 'lucide-react';

// WhatsApp Icon SVG
const WhatsAppIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

interface SimpleActiveTreatmentsProps {
  patientPhone: string;
}

const SimpleActiveTreatments: React.FC<SimpleActiveTreatmentsProps> = ({ patientPhone }) => {
  const { clinic } = useClinic();
  const [activeTreatments, setActiveTreatments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dentalData, setDentalData] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labWork, setLabWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinic?.id && patientPhone) {
      loadData();
    }
  }, [clinic?.id, patientPhone]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get patient by phone using the new database function
      const { data: patientResult } = await supabase
        .rpc('get_patient_by_phone', {
          p_phone: patientPhone,
          p_clinic_id: clinic?.id
        });

      if (!patientResult || patientResult.length === 0) {
        return;
      }

      const patientData = { id: patientResult[0].patient_id };

      if (patientData) {
        // Get all treatments (not just active ones)
        const { data: treatmentsData } = await supabase
          .from('treatment_plans')
          .select('*')
          .eq('clinic_id', clinic?.id)
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false });

        setActiveTreatments(treatmentsData || []);

        // Get upcoming appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinic_id', clinic?.id)
          .eq('patient_id', patientData.id)
          .in('status', ['Confirmed', 'Scheduled'])
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true });

        setAppointments(appointmentsData || []);

        // Get dental treatments and conditions
        const { data: dentalTreatmentsData } = await supabase
          .from('dental_treatments')
          .select('*')
          .eq('clinic_id', clinic?.id)
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false });

        const { data: dentalConditionsData } = await supabase
          .from('tooth_conditions')
          .select('*')
          .eq('clinic_id', clinic?.id)
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false });

        setDentalData([
          ...(dentalTreatmentsData || []),
          ...(dentalConditionsData || [])
        ]);

        // Get prescriptions (including expired ones)
        
        const { data: prescriptionsData, error: prescriptionsError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('clinic_id', clinic?.id)
          .eq('patient_id', patientData.id)
          .in('status', ['Active', 'Completed'])
          .order('prescribed_date', { ascending: false });

        
        setPrescriptions(prescriptionsData || []);

        // Get lab work orders
        const { data: labWorkData } = await supabase
          .rpc('get_lab_work_orders', {
            p_patient_id: patientData.id,
            p_clinic_id: clinic?.id
          });

        setLabWork(labWorkData || []);
      }
    } catch (error) {
      console.error('Error loading active treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'In Progress':
        return 'bg-green-100 text-green-800';
      case 'Planned':
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleWhatsApp = (message: string) => {
    const clinicPhone = clinic?.contact_phone || '';
    const whatsappUrl = `https://wa.me/${clinicPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePatientWhatsApp = (message: string) => {
    // Use patient's phone number for direct contact
    const whatsappUrl = `https://wa.me/${patientPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCall = () => {
    const clinicPhone = clinic?.contact_phone || '';
    window.open(`tel:${clinicPhone}`, '_self');
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading your information...</p>
      </div>
    );
  }

  if (activeTreatments.length === 0 && appointments.length === 0 && dentalData.length === 0 && prescriptions.length === 0 && labWork.length === 0) {
    return null; // Don't show anything if no data
  }

  return (
    <div className="space-y-4">
      {/* All Treatments */}
      {activeTreatments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-4 h-4" />
              Treatment Plans
            </CardTitle>
            <CardDescription className="text-orange-700">
              Your dental treatment plans and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTreatments.map((treatment) => (
              <div key={treatment.id} className="bg-white rounded-lg p-3 border border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{treatment.treatment_name}</h3>
                    {treatment.treatment_description && (
                      <p className="text-xs text-gray-600 mt-1">{treatment.treatment_description}</p>
                    )}
                  </div>
                  <Badge className={`text-xs ${getTreatmentStatusColor(treatment.status)}`}>
                    {treatment.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePatientWhatsApp(`Hi, I have questions about my treatment: ${treatment.treatment_name}. Status: ${treatment.status}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    <WhatsAppIcon />
                    <span className="ml-1">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={handleCall}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
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
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {appointment.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePatientWhatsApp(`Hi, I have an appointment on ${formatDate(appointment.date)} at ${appointment.time}. I need to discuss this.`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    <WhatsAppIcon />
                    <span className="ml-1">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={handleCall}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dental Chart Data */}
      {dentalData.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-800">
              <Circle className="w-4 h-4" />
              Dental Health
            </CardTitle>
            <CardDescription className="text-green-700">
              Your dental treatments and conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dentalData.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{item.treatment_name || item.condition_name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.tooth_number ? `Tooth ${item.tooth_number}` : 'General'}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {item.treatment_name ? 'Treatment' : 'Condition'}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePatientWhatsApp(`Hi, I have questions about my dental ${item.treatment_name ? 'treatment' : 'condition'}: ${item.treatment_name || item.condition_name}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    <WhatsAppIcon />
                    <span className="ml-1">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={handleCall}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
            {dentalData.length > 3 && (
              <p className="text-xs text-green-600 text-center">
                +{dentalData.length - 3} more dental records
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lab Work */}
      {labWork.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
              <Activity className="w-4 h-4" />
              Lab Work
            </CardTitle>
            <CardDescription className="text-purple-700">
              Your lab work orders and results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {labWork.slice(0, 3).map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{order.test_name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Order: {order.order_number} • {order.lab_type}
                    </p>
                    {order.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Description:</strong> {order.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Ordered: {new Date(order.ordered_date).toLocaleDateString()}</span>
                      {order.expected_date && (
                        <span>Expected: {new Date(order.expected_date).toLocaleDateString()}</span>
                      )}
                      {order.cost && (
                        <span>Cost: ₹{order.cost}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs ${getLabWorkStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePatientWhatsApp(`Hi, I have questions about my lab work: ${order.test_name}. Order: ${order.order_number}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    <WhatsAppIcon />
                    <span className="ml-1">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={handleCall}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
            {labWork.length > 3 && (
              <p className="text-xs text-purple-600 text-center">
                +{labWork.length - 3} more lab work orders
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
              <Circle className="w-4 h-4" />
              Prescriptions
            </CardTitle>
            <CardDescription className="text-purple-700">
              Your medications and prescriptions (active and completed)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.slice(0, 3).map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{prescription.medication_name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                    </p>
                    {prescription.instructions && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Instructions:</strong> {prescription.instructions}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Dr. {prescription.prescribed_by}</span>
                      <span>Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs ${
                    prescription.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : prescription.status === 'Completed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {prescription.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePatientWhatsApp(`Hi, I have questions about my prescription: ${prescription.medication_name}. Dosage: ${prescription.dosage}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    <WhatsAppIcon />
                    <span className="ml-1">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={handleCall}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
            {prescriptions.length > 3 && (
              <p className="text-xs text-purple-600 text-center">
                +{prescriptions.length - 3} more prescriptions
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleActiveTreatments;
