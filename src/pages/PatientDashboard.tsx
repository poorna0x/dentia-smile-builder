/**
 * Patient Dashboard
 * 
 * This page shows the patient's dashboard with:
 * - Personal information
 * - Appointment history
 * - Treatment plans
 * - Medical records
 * - Quick actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useClinic } from '@/contexts/ClinicContext';
import { patientApi, treatmentPlanApi, medicalRecordApi, patientUtils, Patient } from '@/lib/patient-management';
import { dentistsApi, Dentist, appointmentsApi } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  FileText, 
  Stethoscope, 
  LogOut, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LogoutButton from '@/components/LogoutButton';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // Get patient data from session storage
      const patientData = sessionStorage.getItem('patientData');
      if (!patientData) {
        navigate('/patient/login');
        return;
      }

      const patientInfo = JSON.parse(patientData);
      setPatient(patientInfo);

      if (clinic?.id) {
        // Load appointments
        const { data: appointmentsData } = await clinic.supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientInfo.id)
          .eq('clinic_id', clinic.id)
          .order('date', { ascending: false });

        setAppointments(appointmentsData || []);

        // Load treatment plans
        const treatmentPlansData = await treatmentPlanApi.getByPatient(patientInfo.id, clinic.id);
        setTreatmentPlans(treatmentPlansData);

        // Load medical records
        const medicalRecordsData = await medicalRecordApi.getByPatient(patientInfo.id, clinic.id);
        setMedicalRecords(medicalRecordsData);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('patientData');
    navigate('/patient/login');
    toast.success('Logged out successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    navigate('/patient/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {patient.first_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your appointments and medical records
            </p>
          </div>
          
          <LogoutButton />
        </div>

        {/* Patient Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg">{patientUtils.formatName(patient)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-lg flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {patient.phone}
                </p>
              </div>
              
              {patient.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {patient.email}
                  </p>
                </div>
              )}
              
              {patient.date_of_birth && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p className="text-lg">{patientUtils.getAge(patient.date_of_birth)} years</p>
                </div>
              )}
              
              {patient.address && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-lg flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {patient.address}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex items-center">
              <Stethoscope className="w-4 h-4 mr-2" />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Medical Records
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>
                  Your past and upcoming appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No appointments found</p>
                    <Button 
                      onClick={() => navigate('/appointment')}
                      className="mt-4"
                    >
                      Book an Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {formatDate(appointment.date)} at {appointment.time}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              Status: {appointment.status}
                            </p>
                          </div>
                          <Badge className={getAppointmentStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plans</CardTitle>
                <CardDescription>
                  Your current and completed treatments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {treatmentPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No treatment plans found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {treatmentPlans.map((plan) => (
                      <Card key={plan.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{plan.treatment_name}</h3>
                            {plan.treatment_description && (
                              <p className="text-gray-600 mt-1">{plan.treatment_description}</p>
                            )}
                            {plan.cost && (
                              <p className="text-gray-600 mt-1">Cost: ₹{plan.cost}</p>
                            )}
                          </div>
                          <Badge className={getTreatmentStatusColor(plan.status)}>
                            {plan.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Your medical history and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No medical records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalRecords.map((record) => (
                      <Card key={record.id} className="p-4">
                        <div>
                          <h3 className="font-semibold">{record.title}</h3>
                          <p className="text-gray-600 mt-1">
                            {formatDate(record.record_date)} • {record.record_type}
                          </p>
                          {record.description && (
                            <p className="text-gray-600 mt-2">{record.description}</p>
                          )}
                          {record.created_by && (
                            <p className="text-sm text-gray-500 mt-2">
                              By: {record.created_by}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate('/appointment')}
                className="h-16 text-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book New Appointment
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="h-16 text-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Contact Clinic
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default PatientDashboard;
