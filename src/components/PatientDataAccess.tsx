/**
 * Patient Data Access Component
 * 
 * This component allows patients to access their medical data by entering their phone number.
 * Features:
 * - Phone number lookup
 * - Appointment history
 * - Doctor suggestions/recommendations
 * - Prescriptions
 * - Treatment plans
 * - Medical notes
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useClinic } from '@/contexts/ClinicContext';
import { patientApi, treatmentPlanApi, medicalRecordApi, patientUtils, Patient } from '@/lib/patient-management';
import { supabase } from '@/lib/supabase';
import ToothChart from './ToothChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Circle
} from 'lucide-react';

const PatientDataAccess = () => {
  const { clinic } = useClinic();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [showData, setShowData] = useState(false);
  const [showDentalChart, setShowDentalChart] = useState(false);

  // Handle phone number input
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  // Search for patient data
  const handleSearch = async () => {
    console.log('PatientDataAccess: Starting search for phone:', phone);
    console.log('PatientDataAccess: Clinic ID:', clinic?.id);
    
    if (!clinic?.id) {
      toast.error('Clinic information not available');
      return;
    }

    if (!patientUtils.validatePhone(phone)) {
      console.log('PatientDataAccess: Phone validation failed for:', phone);
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    console.log('PatientDataAccess: Phone validation passed, searching...');
    setIsLoading(true);
    try {
      // Get patient by phone number
      const patientData = await patientApi.getByPhone(phone, clinic.id);
      console.log('PatientDataAccess: Search result:', patientData);
      
      if (!patientData) {
        toast.error('No patient found with this phone number. Please contact the clinic to register.');
        return;
      }

      setPatient(patientData);
      console.log('PatientDataAccess: Patient set, loading related data...');

      try {
        // Get appointments
        console.log('PatientDataAccess: Loading appointments...');
        console.log('PatientDataAccess: Patient ID for appointments:', patientData.id);
        console.log('PatientDataAccess: Clinic ID for appointments:', clinic.id);
        
        try {
          // First try to find appointments by patient_id
          console.log('PatientDataAccess: Trying appointments by patient_id first...');
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientData.id)
            .eq('clinic_id', clinic.id)
            .order('date', { ascending: false });

          console.log('PatientDataAccess: Patient ID appointments result:', appointmentsData);
          console.log('PatientDataAccess: Patient ID appointments error:', appointmentsError);
          
          let finalAppointments = appointmentsData || [];
          
          // If no appointments found by patient_id, try by phone number
          if (!appointmentsData || appointmentsData.length === 0) {
            console.log('PatientDataAccess: No appointments by patient_id, trying by phone number...');
            const { data: phoneAppointments, error: phoneAppointmentsError } = await supabase
              .from('appointments')
              .select('*')
              .eq('phone', patientData.phone)
              .eq('clinic_id', clinic.id)
              .order('date', { ascending: false });
            
            console.log('PatientDataAccess: Phone-based appointments result:', phoneAppointments);
            console.log('PatientDataAccess: Phone-based appointments error:', phoneAppointmentsError);
            
            if (phoneAppointments && phoneAppointments.length > 0) {
              console.log('PatientDataAccess: Using phone-based appointments');
              finalAppointments = phoneAppointments;
            }
          } else {
            console.log('PatientDataAccess: Using patient_id based appointments');
          }
          
          setAppointments(finalAppointments);
        } catch (appointmentsException) {
          console.error('PatientDataAccess: Exception loading appointments:', appointmentsException);
          setAppointments([]);
        }

        // Get treatment plans
        console.log('PatientDataAccess: Loading treatment plans...');
        const treatmentPlansData = await treatmentPlanApi.getByPatient(patientData.id, clinic.id);
        console.log('PatientDataAccess: Treatment plans loaded:', treatmentPlansData);
        setTreatmentPlans(treatmentPlansData);

        // Get medical records
        console.log('PatientDataAccess: Loading medical records...');
        const medicalRecordsData = await medicalRecordApi.getByPatient(patientData.id, clinic.id);
        console.log('PatientDataAccess: Medical records loaded:', medicalRecordsData);
        setMedicalRecords(medicalRecordsData);

        setShowData(true);
        console.log('PatientDataAccess: All data loaded successfully');
        toast.success(`Welcome back, ${patientData.first_name}!`);
      } catch (relatedDataError) {
        console.error('PatientDataAccess: Error loading related data:', relatedDataError);
        // Still show patient data even if related data fails
        setShowData(true);
        toast.success(`Welcome back, ${patientData.first_name}!`);
        toast.error('Some data could not be loaded. Please try again.');
      }
      
    } catch (error) {
      console.error('Error searching patient:', error);
      toast.error('Failed to load patient data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear data and start over
  const handleClear = () => {
    setPatient(null);
    setAppointments([]);
    setTreatmentPlans([]);
    setMedicalRecords([]);
    setShowData(false);
    setPhone('');
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Section */}
      {!showData ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <User className="w-6 h-6 mr-2" />
              Access Your Medical Information
            </CardTitle>
            <CardDescription>
              Enter your phone number to view your appointments, treatments, and medical records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10"
                  maxLength={10}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                We'll show you all your medical information associated with this number
              </p>
            </div>
            
            <Button
              onClick={handleSearch}
              disabled={!patientUtils.validatePhone(phone) || isLoading}
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
                  View My Information
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Patient Data Display */
        <div className="space-y-6">
          {/* Patient Info Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    {patientUtils.formatName(patient!)}
                  </CardTitle>
                  <CardDescription>
                    Phone: {patient?.phone} • Age: {patient?.date_of_birth ? patientUtils.getAge(patient.date_of_birth) : 'N/A'} years
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleClear}>
                  Search Another Patient
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Data Tabs */}
          <Tabs defaultValue="appointments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appointments" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="treatments" className="flex items-center">
                <Stethoscope className="w-4 h-4 mr-2" />
                Treatments
              </TabsTrigger>
              <TabsTrigger value="dental" className="flex items-center">
                <Circle className="w-4 h-4 mr-2" />
                Dental Chart
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center">
                <Pill className="w-4 h-4 mr-2" />
                Prescriptions
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
                      <p className="text-sm text-gray-500 mt-2">Book your first appointment to get started</p>
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
                      <p className="text-sm text-gray-500 mt-2">Your treatment plans will appear here</p>
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

            {/* Dental Chart Tab */}
            <TabsContent value="dental">
              <ToothChart 
                patientId={patient!.id} 
                clinicId={clinic!.id}
                onTreatmentAdded={handleSearch}
                onConditionUpdated={handleSearch}
              />
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Prescriptions & Medications</CardTitle>
                  <CardDescription>
                    Your current medications and prescriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patient?.current_medications && patient.current_medications.length > 0 ? (
                    <div className="space-y-4">
                      {patient.current_medications.map((medication, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start">
                            <Pill className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                              <h3 className="font-semibold">{medication}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Current medication
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No current medications</p>
                      <p className="text-sm text-gray-500 mt-2">Your prescriptions will appear here</p>
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
                    Your medical history and doctor notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No medical records found</p>
                      <p className="text-sm text-gray-500 mt-2">Your medical records will appear here</p>
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
        </div>
      )}
    </div>
  );
};

export default PatientDataAccess;
