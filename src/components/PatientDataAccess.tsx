/**
 * Patient Data Access Component
 * 
 * Allows patients to access their medical information by phone number
 * Features:
 * - Phone number validation
 * - Patient search
 * - Multiple patient selection
 * - Appointment history
 * - Treatment plans
 * - Medical records
 * - Dental chart
 * - Prescriptions
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import SimpleActiveTreatments from './SimpleActiveTreatments';
import { toast } from 'sonner';

const PatientDataAccess = () => {
  const { clinic } = useClinic();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showData, setShowData] = useState(false);
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [multiplePatients, setMultiplePatients] = useState<any[]>([]);
  const [showPatientSelection, setShowPatientSelection] = useState(false);

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
      // Get all patients by phone number (handles multiple patients)
      const { data, error } = await supabase
        .rpc('get_patient_by_phone', {
          p_phone: phone,
          p_clinic_id: clinic.id
        });

      console.log('PatientDataAccess: Search result:', data);
      
      if (error) {
        console.error('PatientDataAccess: Search error:', error);
        toast.error('Error searching for patient');
        return;
      }

      if (!data || data.length === 0) {
        toast.error('No patient found with this phone number. Please contact the clinic to register.');
        return;
      }

      // If multiple patients found, show selection dialog
      if (data.length > 1) {
        console.log('PatientDataAccess: Multiple patients found:', data);
        setMultiplePatients(data);
        setShowPatientSelection(true);
        return;
      }

      // Single patient found, get full patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', data[0].patient_id)
        .single();

      if (patientError) {
        console.error('PatientDataAccess: Error getting patient data:', patientError);
        toast.error('Error retrieving patient data');
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
        try {
          const { data: treatmentsData, error: treatmentsError } = await supabase
            .from('treatment_plans')
            .select('*')
            .eq('patient_id', patientData.id)
            .eq('clinic_id', clinic.id)
            .order('created_at', { ascending: false });

          console.log('PatientDataAccess: Treatments result:', treatmentsData);
          console.log('PatientDataAccess: Treatments error:', treatmentsError);
          
          setTreatmentPlans(treatmentsData || []);
        } catch (treatmentsException) {
          console.error('PatientDataAccess: Exception loading treatments:', treatmentsException);
          setTreatmentPlans([]);
        }

        // Get medical records
        console.log('PatientDataAccess: Loading medical records...');
        try {
          const { data: recordsData, error: recordsError } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientData.id)
            .eq('clinic_id', clinic.id)
            .order('created_at', { ascending: false });

          console.log('PatientDataAccess: Medical records result:', recordsData);
          console.log('PatientDataAccess: Medical records error:', recordsError);
          
          setMedicalRecords(recordsData || []);
        } catch (recordsException) {
          console.error('PatientDataAccess: Exception loading medical records:', recordsException);
          setMedicalRecords([]);
        }

        setShowData(true);
        console.log('PatientDataAccess: All data loaded successfully');
      } catch (dataException) {
        console.error('PatientDataAccess: Exception loading related data:', dataException);
        toast.error('Error loading patient data');
      }
    } catch (error) {
      console.error('PatientDataAccess: Error in handleSearch:', error);
      toast.error('Error searching for patient');
    } finally {
      setIsLoading(false);
    }
  };

  // Load patient data for selected patient
  const loadPatientData = async (patientData: Patient) => {
    try {
      // Get appointments
      console.log('PatientDataAccess: Loading appointments for patient:', patientData.id);
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientData.id)
        .eq('clinic_id', clinic?.id)
        .order('date', { ascending: false });

      console.log('PatientDataAccess: Appointments data:', appointmentsData);
      console.log('PatientDataAccess: Appointments error:', appointmentsError);
      setAppointments(appointmentsData || []);

      // Get treatment plans
      console.log('PatientDataAccess: Loading treatment plans for patient:', patientData.id);
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientData.id)
        .eq('clinic_id', clinic?.id)
        .order('created_at', { ascending: false });

      console.log('PatientDataAccess: Treatment plans data:', treatmentsData);
      console.log('PatientDataAccess: Treatment plans error:', treatmentsError);
      setTreatmentPlans(treatmentsData || []);

      // Get medical records
      console.log('PatientDataAccess: Loading medical records for patient:', patientData.id);
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientData.id)
        .eq('clinic_id', clinic?.id)
        .order('created_at', { ascending: false });

      console.log('PatientDataAccess: Medical records data:', recordsData);
      console.log('PatientDataAccess: Medical records error:', recordsError);
      setMedicalRecords(recordsData || []);

      // Get prescriptions (complete history including all statuses)
      console.log('PatientDataAccess: Fetching prescriptions for patient:', patientData.id);
      console.log('PatientDataAccess: Clinic ID:', clinic?.id);
      
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientData.id)
        .eq('clinic_id', clinic?.id)
        .in('status', ['Active', 'Completed', 'Discontinued', 'On Hold'])
        .order('prescribed_date', { ascending: false });

      console.log('PatientDataAccess: Prescriptions data:', prescriptionsData);
      console.log('PatientDataAccess: Prescriptions error:', prescriptionsError);
      
      setPrescriptions(prescriptionsData || []);
      setShowData(true);
    } catch (error) {
      console.error('PatientDataAccess: Error loading patient data:', error);
      toast.error('Error loading patient data');
    }
  };

  // Clear data and start over
  const handleClear = () => {
    setPatient(null);
    setAppointments([]);
    setTreatmentPlans([]);
    setMedicalRecords([]);
    setPrescriptions([]);
    setShowData(false);
    setPhone('');
    setMultiplePatients([]);
    setShowPatientSelection(false);
  };

  const handlePatientSelection = async (selectedPatient: any) => {
    try {
      console.log('PatientDataAccess: Selected patient from dialog:', selectedPatient);
      
      // Get full patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatient.patient_id)
        .single();

      if (patientError) {
        console.error('PatientDataAccess: Error getting patient data:', patientError);
        toast.error('Error retrieving patient data');
        return;
      }

      console.log('PatientDataAccess: Full patient data loaded:', patientData);
      setPatient(patientData);
      setShowPatientSelection(false);
      setMultiplePatients([]);

      // Load related data for selected patient
      await loadPatientData(patientData);
    } catch (error) {
      console.error('PatientDataAccess: Error selecting patient:', error);
      toast.error('Error selecting patient');
    }
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
        <div className="space-y-4">
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

          {/* Patient Selection Dialog */}
          {showPatientSelection && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">
                  Multiple Patients Found
                </CardTitle>
                <CardDescription className="text-blue-700">
                  We found multiple patients with this phone number. Please select the correct one:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {multiplePatients.map((patient, index) => (
                    <div
                      key={patient.patient_id}
                      className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => handlePatientSelection(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {patient.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Phone: {phone} • {patient.phone_count} phone number(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Click to select</p>
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPatientSelection(false);
                    setMultiplePatients([]);
                  }}
                  className="mt-4 w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
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

          {/* Active Treatments Display */}
          <SimpleActiveTreatments patientPhone={phone} />

          {/* Data Tabs */}
          <Tabs defaultValue="appointments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
              <TabsTrigger value="appointments" className="flex items-center text-xs md:text-sm">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Appointments</span>
                <span className="sm:hidden">Appts</span>
              </TabsTrigger>
              <TabsTrigger value="treatments" className="flex items-center text-xs md:text-sm">
                <Stethoscope className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Treatments</span>
                <span className="sm:hidden">Treat</span>
              </TabsTrigger>
              <TabsTrigger value="dental" className="flex items-center text-xs md:text-sm">
                <Circle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Dental Chart</span>
                <span className="sm:hidden">Dental</span>
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center text-xs md:text-sm">
                <Pill className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Prescriptions</span>
                <span className="sm:hidden">Meds</span>
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center text-xs md:text-sm">
                <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Medical History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Appointment History
                  </CardTitle>
                  <CardDescription>
                    Your past and upcoming appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No appointments found</p>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm md:text-base">{appointment.name}</h3>
                              <p className="text-xs md:text-sm text-gray-600">
                                {formatDate(appointment.date)} at {appointment.time}
                              </p>
                            </div>
                            <Badge className={`text-xs md:text-sm ${getAppointmentStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              {appointment.phone}
                            </span>
                            {appointment.email && (
                              <span className="flex items-center">
                                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                {appointment.email}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Treatments Tab */}
            <TabsContent value="treatments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Treatment Plans
                  </CardTitle>
                  <CardDescription>
                    Your dental treatment plans and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {treatmentPlans.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No treatment plans found</p>
                  ) : (
                    <div className="space-y-4">
                      {treatmentPlans.map((treatment) => (
                        <div key={treatment.id} className="border rounded-lg p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm md:text-base">{treatment.treatment_name}</h3>
                              {treatment.treatment_description && (
                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                  {treatment.treatment_description}
                                </p>
                              )}
                            </div>
                            <Badge className={`text-xs md:text-sm ${getTreatmentStatusColor(treatment.status)}`}>
                              {treatment.status}
                            </Badge>
                          </div>
                          <div className="text-xs md:text-sm text-gray-500">
                            <p>Created: {formatDate(treatment.created_at)}</p>
                            {treatment.notes && (
                              <p className="mt-2 text-gray-600">{treatment.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dental Chart Tab */}
            <TabsContent value="dental" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Circle className="w-5 h-5 mr-2" />
                    Dental Chart
                  </CardTitle>
                  <CardDescription>
                    Your dental health overview and treatment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    Dental chart functionality will be available soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="w-5 h-5 mr-2" />
                    Prescriptions
                  </CardTitle>
                  <CardDescription>
                    Your current medications and prescriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prescriptions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No prescriptions found</p>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{prescription.medication_name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                              </p>
                              {prescription.instructions && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Instructions:</strong> {prescription.instructions}
                                </p>
                              )}
                            </div>
                            <Badge className={`${
                              prescription.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : prescription.status === 'Completed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {prescription.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Prescribed by: Dr. {prescription.prescribed_by}</span>
                            <span>Date: {formatDate(prescription.prescribed_date)}</span>
                          </div>
                          {prescription.notes && (
                            <p className="text-sm text-gray-600 mt-2">{prescription.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medical Records Tab */}
            <TabsContent value="records" className="space-y-6">
              {/* Medical Records Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Medical Records
                  </CardTitle>
                  <CardDescription>
                    Your medical history and health records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalRecords.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No medical records found</p>
                  ) : (
                    <div className="space-y-4">
                      {medicalRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-3 md:p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm md:text-base">{record.title}</h3>
                              <p className="text-xs md:text-sm text-gray-600">
                                {record.record_type} • {formatDate(record.record_date)}
                              </p>
                            </div>
                          </div>
                          {record.description && (
                            <p className="text-xs md:text-sm text-gray-600 mt-2">{record.description}</p>
                          )}
                          {record.notes && (
                            <p className="text-xs md:text-sm text-gray-500 mt-2">{record.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescription History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="w-5 h-5 mr-2" />
                    Prescription History
                  </CardTitle>
                  <CardDescription>
                    Complete history of all your medications and prescriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prescriptions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No prescription history found</p>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base md:text-lg">{prescription.medication_name}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-600 mt-1">
                                <span className="flex items-center">
                                  <Pill className="w-3 h-3 mr-1" />
                                  {prescription.dosage}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span>{prescription.frequency}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{prescription.duration}</span>
                              </div>
                            </div>
                            <Badge className={`text-xs md:text-sm ${
                              prescription.status === 'Active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : prescription.status === 'Completed'
                                ? 'bg-gray-100 text-gray-800 border-gray-200'
                                : prescription.status === 'Discontinued'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                            }`}>
                              {prescription.status}
                            </Badge>
                          </div>
                          
                          {/* Instructions */}
                          {prescription.instructions && (
                            <div className="mb-3 p-2 md:p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs md:text-sm font-medium text-blue-800 mb-1">Instructions:</p>
                              <p className="text-xs md:text-sm text-blue-700">{prescription.instructions}</p>
                            </div>
                          )}

                          {/* Additional Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-600">
                                <span className="font-medium">Prescribed:</span> {formatDate(prescription.prescribed_date)}
                              </p>
                              {prescription.prescribed_by && (
                                <p className="text-gray-600">
                                  <span className="font-medium">By:</span> {prescription.prescribed_by}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              {prescription.refills_remaining > 0 && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Refills:</span> {prescription.refills_remaining} remaining
                                </p>
                              )}
                              {prescription.refill_quantity && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Refill Quantity:</span> {prescription.refill_quantity}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Notes and Side Effects */}
                          {(prescription.patient_notes || prescription.pharmacy_notes || prescription.side_effects || prescription.interactions) && (
                            <div className="mt-4 space-y-2 md:space-y-3">
                              {prescription.patient_notes && (
                                <div className="p-2 md:p-3 bg-yellow-50 rounded-lg">
                                  <p className="text-xs md:text-sm font-medium text-yellow-800 mb-1">Patient Notes:</p>
                                  <p className="text-xs md:text-sm text-yellow-700">{prescription.patient_notes}</p>
                                </div>
                              )}
                              
                              {prescription.pharmacy_notes && (
                                <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                                  <p className="text-xs md:text-sm font-medium text-green-800 mb-1">Pharmacy Notes:</p>
                                  <p className="text-xs md:text-sm text-green-700">{prescription.pharmacy_notes}</p>
                                </div>
                              )}
                              
                              {prescription.side_effects && (
                                <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
                                  <p className="text-xs md:text-sm font-medium text-orange-800 mb-1">Side Effects:</p>
                                  <p className="text-xs md:text-sm text-orange-700">{prescription.side_effects}</p>
                                </div>
                              )}
                              
                              {prescription.interactions && (
                                <div className="p-2 md:p-3 bg-red-50 rounded-lg">
                                  <p className="text-xs md:text-sm font-medium text-red-800 mb-1">Drug Interactions:</p>
                                  <p className="text-xs md:text-sm text-red-700">{prescription.interactions}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
