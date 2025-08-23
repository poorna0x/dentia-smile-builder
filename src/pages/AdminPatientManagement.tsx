import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { patientApi, treatmentPlanApi, medicalRecordApi } from '@/lib/patient-management';
import { dentalTreatmentApi, toothConditionApi, dentalNoteApi, toothChartUtils } from '@/lib/dental-treatments';
import { labWorkApi } from '@/lib/lab-work';
import { supabase } from '@/lib/supabase';
import ToothChart from '@/components/ToothChart';
import DentalTreatmentForm from '@/components/DentalTreatmentForm';
import { Plus, Search, Edit, Trash2, User, Calendar, FileText, Activity, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Circle, Phone, MessageCircle, Stethoscope, X, Pill } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: any;
  allergies: string[];
  current_medications: string[];
  notes: string;
  is_active: boolean;
  created_at: string;
}

interface TreatmentPlan {
  id: string;
  patient_id: string;
  treatment_name: string;
  treatment_description: string;
  treatment_type: string;
  status: 'Active' | 'Completed' | 'Cancelled' | 'On Hold';
  start_date: string;
  end_date: string;
  cost: number;
  notes: string;
  created_at: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description: string;
  file_url: string;
  record_date: string;
  created_by: string;
  notes: string;
  created_at: string;
}

export default function AdminPatientManagement() {
  const { clinic } = useClinic();
  const { toast } = useToast();
  
  // State for patients
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [showAllData, setShowAllData] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  
  // State for forms
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [duplicateType, setDuplicateType] = useState<'phone' | 'name' | 'both'>('phone');
  const [nameSimilarity, setNameSimilarity] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null);
  const [showMedicalRecordDialog, setShowMedicalRecordDialog] = useState(false);
  const [newMedicalRecordForm, setNewMedicalRecordForm] = useState({
    record_type: 'consultation',
    title: '',
    description: '',
    file_url: '',
    record_date: new Date().toISOString().split('T')[0],
    created_by: '',
    notes: ''
  });
  const [showLabWorkDialog, setShowLabWorkDialog] = useState(false);
  const [labWorkOrders, setLabWorkOrders] = useState<any[]>([]);
  const [showNewLabWorkForm, setShowNewLabWorkForm] = useState(false);
  const [labWorkForm, setLabWorkForm] = useState({
    lab_type: 'crown',
    test_name: '',
    description: '',
    expected_date: '',
    lab_facility: '',
    cost: '',
    notes: ''
  });
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [selectedLabOrder, setSelectedLabOrder] = useState<any>(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    new_status: '',
    notes: ''
  });
  const [medicalHistoryDentalTreatments, setMedicalHistoryDentalTreatments] = useState<any[]>([]);
  const [medicalHistoryAppointments, setMedicalHistoryAppointments] = useState<any[]>([]);
  const [medicalHistoryPrescriptions, setMedicalHistoryPrescriptions] = useState<any[]>([]);
  const [medicalHistoryRecords, setMedicalHistoryRecords] = useState<any[]>([]);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<Patient | null>(null);

  
  // Dental chart state
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [selectedPatientForDental, setSelectedPatientForDental] = useState<Patient | null>(null);
  const [dentalTreatments, setDentalTreatments] = useState<any[]>([]);
  const [toothConditions, setToothConditions] = useState<any[]>([]);
  const [dentalNotes, setDentalNotes] = useState<any[]>([]);
  const [loadingDentalData, setLoadingDentalData] = useState(false);
  const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'lab-orders'>('all');
  const [patientsWithAppointments, setPatientsWithAppointments] = useState<{[key: string]: any[]}>({});
  const [patientsWithLabOrders, setPatientsWithLabOrders] = useState<{[key: string]: any[]}>({});
  
  // Lab work form validation state
  const [labWorkFormErrors, setLabWorkFormErrors] = useState<{[key: string]: string}>({});
  
  // Form validation states
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Phone number formatting function
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      // Remove +91 prefix and return 10 digits
      return cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Remove leading 0 and return 10 digits
      return cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // Already 10 digits, return as is
      return cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // Handle +91 format without +
      return cleaned.substring(2);
    }
    
    // Return cleaned number (will be validated later)
    return cleaned;
  };

  // Phone number validation function
  const validatePhone = (phoneNumber: string): boolean => {
    // Format the phone number first
    const formatted = formatPhoneNumber(phoneNumber);
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (formatted.length === 10 && /^[6-9]\d{9}$/.test(formatted)) {
      return true;
    }
    
    // Also accept any 10-digit number for flexibility
    if (formatted.length === 10 && /^\d{10}$/.test(formatted)) {
      return true;
    }
    
    return false;
  };

  // Name formatting function
  const formatName = (name: string): string => {
    // Remove extra spaces and trim
    let formatted = name.trim().replace(/\s+/g, ' ');
    
    // Convert to title case (first letter of each word capitalized)
    formatted = formatted.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    
    // Ensure first letter of first and last name are capitalized
    const nameParts = formatted.split(' ');
    const capitalizedParts = nameParts.map(part => {
      if (part.length > 0) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part;
    });
    
    return capitalizedParts.join(' ');
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone input change with validation and formatting
  const handlePhoneChange = (value: string) => {
    setPatientForm({...patientForm, phone: value});
    
    if (!value.trim()) {
      setPhoneError('');
      return;
    }
    
    // Validate the formatted phone number
    if (!validatePhone(value)) {
      setPhoneError('Please enter a valid 10-digit phone number. Accepts: 9876543210, +91 9876543210, 09876543210');
    } else {
      setPhoneError('');
    }
  };

  // Handle email input change with validation
  const handleEmailChange = (value: string) => {
    setPatientForm({...patientForm, email: value});
    
    if (!value.trim()) {
      setEmailError('');
      return;
    }
    
    if (!validateEmail(value)) {
      setEmailError('Please enter a valid email address (e.g., user@example.com)');
    } else {
      setEmailError('');
    }
  };

  // Handle name input change with formatting
  const handleNameChange = (field: 'first_name' | 'last_name', value: string) => {
    setPatientForm({...patientForm, [field]: value});
  };

  // Calculate name similarity
  const calculateNameSimilarity = (name1: string, name2: string): number => {
    const clean1 = name1.toLowerCase().replace(/\s+/g, '');
    const clean2 = name2.toLowerCase().replace(/\s+/g, '');
    
    let commonChars = 0;
    const minLength = Math.min(clean1.length, clean2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (clean1[i] === clean2[i]) {
        commonChars++;
      }
    }
    
    return (commonChars / Math.max(clean1.length, clean2.length)) * 100;
  };

  // Check for duplicate patients with optimized logic
  const checkForDuplicates = async (): Promise<{ 
    patients: Patient[]; 
    type: 'phone' | 'name' | 'both' | null;
    similarity: number;
  }> => {
    if (!clinic?.id) return { patients: [], type: null, similarity: 0 };

    const formattedPhone = formatPhoneNumber(patientForm.phone.trim());
    const formattedFirstName = formatName(patientForm.first_name.trim());
    const formattedLastName = patientForm.last_name.trim() ? formatName(patientForm.last_name.trim()) : '';

    console.log('Checking for duplicates:');
    console.log('Formatted phone:', formattedPhone);
    console.log('Formatted first name:', formattedFirstName);
    console.log('Formatted last name:', formattedLastName);

    try {
      // Optimized query: Get all patients with same phone number
      const { data: phoneMatches, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('phone', formattedPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!phoneMatches || phoneMatches.length === 0) {
        console.log('No phone matches found');
        return { patients: [], type: null, similarity: 0 };
      }

      console.log('Phone matches found:', phoneMatches);

      // Check name similarity for each phone match
      let bestMatch: Patient | null = null;
      let bestSimilarity = 0;
      let matchType: 'phone' | 'name' | 'both' = 'phone';

      for (const patient of phoneMatches) {
        const existingFullName = `${patient.first_name} ${patient.last_name || ''}`.trim();
        const newFullName = `${formattedFirstName} ${formattedLastName}`.trim();
        
        // Calculate similarity
        const similarity = calculateNameSimilarity(existingFullName, newFullName);
        
        console.log(`Comparing: "${existingFullName}" vs "${newFullName}" = ${similarity}%`);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = patient;
          
          if (similarity > 80) {
            matchType = 'both';
          } else if (similarity > 30) {
            matchType = 'name';
          } else {
            matchType = 'phone';
          }
        }
      }

      console.log('Best match:', bestMatch, 'Similarity:', bestSimilarity, 'Type:', matchType);

      return { 
        patients: phoneMatches, 
        type: bestMatch ? matchType : null, 
        similarity: bestSimilarity 
      };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return { patients: [], type: null, similarity: 0 };
    }
  };

  // Handle duplicate dialog actions
  const handleDuplicateAction = async (action: 'link' | 'create' | 'cancel') => {
    setShowDuplicateDialog(false);
    
    if (action === 'cancel') {
      return;
    }
    
    if (action === 'link' && selectedPatient) {
      // Link to existing patient - you can add appointment/treatment here
      toast({
        title: "Patient Found",
        description: `Linking to existing patient: ${selectedPatient.first_name} ${selectedPatient.last_name || ''}`,
      });
      // Here you could redirect to add appointment/treatment for this patient
      return;
    }
    
    if (action === 'create') {
      // Create new patient despite duplicate
      await createNewPatient();
    }
  };

  // Create new patient function
  const createNewPatient = async () => {
    try {
      console.log('Component: Validation passed, preparing data');
      
      // Clean up the data before sending
      const cleanPatientData = {
        ...patientForm,
        first_name: formatName(patientForm.first_name.trim()),
        last_name: patientForm.last_name.trim() ? formatName(patientForm.last_name.trim()) : null,
        email: patientForm.email.trim() || null,
        phone: formatPhoneNumber(patientForm.phone.trim()),
        address: patientForm.address.trim() || null,
        notes: patientForm.notes.trim() || null,
        allergies: patientForm.allergies.filter(item => item.trim() !== ''),
        current_medications: patientForm.current_medications.filter(item => item.trim() !== '')
      };
      
      console.log('Component: Sending patient data:', cleanPatientData);
      console.log('Component: Clinic ID being used:', clinic.id);
      
      await patientApi.create(cleanPatientData, clinic.id);
      toast({
        title: "Success",
        description: "Patient added successfully"
      });
      setShowPatientForm(false);
      setPatientForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        medical_history: { conditions: [], surgeries: [] },
        allergies: [],
        current_medications: [],
        notes: ''
      });
      loadPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please check the form and try again.",
        variant: "destructive"
      });
    }
  };
  
  // Medication suggestions
  const commonAllergies = [
    'Penicillin', 'Aspirin', 'Ibuprofen', 'Latex', 'Sulfa drugs', 
    'Codeine', 'Tetracycline', 'Local anesthetics', 'None'
  ];
  
  const commonMedications = [
    'Blood pressure medication', 'Diabetes medication', 'Heart medication',
    'Thyroid medication', 'Asthma inhaler', 'Antidepressants',
    'Blood thinners', 'Cholesterol medication', 'None'
  ];
  
  // Dental chart functions
  const handleOpenDentalChart = async (patient: Patient) => {
    setSelectedPatientForDental(patient);
    setShowDentalChart(true);
    setLoadingDentalData(true);
    
    try {
      // Load dental data for the patient
      const [treatments, conditions, notes] = await Promise.all([
        dentalTreatmentApi.getByPatient(patient.id, clinic?.id || ''),
        toothConditionApi.getByPatient(patient.id, clinic?.id || ''),
        dentalNoteApi.getByPatient(patient.id, clinic?.id || '', true) // Include private notes for admin
      ]);
      
      setDentalTreatments(treatments);
      setToothConditions(conditions);
      setDentalNotes(notes);
    } catch (error) {
      console.error('Error loading dental data:', error);
      toast({
        title: "Error",
        description: "Failed to load dental data",
        variant: "destructive"
      });
    } finally {
      setLoadingDentalData(false);
    }
  };

  const handleDentalDataUpdated = async () => {
    if (selectedPatientForDental) {
      await handleOpenDentalChart(selectedPatientForDental);
    }
  };

  // Edit patient function
  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditMode(true);
    setPatientForm({
      first_name: patient.first_name,
      last_name: patient.last_name || '',
      email: patient.email || '',
      phone: patient.phone,
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      address: patient.address || '',
      medical_history: patient.medical_history || { conditions: [], surgeries: [] },
      allergies: patient.allergies || [],
      current_medications: patient.current_medications || [],
      notes: patient.notes || ''
    });
    setShowPatientForm(true);
  };

  // Delete patient function
  const handleDeletePatient = async () => {
    if (!clinic?.id || !patientToDelete) return;
    
    try {
      await patientApi.delete(patientToDelete.id, clinic.id);
      toast({
        title: "Success",
        description: "Patient deleted successfully"
      });
      setShowDeleteConfirmDialog(false);
      setPatientToDelete(null);
      setShowPatientForm(false);
      setIsEditMode(false);
      setEditingPatient(null);
      
      // Refresh the patient list
      if (filteredPatients.length > 0) {
        const updatedPatients = filteredPatients.filter(p => p.id !== patientToDelete.id);
        setFilteredPatients(updatedPatients);
        setDisplayedPatients(updatedPatients);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive"
      });
    }
  };

  // Update patient function
  const handleUpdatePatient = async () => {
    if (!clinic?.id || !editingPatient) return;
    
    // Validation
    if (!patientForm.first_name.trim()) {
      toast({
        title: "Error",
        description: "First name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!patientForm.phone.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive"
      });
      return;
    }
    
    // Phone number validation
    if (!validatePhone(patientForm.phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Email validation (if provided)
    if (patientForm.email && !validateEmail(patientForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Clean up the data before sending
      const cleanPatientData = {
        first_name: formatName(patientForm.first_name.trim()),
        last_name: patientForm.last_name.trim() ? formatName(patientForm.last_name.trim()) : null,
        email: patientForm.email.trim() || null,
        phone: formatPhoneNumber(patientForm.phone.trim()),
        date_of_birth: patientForm.date_of_birth || null,
        gender: patientForm.gender || null,
        address: patientForm.address.trim() || null,
        notes: patientForm.notes.trim() || null,
        allergies: patientForm.allergies.filter(item => item.trim() !== ''),
        current_medications: patientForm.current_medications.filter(item => item.trim() !== ''),
        medical_history: patientForm.medical_history
      };
      
      await patientApi.update(editingPatient.id, cleanPatientData, clinic.id);
      toast({
        title: "Success",
        description: "Patient updated successfully"
      });
      setShowPatientForm(false);
      setIsEditMode(false);
      setEditingPatient(null);
      setPatientForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        medical_history: { conditions: [], surgeries: [] },
        allergies: [],
        current_medications: [],
        notes: ''
      });
      // Refresh the current search/view
      if (searchTerm.trim()) {
        handleSearch();
      } else if (showAllData) {
        handlePageChange(currentPage);
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Call patient function
  const handleCallPatient = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // WhatsApp patient function
  const handleWhatsAppPatient = (phone: string) => {
    const cleanPhone = formatPhoneNumber(phone);
    const whatsappNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  // Medical history function
  const handleViewMedicalHistory = async (patient: Patient) => {
    setSelectedPatientHistory(patient);
    setShowMedicalHistory(true);
    
    // Load dental treatments for this patient
    try {
      const { data: dentalData } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinic?.id)
        .order('created_at', { ascending: false });
      
      setMedicalHistoryDentalTreatments(dentalData || []);
      
      // Load appointments for this patient
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinic?.id)
        .order('date', { ascending: false });
      
      setMedicalHistoryAppointments(appointmentsData || []);
      
      // Load prescriptions for this patient
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinic?.id)
        .order('created_at', { ascending: false });
      
      setMedicalHistoryPrescriptions(prescriptionsData || []);
      
      // Load medical records for this patient
      const { data: medicalRecordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinic?.id)
        .order('record_date', { ascending: false });
      
      setMedicalHistoryRecords(medicalRecordsData || []);
      
      console.log('Medical History Data Loaded:', {
        patientId: patient.id,
        clinicId: clinic?.id,
        dentalTreatments: dentalData?.length || 0,
        appointments: appointmentsData?.length || 0,
        prescriptions: prescriptionsData?.length || 0,
        medicalRecords: medicalRecordsData?.length || 0
      });
    } catch (error) {
      console.error('Error loading medical history data:', error);
    }
  };

  // New appointment function - redirect to appointment page with pre-filled data
  const handleNewAppointment = (patient: Patient) => {
    // Redirect to appointment page with patient data as URL parameters
    const patientData = encodeURIComponent(JSON.stringify({
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
      phone: patient.phone,
      email: patient.email || '',
      allergies: patient.allergies || []
    }));
    
    // Navigate to appointment page with pre-filled patient data
    window.location.href = `/appointment?clinic=${clinic?.slug || 'default'}&patient=${patientData}`;
  };



  // Lab work function
  const handleLabWork = (patient: Patient) => {
    setSelectedPatientHistory(patient);
    setShowLabWorkDialog(true);
    loadLabWorkData(patient.id);
  };

  // Load lab work data for a patient
  const loadLabWorkData = async (patientId: string) => {
    if (!clinic?.id) return;
    
    try {
      const labWorkData = await labWorkApi.getByPatient(patientId, clinic.id);
      setLabWorkOrders(labWorkData);
    } catch (error) {
      console.error('Error loading lab work data:', error);
      // If lab work table doesn't exist yet, show empty array
      setLabWorkOrders([]);
    }
  };

  // Handle status update
  const handleStatusUpdate = (order: any) => {
    console.log('handleStatusUpdate called with order:', order);
    setSelectedLabOrder(order);
    setStatusUpdateForm({
      new_status: order.status,
      notes: ''
    });
    setShowStatusUpdateDialog(true);
    console.log('Dialog should be opening now');
  };

  // Save status update
  const handleSaveStatusUpdate = async () => {
    if (!selectedLabOrder || !clinic?.id) {
      return;
    }
    
    try {
      await labWorkApi.update(selectedLabOrder.id, {
        status: statusUpdateForm.new_status,
        notes: statusUpdateForm.notes || undefined
      });
      
      toast({
        title: "Status Updated",
        description: "Lab work status has been updated successfully.",
      });
      
      setShowStatusUpdateDialog(false);
      loadLabWorkData(selectedLabOrder.patient_id);
    } catch (error) {
      console.error('Error updating lab work status:', error);
      toast({
        title: "Error",
        description: "Failed to update lab work status.",
        variant: "destructive",
      });
    }
  };

  // Validate lab work form
  const validateLabWorkForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Lab type is compulsory
    if (!labWorkForm.lab_type.trim()) {
      errors.lab_type = 'Lab type is required';
    }
    
    setLabWorkFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save lab work order
  const handleSaveLabWorkOrder = async () => {
    if (!selectedPatientHistory?.id || !clinic?.id) return;
    
    // Validate form
    if (!validateLabWorkForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await labWorkApi.create({
        patient_id: selectedPatientHistory.id,
        lab_name: labWorkForm.lab_facility || 'Dental Lab Pro',
        work_type: labWorkForm.lab_type,
        description: labWorkForm.description || undefined,
        expected_completion_date: labWorkForm.expected_date || undefined,
        cost: labWorkForm.cost ? parseFloat(labWorkForm.cost) : undefined,
        notes: labWorkForm.notes || undefined,
        created_by: 'Admin'
      }, clinic.id);
      
      toast({
        title: "Lab Work Order Created",
        description: "Lab work order has been created successfully.",
      });
      
      setShowNewLabWorkForm(false);
      setLabWorkForm({
        lab_type: 'crown',
        test_name: '',
        description: '',
        expected_date: '',
        lab_facility: '',
        cost: '',
        notes: ''
      });
      setLabWorkFormErrors({});
      loadLabWorkData(selectedPatientHistory.id);
    } catch (error) {
      console.error('Error creating lab work order:', error);
      toast({
        title: "Error",
        description: "Failed to create lab work order.",
        variant: "destructive",
      });
    }
  };



  // Add prescription function
  const handleAddPrescription = (patient: Patient) => {
    setSelectedPatientForPrescription(patient);
    setPrescriptionForm({
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      pharmacy_notes: '',
      patient_notes: '',
      side_effects: '',
      interactions: ''
    });
    setMultipleMedications([
      {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
    setShowPrescriptionDialog(true);
  };

  // Add another medication
  const addAnotherMedication = () => {
    setMultipleMedications([
      ...multipleMedications,
      {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  // Remove medication
  const removeMedication = (index: number) => {
    if (multipleMedications.length > 1) {
      setMultipleMedications(multipleMedications.filter((_, i) => i !== index));
    }
  };

  // Update medication
  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...multipleMedications];
    updated[index] = { ...updated[index], [field]: value };
    setMultipleMedications(updated);
  };

  // Save prescription function
  const handleSavePrescription = async () => {
    // Prevent double-click using both state and ref
    if (isSavingPrescription || isSavingRef.current) {
      console.log('Save already in progress, ignoring click');
      console.log('isSavingPrescription:', isSavingPrescription);
      console.log('isSavingRef.current:', isSavingRef.current);
      return;
    }

    console.log('handleSavePrescription called');
    console.log('multipleMedications count:', multipleMedications.length);
    console.log('selectedPatientForPrescription:', selectedPatientForPrescription);
    console.log('clinic?.id:', clinic?.id);
    console.log('multipleMedications:', multipleMedications);

    if (!selectedPatientForPrescription || !clinic?.id) {
      toast({
        title: "Error",
        description: "Patient or clinic information missing",
        variant: "destructive",
      });
      setIsSavingPrescription(false);
      return;
    }

    // Set loading state
    setIsSavingPrescription(true);
    isSavingRef.current = true;

    // Validate all medications (dosage is optional)
    const errors = [];
    multipleMedications.forEach((med, index) => {
      if (!med.medication_name.trim()) {
        errors.push(`Medication ${index + 1}: Name`);
      }
      if (!med.frequency.trim()) {
        errors.push(`Medication ${index + 1}: Frequency`);
      }
      if (!med.duration.trim()) {
        errors.push(`Medication ${index + 1}: Duration`);
      }
      // Dosage is optional, so no validation needed
    });

    if (errors.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${errors.join(', ')}`,
        variant: "destructive",
      });
      setIsSavingPrescription(false);
      return;
    }

    try {
      console.log('Starting to save medications...');
      
      // Save each medication
      for (const medication of multipleMedications) {
        console.log('Saving medication:', medication);
        
        // Use direct insert (simpler and more reliable)
        console.log('Using direct insert...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('prescriptions')
          .insert({
            clinic_id: clinic.id,
            patient_id: selectedPatientForPrescription.id,
            medication_name: medication.medication_name.trim(),
            dosage: medication.dosage.trim() || 'Not specified',
            frequency: medication.frequency.trim(),
            duration: medication.duration.trim(),
            instructions: medication.instructions.trim() || '',
            status: 'Active',
            refills_remaining: 0,
            refill_quantity: null,
            pharmacy_notes: prescriptionForm.pharmacy_notes.trim() || null,
            patient_notes: prescriptionForm.patient_notes.trim() || null,
            side_effects: prescriptionForm.side_effects.trim() || null,
            interactions: prescriptionForm.interactions.trim() || null
          })
          .select()
          .single();

        console.log('Direct insert response:', { insertData, insertError });
        console.log('Direct insert error details:', insertError);
        console.log('Full error object:', JSON.stringify(insertError, null, 2));
        console.log('Error message:', insertError?.message);
        console.log('Error code:', insertError?.code);
        console.log('Error details:', insertError?.details);

        if (insertError) {
          console.error('Direct insert failed:', insertError);
          throw insertError;
        }
        
        data = insertData;
        error = null;

        if (error) {
          console.error('Database error:', error);
          throw error;
        }
      }

      console.log('All medications saved successfully');

      // Close dialog first
      console.log('Closing prescription dialog...');
      console.log('Current dialog state:', showPrescriptionDialog);
      
      // Use state update function to ensure it closes
      setShowPrescriptionDialog((prev) => {
        console.log('Setting dialog state from', prev, 'to false');
        return false;
      });
      
      console.log('Dialog state set to false');
      
      // Force a re-render by updating state
      setTimeout(() => {
        console.log('Checking dialog state after timeout:', showPrescriptionDialog);
        setShowPrescriptionDialog((prev) => {
          if (prev) {
            console.log('Dialog still open, forcing close...');
            return false;
          }
          return prev;
        });
      }, 50);
      
      // Clear form data
      setPrescriptionForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        pharmacy_notes: '',
        patient_notes: '',
        side_effects: '',
        interactions: ''
      });
      setMultipleMedications([
        {
          medication_name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: ''
        }
      ]);

      // Show success message after a small delay to ensure dialog closes
      setTimeout(() => {
        toast({
          title: "Success",
          description: `${multipleMedications.length} prescription(s) added successfully`,
        });
        console.log('Success toast shown, dialog should be closed');
      }, 100);
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: `Failed to save prescription: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      // Reset loading state
      setIsSavingPrescription(false);
      isSavingRef.current = false;
    }
  };

  // Form data
  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: { conditions: [], surgeries: [] },
    allergies: [],
    current_medications: [],
    notes: ''
  });
  
  const [treatmentForm, setTreatmentForm] = useState({
    patient_id: '',
    treatment_name: '',
    treatment_description: '',
    treatment_type: '',
    status: 'Active' as const,
    start_date: '',
    end_date: '',
    cost: 0,
    notes: ''
  });
  
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    patient_id: '',
    record_type: '',
    title: '',
    description: '',
    file_url: '',
    record_date: '',
    created_by: '',
    notes: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    pharmacy_notes: '',
    patient_notes: '',
    side_effects: '',
    interactions: ''
  });

  // Multiple medications support
  const [multipleMedications, setMultipleMedications] = useState([
    {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
  ]);

  // Loading state for prescription save
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const isSavingRef = useRef(false);

  // Common dental medications for suggestions
  const commonDentalMedications = [
    'Amoxicillin',
    'Ibuprofen',
    'Paracetamol',
    'Chlorhexidine Mouthwash',
    'Metronidazole',
    'Diclofenac',
    'Ciprofloxacin',
    'Clindamycin',
    'Azithromycin',
    'Doxycycline',
    'Penicillin V',
    'Erythromycin',
    'Cephalexin',
    'Fluconazole',
    'Nystatin',
    'Lidocaine Gel',
    'Benzocaine Gel',
    'Orajel',
    'Anbesol',
    'Salt Water Rinse'
  ];

  // Common dosages for suggestions
  const commonDosages = [
    '250mg',
    '500mg',
    '750mg',
    '1000mg',
    '0.12%',
    '0.2%',
    '5ml',
    '10ml',
    '15ml',
    '20ml'
  ];

  // Common frequencies for suggestions
  const commonFrequencies = [
    'Once daily',
    'Twice daily',
    '3 times daily',
    '4 times daily',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals'
  ];

  // Common durations for suggestions
  const commonDurations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '21 days',
    '30 days',
    'Until finished',
    'As needed'
  ];

  // Common instructions for suggestions
  const commonInstructions = [
    'Take with food',
    'Take on empty stomach',
    'Take before meals',
    'Take after meals',
    'Take with plenty of water',
    'Do not take with dairy products',
    'Complete the full course',
    'Do not stop early',
    'Take at the same time daily',
    'Store in refrigerator',
    'Shake well before use',
    'Rinse mouth after use',
    'Avoid alcohol while taking',
    'Take with or without food',
    'Take 1 hour before or 2 hours after meals'
  ];

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;

  // Update displayed patients based on pagination and show all setting
  useEffect(() => {
    if (showAllData) {
      // Show first 50 patients with pagination controls
      setDisplayedPatients(filteredPatients.slice(startIndex, endIndex));
    } else {
      // Show all patients without pagination controls
      setDisplayedPatients(filteredPatients);
    }
  }, [filteredPatients, currentPage, showAllData, startIndex, endIndex]);

  // Load patients on component mount - but don't auto-load data
  useEffect(() => {
    console.log('Component: Clinic context changed:', clinic);
    if (clinic?.id) {
      console.log('Component: Ready to search patients for clinic:', clinic.id);
    } else {
      console.log('Component: No clinic ID available');
    }
  }, [clinic?.id]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  const loadPatients = async () => {
    if (!clinic?.id) return;
    
    setLoading(true);
    try {
      const data = await patientApi.getAll(clinic.id);
      setPatients(data);
      setFilteredPatients(data);
      setTotalPatients(data.length);
      setDataLoaded(true);
      toast({
        title: "Success",
        description: `Loaded ${data.length} patients`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!clinic?.id) {
      toast({
        title: "Error",
        description: "Clinic information not available",
        variant: "destructive"
      });
      return;
    }
    
    if (searchTerm.trim() === '') {
      toast({
        title: "Search",
        description: "Please enter a search term",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Use database search instead of loading all patients
      const results = await patientApi.searchPatients(clinic.id, searchTerm, 50);
      setSearchResults(results);
      setShowSearchResults(true);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: `No patients found matching "${searchTerm}"`,
        });
      } else if (results.length === 1) {
        // Auto-select if only one result
        handleSelectSearchResult(results[0]);
      } else {
        toast({
          title: "Multiple Results",
          description: `Found ${results.length} patients. Please select one from the list.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (patient: Patient) => {
    setFilteredPatients([patient]);
    setDisplayedPatients([patient]);
    setShowAllData(false);
    setCurrentPage(1);
    setShowSearchResults(false);
    setSearchResults([]);
    
    toast({
      title: "Patient Selected",
      description: `Showing details for ${patient.first_name} ${patient.last_name || ''}`,
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredPatients([]);
    setDisplayedPatients([]);
    setDataLoaded(false);
    setShowSearchResults(false);
    setSearchResults([]);
    setActiveFilter('all');
  };

  // Handle filter for in-progress treatments
  const handleInProgressFilter = async () => {
    setLoading(true);
    setActiveFilter('in-progress');
    try {
      // Get patients with in-progress treatments
      const { data: treatments } = await supabase
        .from('dental_treatments')
        .select(`
          patient_id,
          patients!inner(
            id,
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            allergies
          )
        `)
        .eq('clinic_id', clinic!.id)
        .eq('treatment_status', 'In Progress');

      if (treatments && treatments.length > 0) {
        const uniquePatients = treatments.map(t => t.patients).filter((patient, index, self) => 
          index === self.findIndex(p => p.id === patient.id)
        );
        setFilteredPatients(uniquePatients);
        setDisplayedPatients(uniquePatients);
        setDataLoaded(true);
        
        toast({
          title: "In Progress Patients",
          description: `Showing ${uniquePatients.length} patients with active treatments`,
        });
      } else {
        setFilteredPatients([]);
        setDisplayedPatients([]);
        setDataLoaded(true);
        toast({
          title: "No Active Patients",
          description: "No patients with in-progress treatments found",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load in-progress patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter for lab orders
  const handleLabOrdersFilter = async () => {
    setLoading(true);
    setActiveFilter('lab-orders');
    try {
      // Get patients with lab orders (we'll create this table later)
      const { data: labOrders } = await supabase
        .from('lab_work')
        .select(`
          patient_id,
          patients!inner(
            id,
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            allergies
          )
        `)
        .eq('clinic_id', clinic!.id)
        .in('status', ['Ordered', 'In Progress', 'Quality Check']);

      if (labOrders && labOrders.length > 0) {
        const uniquePatients = labOrders.map(l => l.patients).filter((patient, index, self) => 
          index === self.findIndex(p => p.id === patient.id)
        );
        setFilteredPatients(uniquePatients);
        setDisplayedPatients(uniquePatients);
        setDataLoaded(true);
        
        toast({
          title: "Lab Orders Patients",
          description: `Showing ${uniquePatients.length} patients with lab orders`,
        });
      } else {
        setFilteredPatients([]);
        setDisplayedPatients([]);
        setDataLoaded(true);
        toast({
          title: "No Lab Orders",
          description: "No patients with lab orders found",
        });
      }
    } catch (error) {
      // If lab_work table doesn't exist yet, show a message
      setFilteredPatients([]);
      setDisplayedPatients([]);
      setDataLoaded(true);
      toast({
        title: "Lab Orders Feature",
        description: "Lab orders functionality will be available soon",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load upcoming appointments for patients
  const loadUpcomingAppointments = async (patientIds: string[]) => {
    if (!clinic?.id || patientIds.length === 0) return;
    
    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinic.id)
        .in('patient_id', patientIds)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (appointments) {
        const appointmentsByPatient: {[key: string]: any[]} = {};
        appointments.forEach(appointment => {
          if (!appointmentsByPatient[appointment.patient_id]) {
            appointmentsByPatient[appointment.patient_id] = [];
          }
          appointmentsByPatient[appointment.patient_id].push(appointment);
        });
        setPatientsWithAppointments(appointmentsByPatient);
      }
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    }
  };

  // Load appointments when patients are loaded
  useEffect(() => {
    if (filteredPatients.length > 0) {
      const patientIds = filteredPatients.map(p => p.id);
      loadUpcomingAppointments(patientIds);
    }
  }, [filteredPatients]);

  const handleShowAll = () => {
    setShowConfirmDialog(true);
  };

  const confirmShowAll = async () => {
    setShowConfirmDialog(false);
    
    setLoading(true);
    try {
      // Load first page of all patients with pagination
      const { data, total } = await patientApi.getAllWithPagination(clinic!.id, 1, 50);
      setFilteredPatients(data);
      setDisplayedPatients(data);
      setTotalPatients(total);
      setShowAllData(true);
      setCurrentPage(1);
      setDataLoaded(true);
      
      toast({
        title: "All Database Patients",
        description: `Showing first 50 of ${total} patients. Use pagination to see more.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowPaginated = () => {
    setShowAllData(false);
    setCurrentPage(1);
    
    // Restore search results if there was a search
    if (searchTerm.trim() !== '') {
      setDisplayedPatients(filteredPatients);
      toast({
        title: "Search Results",
        description: `Showing ${filteredPatients.length} patients from search`,
      });
    } else {
      setFilteredPatients([]);
      setDisplayedPatients([]);
      toast({
        title: "No Data",
        description: "Please search for patients or click 'Show All' to view all patients",
      });
    }
  };

  const handlePageChange = async (page: number) => {
    if (!clinic?.id || !showAllData) {
      setCurrentPage(page);
      return;
    }
    
    setLoading(true);
    try {
      const { data, total } = await patientApi.getAllWithPagination(clinic.id, page, 50);
      setFilteredPatients(data);
      setDisplayedPatients(data);
      setCurrentPage(page);
      setTotalPatients(total);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async () => {
    console.log('Component: Starting to add patient');
    console.log('Component: Clinic object:', clinic);
    console.log('Component: Clinic ID:', clinic?.id);
    
    if (!clinic?.id) {
      console.error('Component: No clinic ID available');
      toast({
        title: "Error",
        description: "Clinic information not available. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    // Validation
    if (!patientForm.first_name.trim()) {
      toast({
        title: "Error",
        description: "First name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!patientForm.phone.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive"
      });
      return;
    }
    
    // Phone number validation
    if (!validatePhone(patientForm.phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Email validation (if provided)
    if (patientForm.email && !validateEmail(patientForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicates
    console.log('Starting duplicate check...');
    const duplicateCheck = await checkForDuplicates();
    console.log('Duplicate check result:', duplicateCheck);
    
    if (duplicateCheck.patients.length > 0) {
      console.log('Duplicate found, showing dialog');
      // Show duplicate dialog
      setExistingPatients(duplicateCheck.patients);
      setDuplicateType(duplicateCheck.type || 'phone');
      setNameSimilarity(duplicateCheck.similarity);
      setSelectedPatient(duplicateCheck.patients[0]); // Auto-select most recent
      setShowDuplicateDialog(true);
      return;
    }
    
    console.log('No duplicates found, creating new patient');
    // No duplicates found, create new patient
    await createNewPatient();
  };

  const handleAddTreatment = async () => {
    if (!clinic?.id) return;
    
    try {
      await treatmentPlanApi.create(clinic.id, treatmentForm);
      toast({
        title: "Success",
        description: "Treatment plan added successfully"
      });
      setShowTreatmentForm(false);
      setTreatmentForm({
        patient_id: '',
        treatment_name: '',
        treatment_description: '',
        treatment_type: '',
        status: 'Active',
        start_date: '',
        end_date: '',
        cost: 0,
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add treatment plan",
        variant: "destructive"
      });
    }
  };

  const handleAddMedicalRecord = (patient: Patient) => {
    setSelectedPatientHistory(patient);
    setNewMedicalRecordForm({
      record_type: 'consultation',
      title: '',
      description: '',
      file_url: '',
      record_date: new Date().toISOString().split('T')[0],
      created_by: '',
      notes: ''
    });
    setShowMedicalRecordDialog(true);
  };

  const handleSaveMedicalRecord = async () => {
    if (!clinic?.id || !selectedPatientHistory?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          clinic_id: clinic.id,
          patient_id: selectedPatientHistory.id,
          record_type: newMedicalRecordForm.record_type,
          title: newMedicalRecordForm.title,
          description: newMedicalRecordForm.description,
          file_url: newMedicalRecordForm.file_url || null,
          record_date: newMedicalRecordForm.record_date,
          created_by: newMedicalRecordForm.created_by,
          notes: newMedicalRecordForm.notes
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medical record added successfully"
      });
      
      setShowMedicalRecordDialog(false);
      setNewMedicalRecordForm({
        record_type: 'consultation',
        title: '',
        description: '',
        file_url: '',
        record_date: new Date().toISOString().split('T')[0],
        created_by: '',
        notes: ''
      });
      
      // Refresh medical history data
      if (showMedicalHistory) {
        handleViewMedicalHistory(selectedPatientHistory);
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast({
        title: "Error",
        description: "Failed to add medical record",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle edit treatment
  const handleEditTreatment = (treatment: any) => {
    setEditingTreatment(treatment);
    setShowEditTreatmentDialog(true);
  };

  // Handle treatment updated
  const handleTreatmentUpdated = async () => {
    setShowEditTreatmentDialog(false);
    setEditingTreatment(null);
    // Refresh dental treatments data
    if (selectedPatientForDental) {
      await loadDentalData(selectedPatientForDental.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      case 'Planned': return 'bg-purple-100 text-purple-800';
      case 'Scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Postponed': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Patient Management</h1>
          <p className="text-gray-600">Manage patients, treatments, and medical records</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-80 search-container" autoComplete="off">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    name="search"
                    id="patient-search"
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSearchResults(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => handleSelectSearchResult(patient)}
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {patient.first_name} {patient.last_name || ''}
                                </div>
                                <div className="text-sm text-gray-600">
                                  📱 {patient.phone}
                                  {patient.email && ` • 📧 ${patient.email}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {patient.date_of_birth ? `Age: ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : 'Age: Not specified'}
                                  {patient.allergies?.length > 0 && ` • Allergies: ${patient.allergies.join(', ')}`}
                                </div>
                              </div>
                              <div className="ml-3 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCallPatient(patient.phone);
                                  }}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  title="Call"
                                >
                                  <Phone className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsAppPatient(patient.phone);
                                  }}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  title="WhatsApp"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSearch}
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </Button>
                <Button 
                  onClick={handleClearSearch}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleInProgressFilter}
                  variant={activeFilter === 'in-progress' ? 'default' : 'outline'}
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading && activeFilter === 'in-progress' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  In Progress
                </Button>
                <Button 
                  onClick={handleLabOrdersFilter}
                  variant={activeFilter === 'lab-orders' ? 'default' : 'outline'}
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading && activeFilter === 'lab-orders' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Stethoscope className="w-4 h-4" />
                  )}
                  Lab Orders
                </Button>


            </div>
            <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? 'Update patient information below' : 'Enter patient information below'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={patientForm.first_name}
                      onChange={(e) => handleNameChange('first_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={patientForm.last_name}
                      onChange={(e) => handleNameChange('last_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210, +91 9876543210, or 09876543210"
                      value={patientForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                    />
                    {phoneError && (
                      <div className="text-sm text-red-600 mt-1">
                        {phoneError}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={patientForm.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                    />
                    {emailError && (
                      <div className="text-sm text-red-600 mt-1">
                        {emailError}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={patientForm.date_of_birth}
                      onChange={(e) => setPatientForm({...patientForm, date_of_birth: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={patientForm.gender} onValueChange={(value) => setPatientForm({...patientForm, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="allergies">Allergies (Select from common or add custom)</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {commonAllergies.map((allergy) => (
                          <Button
                            key={allergy}
                            type="button"
                            variant={patientForm.allergies.includes(allergy) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newAllergies = patientForm.allergies.includes(allergy)
                                ? patientForm.allergies.filter(a => a !== allergy)
                                : [...patientForm.allergies, allergy];
                              setPatientForm({...patientForm, allergies: newAllergies});
                            }}
                          >
                            {allergy}
                          </Button>
                        ))}
                      </div>
                      <Input
                        placeholder="Add custom allergy..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const newAllergy = e.currentTarget.value.trim();
                            if (!patientForm.allergies.includes(newAllergy)) {
                              setPatientForm({
                                ...patientForm, 
                                allergies: [...patientForm.allergies, newAllergy]
                              });
                            }
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="medications">Current Medications (Select from common or add custom)</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {commonMedications.map((medication) => (
                          <Button
                            key={medication}
                            type="button"
                            variant={patientForm.current_medications.includes(medication) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newMedications = patientForm.current_medications.includes(medication)
                                ? patientForm.current_medications.filter(m => m !== medication)
                                : [...patientForm.current_medications, medication];
                              setPatientForm({...patientForm, current_medications: newMedications});
                            }}
                          >
                            {medication}
                          </Button>
                        ))}
                      </div>
                      <Input
                        placeholder="Add custom medication..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const newMedication = e.currentTarget.value.trim();
                            if (!patientForm.current_medications.includes(newMedication)) {
                              setPatientForm({
                                ...patientForm, 
                                current_medications: [...patientForm.current_medications, newMedication]
                              });
                            }
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={patientForm.notes}
                      onChange={(e) => setPatientForm({...patientForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <div>
                    {isEditMode && (
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          setPatientToDelete(editingPatient);
                          setShowDeleteConfirmDialog(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Patient
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowPatientForm(false);
                      setIsEditMode(false);
                      setEditingPatient(null);
                      setPatientForm({
                        first_name: '',
                        last_name: '',
                        email: '',
                        phone: '',
                        date_of_birth: '',
                        gender: '',
                        address: '',
                        medical_history: { conditions: [], surgeries: [] },
                        allergies: [],
                        current_medications: [],
                        notes: ''
                      });
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={isEditMode ? handleUpdatePatient : handleAddPatient}>
                      {isEditMode ? 'Update Patient' : 'Add Patient'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading patients...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedPatients.map((patient) => (
                <Card key={patient.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {patient.first_name} {patient.last_name || ''}
                        </CardTitle>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{patient.phone}</span>
                          </div>
                          {patient.email && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{patient.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Desktop: Show buttons in header */}
                      <div className="hidden sm:flex flex-col gap-2">
                        {/* Main action buttons - consistent styling */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPatient(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Edit Patient"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-sm font-medium">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDentalChart(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Dental Treatments"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span className="text-sm font-medium">Treatments</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNewAppointment(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Book Appointment"
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Appointment</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCallPatient(patient.phone)}
                            className="h-9 w-9 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200 rounded-lg"
                            title="Call Patient"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppPatient(patient.phone)}
                            className="h-9 w-9 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200 rounded-lg"
                            title="WhatsApp Patient"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMedicalHistory(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Medical History"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">History</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMedicalRecord(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Add Medical Record"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Records</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLabWork(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Lab Work"
                          >
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Lab Work</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddPrescription(patient)}
                            className="h-9 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Add Prescription"
                          >
                            <Pill className="w-4 h-4" />
                            <span className="text-sm font-medium">Prescription</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date of Birth:</span>
                        <p>{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span>
                        <p>{patient.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Allergies:</span>
                        <p>{patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'None'}</p>
                      </div>
                    </div>
                    
                    {/* Upcoming Appointments */}
                    {patientsWithAppointments[patient.id] && patientsWithAppointments[patient.id].length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-700" />
                          <span className="font-medium text-gray-700">Upcoming Appointments</span>
                        </div>
                        <div className="space-y-2">
                          {patientsWithAppointments[patient.id]
                            .filter((appointment: any) => appointment.status === 'Confirmed')
                            .slice(0, 3)
                            .map((appointment: any) => (
                            <div key={appointment.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                                <span className="text-sm font-medium">
                                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                                </span>
                              </div>
                            </div>
                          ))}
                          {patientsWithAppointments[patient.id].filter((appointment: any) => appointment.status === 'Confirmed').length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{patientsWithAppointments[patient.id].filter((appointment: any) => appointment.status === 'Confirmed').length - 3} more appointments
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Mobile: Show buttons at bottom */}
                    <div className="sm:hidden mt-6 pt-4 border-t border-gray-100">
                      <div className="space-y-3">
                        {/* Main action buttons - 2 columns */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPatient(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Edit Patient"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-sm font-medium">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDentalChart(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Dental Treatments"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span className="text-sm font-medium">Treatments</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNewAppointment(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Book Appointment"
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Appointment</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMedicalHistory(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Medical History"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">History</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLabWork(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Lab Work"
                          >
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Lab Work</span>
                          </Button>
                        </div>
                        
                        {/* Communication buttons - centered */}
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCallPatient(patient.phone)}
                            className="h-10 w-10 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200 rounded-lg"
                            title="Call Patient"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppPatient(patient.phone)}
                            className="h-10 w-10 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200 rounded-lg"
                            title="WhatsApp Patient"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {displayedPatients.length === 0 && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {!dataLoaded 
                      ? "Click 'Search' to load patients" 
                      : searchTerm 
                        ? "No patients found matching your search" 
                        : "No patients found"
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {!dataLoaded 
                      ? "Load patient data to get started" 
                      : "Add your first patient to get started"
                    }
                  </p>
                </div>
              )}
              
              {/* Pagination Controls */}
              {showAllData && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} patients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Show All Patients</DialogTitle>
              <DialogDescription>
                This will show ALL patients in the database with pagination (50 per page). This is optimized for better performance when you have many patients. You can navigate through pages to see every patient. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmShowAll}>
                Show All
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicate Patient Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patient Already Exists</DialogTitle>
              <DialogDescription>
                {duplicateType === 'both' && `Found ${existingPatients.length} patient(s) with similar name (${nameSimilarity.toFixed(0)}% match) and same phone number.`}
                {duplicateType === 'phone' && `Found ${existingPatients.length} patient(s) with the same phone number.`}
                {duplicateType === 'name' && `Found ${existingPatients.length} patient(s) with similar name (${nameSimilarity.toFixed(0)}% match).`}
              </DialogDescription>
            </DialogHeader>
            
            {/* Patient Selection */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-900">
                Select existing patient or create new:
              </div>
              
              {existingPatients.map((patient, index) => (
                <div 
                  key={patient.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <p><strong>Phone:</strong> {patient.phone}</p>
                        <p><strong>Email:</strong> {patient.email || 'Not provided'}</p>
                        <p><strong>Age:</strong> {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : 'Not specified'}</p>
                        <p><strong>Last Visit:</strong> {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Not available'}</p>
                        <p><strong>Allergies:</strong> {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'None'}</p>
                      </div>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <div className="ml-2 text-primary">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p><strong>Options:</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• <strong>Link to selected:</strong> Add appointment/treatment to this patient</li>
                  <li>• <strong>Create new:</strong> Create a separate patient record (for family members)</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => handleDuplicateAction('cancel')} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDuplicateAction('link')}
                disabled={!selectedPatient}
                className="w-full sm:w-auto"
              >
                Link to Selected
              </Button>
              <Button 
                onClick={() => handleDuplicateAction('create')}
                className="w-full sm:w-auto"
              >
                Create New Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dental Chart Dialog */}
        <Dialog open={showDentalChart} onOpenChange={setShowDentalChart}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Circle className="h-5 w-5" />
                Dental Chart - {selectedPatientForDental?.first_name} {selectedPatientForDental?.last_name || ''}
              </DialogTitle>
              <DialogDescription>
                View and manage dental treatments, conditions, and notes for this patient
              </DialogDescription>
            </DialogHeader>

            {loadingDentalData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading dental data...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dental Chart Component */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Teeth Chart</h3>
                  <ToothChart
                    patientId={selectedPatientForDental?.id || ''}
                    clinicId={clinic?.id || ''}
                    onTreatmentAdded={handleDentalDataUpdated}
                    onConditionUpdated={handleDentalDataUpdated}
                  />
                </div>

                {/* Treatment Summary */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Recent Treatments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Treatments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dentalTreatments.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No treatments recorded</p>
                      ) : (
                        <div className="space-y-3">
                          {dentalTreatments.slice(0, 5).map((treatment) => (
                            <div key={treatment.id} className="border rounded p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{treatment.treatment_type}</h4>
                                  <p className="text-sm text-gray-600">Tooth {treatment.tooth_number}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(treatment.treatment_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={treatment.treatment_status === 'Completed' ? 'default' : 'secondary'}>
                                    {treatment.treatment_status}
                                  </Badge>
                                  {(treatment.treatment_status === 'In Progress' || treatment.treatment_status === 'Planned') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditTreatment(treatment)}
                                      className="h-6 w-6 p-0"
                                      title="Edit Treatment"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDentalChart(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    // Navigate to full dental management
                    setShowDentalChart(false);
                    // You can add navigation to full dental management here
                  }}>
                    Full Dental Management
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Treatment Dialog */}
        <Dialog open={showEditTreatmentDialog} onOpenChange={setShowEditTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Edit Treatment</DialogTitle>
            </DialogHeader>
            
            {editingTreatment && (
              <DentalTreatmentForm
                patientId={selectedPatientForDental?.id || ''}
                clinicId={clinic?.id || ''}
                selectedTooth={editingTreatment.tooth_number}
                initialData={editingTreatment}
                onSuccess={handleTreatmentUpdated}
                onCancel={() => setShowEditTreatmentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Medical History Dialog */}
        <Dialog open={showMedicalHistory} onOpenChange={setShowMedicalHistory}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical History - {selectedPatientHistory?.first_name} {selectedPatientHistory?.last_name || ''}
              </DialogTitle>
              <DialogDescription>
                Complete medical history including treatments, appointments, and health records
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Patient Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Name:</span>
                    <p>{selectedPatientHistory?.first_name} {selectedPatientHistory?.last_name || ''}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{selectedPatientHistory?.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p>{selectedPatientHistory?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date of Birth:</span>
                    <p>{selectedPatientHistory?.date_of_birth ? formatDate(selectedPatientHistory.date_of_birth) : 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Allergies:</span>
                    <p>{selectedPatientHistory?.allergies?.length > 0 ? selectedPatientHistory.allergies.join(', ') : 'None'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Current Medications:</span>
                    <p>{selectedPatientHistory?.current_medications?.length > 0 ? selectedPatientHistory.current_medications.join(', ') : 'None'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="dental" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dental">Dental Treatments</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                  <TabsTrigger value="notes">Notes & Records</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dental" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Dental Treatment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalHistoryDentalTreatments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No dental treatments found</p>
                          <p className="text-sm">Add dental treatments to see history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medicalHistoryDentalTreatments.map((treatment) => (
                            <div key={treatment.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{treatment.treatment_type}</h3>
                                  <p className="text-sm text-gray-600">
                                    Tooth: {treatment.tooth_number} • {treatment.treatment_status}
                                  </p>
                                  {treatment.treatment_description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {treatment.treatment_description}
                                    </p>
                                  )}
                                </div>
                                <Badge className={getTreatmentStatusColor(treatment.treatment_status)}>
                                  {treatment.treatment_status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                <p>Date: {treatment.treatment_date ? formatDate(treatment.treatment_date) : 'Not specified'}</p>
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
                
                <TabsContent value="appointments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Appointment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalHistoryAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No appointments found</p>
                          <p className="text-sm">Add appointments to see history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medicalHistoryAppointments.map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{appointment.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(appointment.date)} at {appointment.time}
                                  </p>
                                </div>
                                <Badge className={getAppointmentStatusColor(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                <p>Phone: {appointment.phone}</p>
                                {appointment.email && <p>Email: {appointment.email}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="prescriptions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Prescription History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalHistoryPrescriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No prescriptions found</p>
                          <p className="text-sm">Add prescriptions to see history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medicalHistoryPrescriptions.map((prescription) => (
                            <div key={prescription.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{prescription.medication_name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {prescription.dosage && `Dosage: ${prescription.dosage} • `}
                                    Frequency: {prescription.frequency} • Duration: {prescription.duration}
                                  </p>
                                  {prescription.instructions && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Instructions: {prescription.instructions}
                                    </p>
                                  )}
                                </div>
                                <Badge className={prescription.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                  {prescription.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                <p>Prescribed: {prescription.created_at ? formatDate(prescription.created_at) : 'Not specified'}</p>
                                {prescription.pharmacy_notes && (
                                  <p className="mt-2 text-gray-600">Pharmacy Notes: {prescription.pharmacy_notes}</p>
                                )}
                                {prescription.patient_notes && (
                                  <p className="mt-2 text-gray-600">Patient Notes: {prescription.patient_notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Notes & Medical Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Patient Notes from patient profile */}
                      {selectedPatientHistory?.notes && (
                        <div className="mb-6">
                          <h4 className="font-medium mb-2 text-gray-900">Patient Profile Notes:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700">{selectedPatientHistory.notes}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Medical Records */}
                      {medicalHistoryRecords.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No medical records found</p>
                          <p className="text-sm">Add medical records to track patient history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-medium mb-2 text-gray-900">Medical Records:</h4>
                          {medicalHistoryRecords.map((record) => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{record.title}</h3>
                                  <p className="text-sm text-gray-600">
                                    Type: {record.record_type} • Date: {formatDate(record.record_date)}
                                  </p>
                                  {record.created_by && (
                                    <p className="text-sm text-gray-600">By: {record.created_by}</p>
                                  )}
                                </div>
                                <Badge className="bg-blue-100 text-blue-800">
                                  {record.record_type}
                                </Badge>
                              </div>
                              {record.description && (
                                <div className="text-sm text-gray-700 mb-2">
                                  <p>{record.description}</p>
                                </div>
                              )}
                              {record.notes && (
                                <div className="text-sm text-gray-600">
                                  <p className="font-medium">Notes:</p>
                                  <p>{record.notes}</p>
                                </div>
                              )}
                              {record.file_url && (
                                <div className="mt-2">
                                  <Button size="sm" variant="outline" onClick={() => window.open(record.file_url, '_blank')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    View File
                                  </Button>
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

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowMedicalHistory(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Prescription Dialog */}
        <Dialog 
          open={showPrescriptionDialog} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange called with:', open);
            setShowPrescriptionDialog(open);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Add Prescription - {selectedPatientForPrescription?.first_name} {selectedPatientForPrescription?.last_name || ''}
              </DialogTitle>
              <DialogDescription>
                Add a new prescription for the patient
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Multiple Medications */}
              {multipleMedications.map((medication, index) => (
                <Card key={index} className="border-2 border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Medication {index + 1}</CardTitle>
                      {multipleMedications.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor={`medication_name_${index}`}>Medication Name *</Label>
                      <Input
                        id={`medication_name_${index}`}
                        value={medication.medication_name}
                        onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                        placeholder="e.g., Amoxicillin, Ibuprofen"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonDentalMedications
                          .filter(med => med.toLowerCase().includes(medication.medication_name.toLowerCase()) && medication.medication_name.length > 0)
                          .slice(0, 5)
                          .map((med) => (
                            <Button
                              key={med}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedication(index, 'medication_name', med)}
                              className="text-xs"
                            >
                              {med}
                            </Button>
                          ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`dosage_${index}`}>Dosage</Label>
                      <Input
                        id={`dosage_${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg, 400mg (optional)"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonDosages
                          .filter(dose => dose.toLowerCase().includes(medication.dosage.toLowerCase()) && medication.dosage.length > 0)
                          .slice(0, 5)
                          .map((dose) => (
                            <Button
                              key={dose}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedication(index, 'dosage', dose)}
                              className="text-xs"
                            >
                              {dose}
                            </Button>
                          ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`frequency_${index}`}>Frequency *</Label>
                      <Input
                        id={`frequency_${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., 3 times daily, Every 6 hours"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonFrequencies
                          .filter(freq => freq.toLowerCase().includes(medication.frequency.toLowerCase()) && medication.frequency.length > 0)
                          .slice(0, 5)
                          .map((freq) => (
                            <Button
                              key={freq}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedication(index, 'frequency', freq)}
                              className="text-xs"
                            >
                              {freq}
                            </Button>
                          ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`duration_${index}`}>Duration *</Label>
                      <Input
                        id={`duration_${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days, 2 weeks"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonDurations
                          .filter(dur => dur.toLowerCase().includes(medication.duration.toLowerCase()) && medication.duration.length > 0)
                          .slice(0, 5)
                          .map((dur) => (
                            <Button
                              key={dur}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedication(index, 'duration', dur)}
                              className="text-xs"
                            >
                              {dur}
                            </Button>
                          ))}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor={`instructions_${index}`}>Instructions</Label>
                      <Textarea
                        id={`instructions_${index}`}
                        value={medication.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food, Complete the full course"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonInstructions
                          .filter(inst => inst.toLowerCase().includes(medication.instructions.toLowerCase()) && medication.instructions.length > 0)
                          .slice(0, 5)
                          .map((inst) => (
                            <Button
                              key={inst}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedication(index, 'instructions', inst)}
                              className="text-xs"
                            >
                              {inst}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add Another Medication Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAnotherMedication}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Medication
                </Button>
              </div>

              {/* General Prescription Notes */}
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">General Notes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="patient_notes">Patient Notes</Label>
                    <Textarea
                      id="patient_notes"
                      value={prescriptionForm.patient_notes}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_notes: e.target.value})}
                      placeholder="Additional notes for the patient"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="side_effects">Side Effects</Label>
                    <Textarea
                      id="side_effects"
                      value={prescriptionForm.side_effects}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, side_effects: e.target.value})}
                      placeholder="Known side effects to watch for"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="interactions">Drug Interactions</Label>
                    <Textarea
                      id="interactions"
                      value={prescriptionForm.interactions}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, interactions: e.target.value})}
                      placeholder="Known drug interactions"
                    />
                  </div>
                </CardContent>
              </Card>
              
              
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPrescriptionDialog(false)}
                disabled={isSavingPrescription}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePrescription}
                disabled={isSavingPrescription}
              >
                {isSavingPrescription ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Prescription'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Medical Record Dialog */}
        <Dialog 
          open={showMedicalRecordDialog} 
          onOpenChange={setShowMedicalRecordDialog}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Add Medical Record - {selectedPatientHistory?.first_name} {selectedPatientHistory?.last_name || ''}
              </DialogTitle>
              <DialogDescription>
                Add a new medical record for the patient
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Record Type */}
              <div>
                <Label htmlFor="record_type">Record Type</Label>
                <Select 
                  value={newMedicalRecordForm.record_type} 
                  onValueChange={(value) => setNewMedicalRecordForm({...newMedicalRecordForm, record_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="xray">X-Ray</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="lab_work">Lab Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newMedicalRecordForm.title}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, title: e.target.value})}
                  placeholder="Brief description of the record"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMedicalRecordForm.description}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, description: e.target.value})}
                  placeholder="Detailed description of the medical record"
                  rows={4}
                />
              </div>

              {/* Record Date */}
              <div>
                <Label htmlFor="record_date">Record Date</Label>
                <Input
                  id="record_date"
                  type="date"
                  value={newMedicalRecordForm.record_date}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, record_date: e.target.value})}
                />
              </div>

              {/* Created By */}
              <div>
                <Label htmlFor="created_by">Created By</Label>
                <Input
                  id="created_by"
                  value={newMedicalRecordForm.created_by}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, created_by: e.target.value})}
                  placeholder="Doctor/staff name"
                />
              </div>

              {/* File URL */}
              <div>
                <Label htmlFor="file_url">File URL (Optional)</Label>
                <Input
                  id="file_url"
                  value={newMedicalRecordForm.file_url}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, file_url: e.target.value})}
                  placeholder="Link to X-ray, document, or other file"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={newMedicalRecordForm.notes}
                  onChange={(e) => setNewMedicalRecordForm({...newMedicalRecordForm, notes: e.target.value})}
                  placeholder="Additional notes or observations"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowMedicalRecordDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveMedicalRecord}
              >
                Save Medical Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lab Work Dialog */}
        <Dialog 
          open={showLabWorkDialog} 
          onOpenChange={setShowLabWorkDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex-1 min-w-0">
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Lab Work - {selectedPatientHistory?.first_name} {selectedPatientHistory?.last_name || ''}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Manage lab work orders and results for the patient
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* New Order Button */}
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => setShowNewLabWorkForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Order
                </Button>
              </div>
              
              {/* Lab Work Orders */}
              {labWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No lab work orders found</p>
                  <p className="text-sm">Create a new lab work order to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lab Work Orders</h3>
                  {labWorkOrders.map((order) => (
                    <Card key={order.id} className="border-2 border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{order.test_name}</CardTitle>
                            <p className="text-sm text-gray-600">
                              Order: {order.order_number} • Type: {order.lab_type}
                            </p>
                          </div>
                          <Badge className={getLabWorkStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Ordered Date:</span>
                            <p>{formatDate(order.ordered_date)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Expected Date:</span>
                            <p>{order.expected_date ? formatDate(order.expected_date) : 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Lab Facility:</span>
                            <p>{order.lab_facility || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span>
                            <p>{order.cost ? `₹${order.cost}` : 'Not specified'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium">Description:</span>
                            <p>{order.description || 'No description provided'}</p>
                          </div>
                          {order.notes && (
                            <div className="md:col-span-2">
                              <span className="font-medium">Notes:</span>
                              <p>{order.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              console.log('Update Status button clicked for order:', order);
                              handleStatusUpdate(order);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update Status
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowLabWorkDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Lab Work Order Dialog */}
        <Dialog 
          open={showNewLabWorkForm} 
          onOpenChange={setShowNewLabWorkForm}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Lab Work Order - {selectedPatientHistory?.first_name} {selectedPatientHistory?.last_name || ''}
              </DialogTitle>
              <DialogDescription>
                Create a new lab work order for the patient
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Lab Type */}
              <div>
                <Label htmlFor="lab_type" className="flex items-center gap-1">
                  Lab Type
                  <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={labWorkForm.lab_type} 
                  onValueChange={(value) => {
                    setLabWorkForm({...labWorkForm, lab_type: value});
                    // Clear error when user selects a value
                    if (labWorkFormErrors.lab_type) {
                      setLabWorkFormErrors({...labWorkFormErrors, lab_type: ''});
                    }
                  }}
                >
                  <SelectTrigger className={labWorkFormErrors.lab_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select lab type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                    <SelectItem value="implant">Implant</SelectItem>
                    <SelectItem value="denture">Denture</SelectItem>
                    <SelectItem value="veneer">Veneer</SelectItem>
                    <SelectItem value="inlay_onlay">Inlay/Onlay</SelectItem>
                    <SelectItem value="orthodontic">Orthodontic Appliance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {labWorkFormErrors.lab_type && (
                  <p className="text-sm text-red-600 mt-1">{labWorkFormErrors.lab_type}</p>
                )}
              </div>

              {/* Test Name */}
              <div>
                <Label htmlFor="test_name">Test Name (Optional)</Label>
                <Input
                  id="test_name"
                  value={labWorkForm.test_name}
                  onChange={(e) => setLabWorkForm({...labWorkForm, test_name: e.target.value})}
                  placeholder="e.g., Porcelain Crown, Implant Crown, Bridge"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={labWorkForm.description}
                  onChange={(e) => setLabWorkForm({...labWorkForm, description: e.target.value})}
                  placeholder="Detailed description of the dental lab work (materials, specifications, etc.)"
                  rows={3}
                />
              </div>

              {/* Expected Date */}
              <div>
                <Label htmlFor="expected_date">Expected Date (Optional)</Label>
                <Input
                  id="expected_date"
                  type="date"
                  value={labWorkForm.expected_date}
                  onChange={(e) => setLabWorkForm({...labWorkForm, expected_date: e.target.value})}
                />
              </div>

              {/* Lab Facility */}
              <div>
                <Label htmlFor="lab_facility">Lab Facility (Optional)</Label>
                <Input
                  id="lab_facility"
                  value={labWorkForm.lab_facility}
                  onChange={(e) => setLabWorkForm({...labWorkForm, lab_facility: e.target.value})}
                  placeholder="Name of the dental lab facility"
                />
              </div>

              {/* Cost */}
              <div>
                <Label htmlFor="cost">Cost in INR (Optional)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={labWorkForm.cost}
                  onChange={(e) => setLabWorkForm({...labWorkForm, cost: e.target.value})}
                  placeholder="₹0.00"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={labWorkForm.notes}
                  onChange={(e) => setLabWorkForm({...labWorkForm, notes: e.target.value})}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewLabWorkForm(false);
                  setLabWorkFormErrors({});
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveLabWorkOrder}
                disabled={!labWorkForm.lab_type}
              >
                Create Lab Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog 
          open={showStatusUpdateDialog} 
          onOpenChange={setShowStatusUpdateDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update Lab Work Status
              </DialogTitle>
              <DialogDescription>
                Update the status for: {selectedLabOrder?.test_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Status */}
              <div>
                <Label>Current Status</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  <Badge className={getLabWorkStatusColor(selectedLabOrder?.status || '')}>
                    {selectedLabOrder?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {/* New Status */}
              <div>
                <Label htmlFor="new_status">New Status</Label>
                <Select 
                  value={statusUpdateForm.new_status} 
                  onValueChange={(value) => setStatusUpdateForm({...statusUpdateForm, new_status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ordered">Ordered</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Quality Check">Quality Check</SelectItem>
                    <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="Patient Notified">Patient Notified</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="status_notes">Notes (Optional)</Label>
                <Textarea
                  id="status_notes"
                  value={statusUpdateForm.notes}
                  onChange={(e) => setStatusUpdateForm({...statusUpdateForm, notes: e.target.value})}
                  placeholder="Add notes about this status change"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowStatusUpdateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveStatusUpdate}
                disabled={!statusUpdateForm.new_status}
              >
                Update Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Patient Confirmation Dialog */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Patient
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{patientToDelete?.first_name} {patientToDelete?.last_name || ''}</strong>? This action cannot be undone and will permanently remove all patient data including:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Patient information</li>
                  <li>• Medical history</li>
                  <li>• Dental treatments</li>
                  <li>• Lab work orders</li>
                  <li>• Prescriptions</li>
                  <li>• Appointments</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setPatientToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeletePatient}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
