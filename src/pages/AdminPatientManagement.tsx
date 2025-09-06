import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { patientApi, treatmentPlanApi, medicalRecordApi, Patient } from '@/lib/patient-management';
import { dentalTreatmentApi, toothConditionApi, dentalNoteApi, toothChartUtils } from '@/lib/dental-treatments';
import { labWorkApi } from '@/lib/lab-work';
import { supabase, dentistsApi, Dentist, followUpsApi } from '@/lib/supabase';
import ToothChart from '@/components/ToothChart';
import DentalTreatmentForm from '@/components/DentalTreatmentForm';
import { Plus, Search, Edit, Trash2, User, Calendar, FileText, Activity, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Circle, Phone, MessageCircle, Stethoscope, X, Pill, Clock, Check, MoreHorizontal } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { sendWhatsAppReviewRequest } from '@/lib/whatsapp';
interface LabWorkOrder {
  id: string
  work_type: string
  lab_name: string
  status: string
  order_date: string
  expected_completion_date?: string
  cost?: number
  description?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Using imported Patient interface from patient-management.ts

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

interface DentalTreatment {
  id: string;
  patient_id: string;
  treatment_type: string;
  tooth_number: string;
  treatment_description: string;
  cost: number;
  treatment_status: string;
  treatment_date: string;
  clinic_id: string;
  created_at: string;
}

export default function AdminPatientManagement() {
  const { clinic } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDentist, isStaff, hasPermission } = usePermissions();
  
  // State for patients
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // State for in-progress treatments
  const [patientsInProgressTreatments, setPatientsInProgressTreatments] = useState<{[key: string]: TreatmentPlan[]}>({});
  
  // State for today's appointment patient selection
  const [selectedTodayPatient, setSelectedTodayPatient] = useState<string | null>(null);
  
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
  const [showAppointmentActionsDialog, setShowAppointmentActionsDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<{id: string, patientName: string} | null>(null);
  const [selectedTreatmentToContinue, setSelectedTreatmentToContinue] = useState<any>(null);
  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [followUpPatients, setFollowUpPatients] = useState<any[]>([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [customFollowUpReason, setCustomFollowUpReason] = useState('');
  const [showCompleteConfirmDialog, setShowCompleteConfirmDialog] = useState(false);
  const [followUpToComplete, setFollowUpToComplete] = useState<{id: string, patientName: string} | null>(null);
  const [duplicateType, setDuplicateType] = useState<'phone' | 'name' | 'both'>('phone');
  const [nameSimilarity, setNameSimilarity] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [lastSearchedPatient, setLastSearchedPatient] = useState<Patient | null>(null);
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
  const [labWorkOrders, setLabWorkOrders] = useState<LabWorkOrder[]>([]);
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
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<Patient | null>(null);

  
  // Dental chart state
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [selectedPatientForDental, setSelectedPatientForDental] = useState<Patient | null>(null);
  // Fixed to FDI numbering system
  const dentalNumberingSystem = 'fdi';
  const [dentalTreatments, setDentalTreatments] = useState<any[]>([]);
  const [toothConditions, setToothConditions] = useState<any[]>([]);
  const [dentalNotes, setDentalNotes] = useState<any[]>([]);
  const [loadingDentalData, setLoadingDentalData] = useState(false);
  const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);
  const [showDeleteTreatmentConfirmDialog, setShowDeleteTreatmentConfirmDialog] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<any>(null);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'lab-orders'>('all');
  const [patientsWithAppointments, setPatientsWithAppointments] = useState<{[key: string]: any[]}>({});
  const [patientsWithLabOrders, setPatientsWithLabOrders] = useState<{[key: string]: any[]}>({});
  
  // Lab work form validation state
  const [labWorkFormErrors, setLabWorkFormErrors] = useState<{[key: string]: string}>({});
  
  // Form validation states
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);
  
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

    // Checking for duplicates
    // Formatted phone, first name, last name

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
        // No phone matches found
        return { patients: [], type: null, similarity: 0 };
      }

      // Phone matches found

      // Check name similarity for each phone match
      let bestMatch: Patient | null = null;
      let bestSimilarity = 0;
      let matchType: 'phone' | 'name' | 'both' = 'phone';

      for (const patient of phoneMatches) {
        const existingFullName = `${patient.first_name} ${patient.last_name || ''}`.trim();
        const newFullName = `${formattedFirstName} ${formattedLastName}`.trim();
        
        // Calculate similarity
        const similarity = calculateNameSimilarity(existingFullName, newFullName);
        
        // Comparing names for similarity

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

      // Best match found

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
      // Component: Validation passed, preparing data
      
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
        current_medications: patientForm.current_medications.filter(item => item.trim() !== ''),
        is_active: true
      };
      
          // Component: Sending patient data
    // Component: Clinic ID being used
      
      const newPatient = await patientApi.create(cleanPatientData, clinic.id);
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
        medical_history: { conditions: [] as string[], surgeries: [] as string[] },
        allergies: [],
        current_medications: [],
        notes: ''
      });
      
      // Add new patient to existing list instead of reloading entire database
      if (newPatient) {
        setPatients(prevPatients => [newPatient, ...prevPatients]);
        setFilteredPatients(prevPatients => [newPatient, ...prevPatients]);
        setTotalPatients(prev => prev + 1);
      }
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
    // Refresh in-progress treatments for all patients
    if (patients.length > 0) {
      await loadInProgressTreatmentsForPatients(patients);
    }
  };

  // Handle continue treatment - opens dental chart and navigates to specific tooth
  const handleContinueTreatment = async (patient: Patient, treatment: DentalTreatment) => {
    // First open the dental chart for this patient
    await handleOpenDentalChart(patient);
    
    // Store the treatment info to auto-open the treatment form
    setSelectedTreatmentToContinue(treatment);
    
    // Show a toast to guide the user
    toast({
      title: "Dental Chart Opened",
      description: `Navigate to Tooth ${treatment.tooth_number} to continue the ${treatment.treatment_type} treatment`,
    });
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

  // Handle completing an appointment
  const handleCompleteAppointment = async (appointmentId: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Completed",
        description: `Appointment for ${patientName} has been marked as completed`,
      });

      // Send review request via WhatsApp if enabled
      try {
        // Starting review request process
        
        // Get patient phone number from the appointment
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('phone')
          .eq('id', appointmentId)
          .single();

                  // Appointment data and patient phone

        if (appointmentData?.phone) {
          const reviewLink = `${window.location.origin}/review?patient=${patientName}`;
                      // Review link
          
                      // Sending review request
          const reviewSent = await sendWhatsAppReviewRequest(
            appointmentData.phone,
            patientName,
            reviewLink
          );

                      // Review request result

          if (reviewSent) {
            toast({
              title: "Review Request Sent",
              description: `Review request sent to ${patientName} via WhatsApp`,
            });
          } else {
            // Review request failed or disabled
          }
        } else {
                      // No patient phone number found in appointment data
        }
      } catch (reviewError) {
        console.error('❌ Error sending review request:', reviewError);
        // Don't fail the completion if review request fails
      }

      // Refresh the appointments list
      loadPatientsWithAppointmentsToday();
      
      // Dispatch custom event to notify other pages of appointment completion
      window.dispatchEvent(new CustomEvent('appointmentCompleted', {
        detail: {
          appointmentId: appointmentId,
          patientName: patientName,
          action: 'completed'
        }
      }));
      
      // Trigger a small delay to ensure real-time updates propagate
      setTimeout(() => {
        // This ensures the Admin page real-time updates pick up the change
        // Appointment completed - real-time updates should propagate
      }, 100);

      setShowAppointmentActionsDialog(false);
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to complete appointment",
        variant: "destructive"
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: `Appointment for ${patientName} has been cancelled`,
      });

      // Refresh the appointments list
      loadPatientsWithAppointmentsToday();
      
      // Dispatch custom event to notify other pages
      window.dispatchEvent(new CustomEvent('appointmentCompleted', {
        detail: {
          appointmentId: appointmentId,
          patientName: patientName,
          action: 'cancelled'
        }
      }));

      setShowAppointmentActionsDialog(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  const handleRescheduleAppointment = (appointmentId: string, patientName: string) => {
    // Get patient data for pre-filling
    const patient = patients.find(p => p.first_name === patientName);
    if (patient) {
      // Pre-fill patient data and redirect to appointment page
      const patientData = encodeURIComponent(JSON.stringify({
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
        phone: patient.phone,
        email: patient.email || '',
        allergies: patient.allergies || [],
        rescheduleFrom: appointmentId // Flag to indicate this is a reschedule
      }));
      
      // Navigate to appointment page with pre-filled patient data
      window.location.href = `/appointment?clinic=${clinic?.slug || 'default'}&patient=${patientData}`;
    } else {
      toast({
        title: "Error",
        description: "Patient data not found for rescheduling",
        variant: "destructive"
      });
    }
  };

  const handleFollowUpAppointment = (appointmentId: string, patientName: string) => {
    // Set default follow-up date to 1 week from today
    const oneWeekFromToday = new Date();
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
    setFollowUpDate(oneWeekFromToday.toISOString().split('T')[0]);
    
    // Set default reason
    setFollowUpReason('Patient follow-up required');
    
    // Open follow-up form
    setShowFollowUpForm(true);
    setShowAppointmentActionsDialog(false);
  };

  const handleCreateFollowUp = async () => {
    if (!appointmentToComplete || !followUpDate || !followUpReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Use custom reason if "Custom reason..." is selected and custom text is provided
    const finalReason = followUpReason === "Custom reason..." && customFollowUpReason.trim() 
      ? customFollowUpReason.trim() 
      : followUpReason;

    if (!finalReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for follow-up",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the patient data
      const patient = patients.find(p => p.first_name === appointmentToComplete.patientName);
      if (!patient || !clinic?.id) {
        throw new Error('Patient or clinic not found');
      }

      // Create follow-up in database
      const newFollowUp = await followUpsApi.create({
        clinic_id: clinic.id,
        patient_id: patient.id,
        reason: finalReason,
        status: 'Pending',
        priority: 'Normal',
        created_by: 'Admin',
        due_date: followUpDate
      });

      // Refresh follow-up list
      await loadFollowUpAppointments();

      toast({
        title: "Added to Follow-up List",
        description: `${appointmentToComplete.patientName} has been added to the follow-up list for ${new Date(followUpDate).toLocaleDateString()}`,
      });

      // Reset form and close dialog
      setShowFollowUpForm(false);
      setFollowUpDate('');
      setFollowUpReason('');
      setCustomFollowUpReason('');
      setAppointmentToComplete(null);
    } catch (error) {
      console.error('Error adding to follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to add to follow-up",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromFollowUp = async (followUpId: string, patientName: string) => {
    try {
      // Delete follow-up from database
      await followUpsApi.delete(followUpId);

      // Get the patient ID of the deleted follow-up
      const deletedFollowUp = followUpPatients.find(fu => fu.id === followUpId);
      const patientId = deletedFollowUp?.patient_id;

      // Immediately update local state to remove the follow-up
      setFollowUpPatients(prev => prev.filter(fu => fu.id !== followUpId));

      // If we're in follow-ups filter, update the filtered patients
      if (activeFilter === 'follow-ups' && patientId) {
        // Check if this patient has any other follow-ups
        const remainingFollowUps = followUpPatients.filter(fu => fu.id !== followUpId && fu.patient_id === patientId);
        
        if (remainingFollowUps.length === 0) {
          // Patient has no more follow-ups, remove from filtered list
          setFilteredPatients(prev => prev.filter(p => p.id !== patientId));
          setDisplayedPatients(prev => prev.filter(p => p.id !== patientId));
        }
      }

      toast({
        title: "Follow-up Completed",
        description: `${patientName}'s follow-up has been completed`,
      });
    } catch (error) {
      console.error('Error removing from follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to remove from follow-up",
        variant: "destructive"
      });
    }
  };



  // Load dentists for clinic
  const loadDentists = async () => {
    if (!clinic?.id) return;
    
    try {
      const dentistsList = await dentistsApi.getAll(clinic.id);
      setDentists(dentistsList);
    } catch (error) {
      console.error('Failed to load dentists:', error);
    }
  };

  // Get dentist name by ID
  const getDentistName = (dentistId: string) => {
    const dentist = dentists.find(d => d.id === dentistId);
    return dentist ? dentist.name : 'Unknown Dentist';
  };

  // Medical history function
  const handleViewMedicalHistory = async (patient: Patient) => {
    setSelectedPatientHistory(patient);
    setShowMedicalHistory(true);
    
    // Load dentists first
    await loadDentists();
    
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
      
      // Medical History Data Loaded
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
    // handleStatusUpdate called with order
    setSelectedLabOrder(order);
    setStatusUpdateForm({
      new_status: order.status,
      notes: ''
    });
    setShowStatusUpdateDialog(true);
    // Dialog should be opening now
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
        lab_name: labWorkForm.lab_facility || '',
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
          // Save already in progress, ignoring click
    // isSavingPrescription and isSavingRef.current
      return;
    }

    // handleSavePrescription called
    // multipleMedications count, selectedPatientForPrescription, clinic?.id, multipleMedications

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
      // Starting to save medications
      
      // Save each medication
      for (const medication of multipleMedications) {
        // Saving medication
        
        // Use direct insert (simpler and more reliable)
        // Using direct insert
        
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

        // Direct insert response and error details

        if (insertError) {
          console.error('Direct insert failed:', insertError);
          throw insertError;
        }
      }

              // All medications saved successfully

      // Close dialog immediately
      setShowPrescriptionDialog(false);
      
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

      // Show success message
      toast({
        title: "Success",
        description: `${multipleMedications.length} prescription(s) added successfully`,
      });
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

  // Common dental medications for suggestions (Indian brands included)
  const commonDentalMedications = [
    // Antibiotics
    'Amoxicillin',
    'Amoxicillin + Clavulanic Acid',
    'Azithromycin',
    'Cephalexin',
    'Ciprofloxacin',
    'Clindamycin',
    'Doxycycline',
    'Erythromycin',
    'Metronidazole',
    'Penicillin V',
    
    // Pain Relief
    'Paracetamol',
    'Ibuprofen',
    'Diclofenac',
    'Aceclofenac',
    'Ketorolac',
    'Tramadol',
    
    // Indian Brand Names (Pain Relief)
    'Crocin',
    'Dolo 650',
    'Brufen',
    'Combiflam',
    'Voveran',
    'Nimulid',
    'Ponstan',
    
    // Anti-inflammatory
    'Prednisolone',
    'Dexamethasone',
    'Betamethasone',
    
    // Antifungal
    'Fluconazole',
    'Nystatin',
    'Clotrimazole',
    'Miconazole',
    
    // Local Anesthetics
    'Lidocaine',
    'Benzocaine',
    'Prilocaine',
    
    // Mouthwashes & Topical
    'Chlorhexidine Mouthwash',
    'Betadine Gargle',
    'Hexidine',
    'Listerine',
    'Colgate Plax',
    
    // Antacids & Gastroprotective
    'Pantoprazole',
    'Omeprazole',
    'Ranitidine',
    'Domperidone',
    
    // Vitamins & Supplements
    'Calcium',
    'Vitamin D3',
    'Multivitamin',
    'Iron Supplements',
    
    // Other Common Dental Medications
    'Orajel',
    'Anbesol',
    'Salt Water Rinse',
    'Honey',
    'Turmeric Paste',
    'Clove Oil',
    'Tea Tree Oil'
  ];

  // Common dosages for suggestions (Indian standards)
  const commonDosages = [
    // Tablet/Capsule Dosages
    '250mg',
    '500mg',
    '650mg',
    '750mg',
    '1000mg',
    '1g',
    '10mg',
    '20mg',
    '25mg',
    '50mg',
    '100mg',
    '150mg',
    '200mg',
    '400mg',
    '600mg',
    '800mg',
    
    // Liquid Dosages
    '5ml',
    '10ml',
    '15ml',
    '20ml',
    '30ml',
    '50ml',
    '100ml',
    '125mg/5ml',
    '250mg/5ml',
    '500mg/5ml',
    
    // Topical Concentrations
    '0.12%',
    '0.2%',
    '1%',
    '2%',
    '5%',
    '10%',
    '20%',
    
    // Drops
    '1 drop',
    '2 drops',
    '3 drops',
    '5 drops',
    
    // Other
    '1 tablet',
    '2 tablets',
    '1 capsule',
    '1 sachet',
    '1 spoonful'
  ];

  // Common frequencies for suggestions (Indian patterns)
  const commonFrequencies = [
    // Standard Frequencies
    'Once daily',
    'Twice daily',
    '3 times daily',
    '4 times daily',
    '5 times daily',
    
    // Time-based
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'Every 24 hours',
    
    // Meal-related
    'Before meals',
    'After meals',
    'With meals',
    'On empty stomach',
    '1 hour before meals',
    '2 hours after meals',
    
    // As needed patterns
    'As needed',
    'When pain occurs',
    'When fever occurs',
    'When required',
    'PRN (as needed)',
    
    // Specific times
    'Morning only',
    'Evening only',
    'Night only',
    'Before bedtime',
    'After breakfast',
    'After lunch',
    'After dinner',
    
    // Topical frequencies
    'Apply 2-3 times daily',
    'Apply 4 times daily',
    'Rinse 2-3 times daily',
    'Gargle 3-4 times daily',
    'Apply as needed'
  ];

  // Common durations for suggestions (Indian patterns)
  const commonDurations = [
    // Short-term courses
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '21 days',
    '30 days',
    
    // Weeks
    '1 week',
    '2 weeks',
    '3 weeks',
    '4 weeks',
    '6 weeks',
    '8 weeks',
    
    // Months
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    
    // Special durations
    'Until finished',
    'Until symptoms improve',
    'Until pain subsides',
    'As needed',
    'Long term',
    'Indefinite',
    'Until next visit',
    'Until review',
    
    // Topical durations
    'Apply for 3-5 days',
    'Use for 1 week',
    'Continue until healed',
    'Until inflammation reduces'
  ];

  // Common instructions for suggestions (Indian patterns)
  const commonInstructions = [
    // Food-related instructions
    'Take with food',
    'Take on empty stomach',
    'Take before meals',
    'Take after meals',
    'Take with or without food',
    'Take 1 hour before meals',
    'Take 2 hours after meals',
    'Take with milk',
    'Take with warm water',
    'Take with cold water',
    'Do not take with dairy products',
    'Do not take with tea/coffee',
    
    // Course completion
    'Complete the full course',
    'Do not stop early',
    'Finish all tablets',
    'Take until finished',
    'Continue as prescribed',
    
    // Timing instructions
    'Take at the same time daily',
    'Take morning and evening',
    'Take with breakfast',
    'Take with dinner',
    'Take before bedtime',
    
    // Storage instructions
    'Store in refrigerator',
    'Store in cool place',
    'Keep away from sunlight',
    'Store at room temperature',
    'Do not freeze',
    
    // Usage instructions
    'Shake well before use',
    'Rinse mouth after use',
    'Gargle for 30 seconds',
    'Apply thinly',
    'Apply to affected area',
    'Do not swallow',
    'Spit out after use',
    
    // Lifestyle instructions
    'Avoid alcohol while taking',
    'Avoid smoking',
    'Avoid spicy food',
    'Avoid hot beverages',
    'Avoid cold beverages',
    
    // Special instructions
    'Take with plenty of water',
    'Drink 8 glasses of water daily',
    'Rest well',
    'Avoid strenuous activity',
    'Keep follow-up appointment',
    'Contact if side effects occur',
    'Take as directed by doctor',
    
    // Topical instructions
    'Apply with clean hands',
    'Wash area before applying',
    'Do not apply to broken skin',
    'Avoid contact with eyes',
    'Apply 2-3 times daily',
    'Massage gently',
    'Cover with bandage if needed'
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

  // Load patients on component mount - auto-load patients with appointments today
  useEffect(() => {
    // Component: Clinic context changed
    if (clinic?.id) {
              // Component: Ready to load patients with appointments today for clinic
      // Load patients with appointments today by default
      loadPatientsWithAppointmentsToday();
      // Load follow-up appointments
      loadFollowUpAppointments();
      // Load last searched patient
      loadLastSearchedPatient();
    } else {
              // Component: No clinic ID available
    }
  }, [clinic?.id]);

  // Clear today's patient selection on page load/reload
  useEffect(() => {
    setSelectedTodayPatient(null);
  }, []);

  // Listen for appointment completion events from other pages
  useEffect(() => {
    const handleAppointmentCompleted = (event: CustomEvent) => {
      // AdminPatientManagement page received appointment completion event
      // Trigger refresh to update patients list
      loadPatientsWithAppointmentsToday();
    };

    window.addEventListener('appointmentCompleted', handleAppointmentCompleted as EventListener);

    return () => {
      window.removeEventListener('appointmentCompleted', handleAppointmentCompleted as EventListener);
    };
  }, []);

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

  // Check role access - redirect staff to admin page if they don't have permission
  useEffect(() => {
    // Add a small delay to ensure permissions are loaded
    const timer = setTimeout(() => {
      if (isStaff && !hasPermission('access_patient_portal')) {
        toast({
          title: "Access Restricted",
          description: "Patient management access is not enabled for staff. Redirecting to admin page.",
          variant: "destructive"
        });
        navigate('/admin');
        return;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isStaff, navigate, toast, hasPermission]);

  // Load dental numbering system when clinic is available
  useEffect(() => {
    if (clinic?.id) {
      // No need to load numbering system - fixed to FDI
    }
  }, [clinic?.id]);

  // No need to subscribe to numbering system changes - fixed to FDI

  // Auto-search when navigating from Admin page
  useEffect(() => {
    if (location.state?.autoSearch && location.state?.searchTerm) {
      const incomingSearchTerm = location.state.searchTerm;
      setSearchTerm(incomingSearchTerm);
      
      // Trigger search after a small delay to ensure component is ready
      const timer = setTimeout(() => {
        handleSearch();
      }, 100);
      
      // Clear the state to prevent re-triggering on re-renders
      navigate(location.pathname, { replace: true });
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);

  // No need to load numbering system - fixed to FDI

  const loadPatients = async () => {
    if (!clinic?.id) return;
    
    setLoading(true);
    try {
      const data = await patientApi.getAll(clinic.id);
      setPatients(data);
      setFilteredPatients(data);
      setTotalPatients(data.length);
      setDataLoaded(true);
      
      // Load in-progress treatments for all patients
      await loadInProgressTreatmentsForPatients(data);
      
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

  // Load in-progress treatments for all patients
  const loadInProgressTreatmentsForPatients = async (patientsData: Patient[]) => {
    if (!clinic?.id) return;
    
    try {
      // Get all patient IDs
      const patientIds = patientsData.map(patient => patient.id);
      
      // Get in-progress treatments for all patients
      const { data: treatmentsData, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('clinic_id', clinic.id)
        .in('patient_id', patientIds)
        .in('treatment_status', ['In Progress', 'Planned'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group treatments by patient ID
      const treatmentsByPatient: {[key: string]: any[]} = {};
      
      treatmentsData?.forEach(treatment => {
        if (!treatmentsByPatient[treatment.patient_id]) {
          treatmentsByPatient[treatment.patient_id] = [];
        }
        treatmentsByPatient[treatment.patient_id].push(treatment);
      });

      setPatientsInProgressTreatments(treatmentsByPatient);
    } catch (error) {
      console.error('Error loading in-progress treatments:', error);
    }
  };

  // Load follow-up patients from database
  const loadFollowUpAppointments = async () => {
    if (!clinic?.id) return;
    
    try {
      const data = await followUpsApi.getByClinic(clinic.id);
      setFollowUpPatients(data || []);
    } catch (error) {
      console.error('Error loading follow-up appointments:', error);
    }
  };

  const loadPatientsWithAppointmentsToday = async () => {
    if (!clinic?.id) return;
    
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
              // Get appointments for today (only confirmed ones)
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, patient_id, name, phone, email, date, time, status')
          .eq('clinic_id', clinic.id)
          .eq('date', today)
          .eq('status', 'Confirmed')
          .order('time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (appointmentsData && appointmentsData.length > 0) {
        // Get unique patient IDs from today's appointments
        const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
        
        // Get patient details for those who have appointments today
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', clinic.id)
          .in('id', patientIds)
          .eq('is_active', true);

        if (patientsError) throw patientsError;

        // Merge appointment info with patient data
        const patientsWithAppointments = patientsData?.map(patient => {
          const patientAppointments = appointmentsData.filter(apt => apt.patient_id === patient.id);
          return {
            ...patient,
            today_appointments: patientAppointments
          };
        }) || [];

        setPatients(patientsWithAppointments);
        setFilteredPatients(patientsWithAppointments);
        setTotalPatients(patientsWithAppointments.length);
        setDataLoaded(true);
        
        // Load in-progress treatments for these patients
        await loadInProgressTreatmentsForPatients(patientsWithAppointments);
        
        toast({
          title: "Today's Appointments",
          description: `Loaded ${patientsWithAppointments.length} patients with appointments today`,
        });
      } else {
        // No appointments today - show empty state instead of loading all patients
        // No appointments today - showing empty state
        setPatients([]);
        setFilteredPatients([]);
        setTotalPatients(0);
        setDataLoaded(true);
        
        toast({
          title: "No Appointments Today",
          description: "Use the search function to find specific patients or create new appointments",
        });
      }
    } catch (error) {
      console.error('Error loading patients with appointments today:', error);
      toast({
        title: "Error",
        description: "Failed to load today's appointments",
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

  // Save last searched patient to localStorage
  const saveLastSearchedPatient = (patient: Patient) => {
    localStorage.setItem('lastSearchedPatient', JSON.stringify(patient));
    setLastSearchedPatient(patient);
  };

  // Load last searched patient from localStorage
  const loadLastSearchedPatient = () => {
    const saved = localStorage.getItem('lastSearchedPatient');
    if (saved) {
      try {
        const patient = JSON.parse(saved);
        setLastSearchedPatient(patient);
      } catch (error) {
        console.error('Failed to load last searched patient:', error);
      }
    }
  };

  // Handle recent button click
  const handleRecentClick = () => {
    if (lastSearchedPatient) {
      setFilteredPatients([lastSearchedPatient]);
      setDisplayedPatients([lastSearchedPatient]);
      setShowAllData(false);
      setCurrentPage(1);
      setSearchTerm(`${lastSearchedPatient.first_name} ${lastSearchedPatient.last_name || ''}`.trim());
      
      toast({
        title: "Recent Patient Loaded",
        description: `Showing ${lastSearchedPatient.first_name} ${lastSearchedPatient.last_name || ''}`,
      });
    } else {
      toast({
        title: "No Recent Patient",
        description: "No recent patient search found",
      });
    }
  };

  const handleSelectSearchResult = (patient: Patient) => {
    setFilteredPatients([patient]);
    setDisplayedPatients([patient]);
    setShowAllData(false);
    setCurrentPage(1);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Save as last searched patient
    saveLastSearchedPatient(patient);
    
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

  // Handle filter for follow-up patients
  const handleFollowUpsFilter = async () => {
    setLoading(true);
    setActiveFilter('follow-ups');
    try {
      // Load fresh follow-up data
      await loadFollowUpAppointments();
      
      if (followUpPatients.length > 0) {
        // Get patient data for follow-up patients
        const followUpPatientIds = followUpPatients.map(fu => fu.patient_id);
        const followUpPatientData = patients.filter(p => followUpPatientIds.includes(p.id));
        
        setFilteredPatients(followUpPatientData);
        setDisplayedPatients(followUpPatientData);
        setDataLoaded(true);
        
        toast({
          title: "Follow-up Patients",
          description: `Showing ${followUpPatientData.length} patients with follow-ups`,
        });
      } else {
        setFilteredPatients([]);
        setDisplayedPatients([]);
        setDataLoaded(true);
        toast({
          title: "No Follow-ups",
          description: "No patients in follow-up list",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load follow-up patients",
        variant: "destructive"
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
    // Prevent multiple submissions
    if (isSubmittingPatient) return;
    
    // Component: Starting to add patient
    // Component: Clinic object and Clinic ID
    
    if (!clinic?.id) {
      console.error('Component: No clinic ID available');
      toast({
        title: "Error",
        description: "Clinic information not available. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    // Comprehensive validation - collect all errors
    const errors: string[] = [];
    
    // Required field validation
    if (!patientForm.first_name.trim()) {
      errors.push("First name is required");
    }
    
    if (!patientForm.phone.trim()) {
      errors.push("Phone number is required");
    }
    
    // Phone number format validation
    if (patientForm.phone.trim() && !validatePhone(patientForm.phone)) {
      errors.push("Please enter a valid 10-digit phone number");
    }
    
    // Email validation (if provided)
    if (patientForm.email && !validateEmail(patientForm.email)) {
      errors.push("Please enter a valid email address");
    }
    
    // Show all validation errors at once
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive"
      });
      return;
    }
    
    // Start loading state
    setIsSubmittingPatient(true);
    
    try {
      // Check for duplicates
      // Starting duplicate check
      const duplicateCheck = await checkForDuplicates();
              // Duplicate check result
      
      if (duplicateCheck.patients.length > 0) {
                  // Duplicate found, showing dialog
        // Show duplicate dialog
        setExistingPatients(duplicateCheck.patients);
        setDuplicateType(duplicateCheck.type || 'phone');
        setNameSimilarity(duplicateCheck.similarity);
        setSelectedPatient(duplicateCheck.patients[0]); // Auto-select most recent
        setShowDuplicateDialog(true);
        return;
      }
      
              // No duplicates found, creating new patient
      // No duplicates found, create new patient
      await createNewPatient();
    } catch (error) {
      console.error('Error in handleAddPatient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPatient(false);
    }
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

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
    // Refresh in-progress treatments for all patients
    if (patients.length > 0) {
      await loadInProgressTreatmentsForPatients(patients);
    }
  };

  // Handle delete treatment
  const handleDeleteTreatment = (treatment: any) => {
    setTreatmentToDelete(treatment);
    setShowDeleteTreatmentConfirmDialog(true);
  };

  // Confirm delete treatment
  const confirmDeleteTreatment = async () => {
    if (!treatmentToDelete) return;
    
    try {
      await dentalTreatmentApi.delete(treatmentToDelete.id);
      setShowDeleteTreatmentConfirmDialog(false);
      setTreatmentToDelete(null);
      
      // Refresh dental treatments data
      if (selectedPatientForDental) {
        await handleOpenDentalChart(selectedPatientForDental);
      }
      // Refresh in-progress treatments for all patients
      if (patients.length > 0) {
        await loadInProgressTreatmentsForPatients(patients);
      }
      
      toast({
        title: "Success",
        description: "Treatment deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast({
        title: "Error",
        description: "Failed to delete treatment",
        variant: "destructive"
      });
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Patient Management</h1>
              <p className="text-gray-600">Manage patients, treatments, and medical records</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate('/admin')}
                variant="outline" 
                className="flex items-center gap-2 text-sm border-2 border-blue-400 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-500 shadow-sm transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Admin</span>
              </Button>
              <LogoutButton />
            </div>
          </div>
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
                                {patient.today_appointments && patient.today_appointments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {patient.today_appointments.map((apt: any, index: number) => (
                                      <div key={index} className="flex items-center gap-2 text-xs">
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            apt.status === 'Confirmed' ? 'border-green-200 text-green-700 bg-green-50' :
                                            apt.status === 'Completed' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                            apt.status === 'Cancelled' ? 'border-red-200 text-red-700 bg-red-50' :
                                            'border-yellow-200 text-yellow-700 bg-yellow-50'
                                          }`}
                                        >
                                          {apt.status}
                                        </Badge>
                                        <span className="text-gray-600">
                                          ⏰ {apt.time} • 📅 {new Date(apt.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
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
                
                {/* Recent Button */}
                <Button 
                  onClick={handleRecentClick}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={!lastSearchedPatient}
                  title={lastSearchedPatient ? `Show ${lastSearchedPatient.first_name} ${lastSearchedPatient.last_name || ''}` : 'No recent patient'}
                >
                  <Clock className="w-4 h-4" />
                  Recent
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
                <Button 
                  onClick={handleFollowUpsFilter}
                  variant={activeFilter === 'follow-ups' ? 'default' : 'outline'}
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading && activeFilter === 'follow-ups' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Follow-ups ({followUpPatients.length})
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
                      className={!patientForm.first_name.trim() ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {!patientForm.first_name.trim() && (
                      <div className="text-sm text-red-600 mt-1">
                        First name is required
                      </div>
                    )}
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
                      className={!patientForm.phone.trim() || phoneError ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    {!patientForm.phone.trim() && (
                      <div className="text-sm text-red-600 mt-1">
                        Phone number is required
                      </div>
                    )}
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
                  <Button 
                    onClick={isEditMode ? handleUpdatePatient : handleAddPatient}
                    disabled={isSubmittingPatient}
                  >
                    {isSubmittingPatient ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Patient...
                      </>
                    ) : (
                      isEditMode ? 'Update Patient' : 'Add Patient'
                    )}
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
                <Card key={patient.id} className={`border-2 transition-all duration-200 ${
                  patient.today_appointments && patient.today_appointments.length > 0 && selectedTodayPatient && selectedTodayPatient !== patient.id
                    ? 'border-gray-200 opacity-50 bg-gray-50'
                    : 'border-gray-300'
                }`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          {/* Profile icon for selection - only show for today's appointments */}
                          {patient.today_appointments && patient.today_appointments.length > 0 && (
                            <button
                              onClick={() => setSelectedTodayPatient(selectedTodayPatient === patient.id ? null : patient.id)}
                              className={`p-1 rounded-full transition-all duration-200 ${
                                selectedTodayPatient === patient.id
                                  ? 'bg-blue-500 text-white shadow-lg'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                              title={selectedTodayPatient === patient.id ? 'Deselect Patient' : 'Select Patient'}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </button>
                          )}
                          <span 
                            className={`cursor-pointer hover:text-blue-600 transition-colors duration-200 ${
                              patient.today_appointments && patient.today_appointments.length > 0 ? 'hover:underline' : ''
                            }`}
                            onClick={() => {
                              if (patient.today_appointments && patient.today_appointments.length > 0) {
                                setSelectedTodayPatient(selectedTodayPatient === patient.id ? null : patient.id);
                              }
                            }}
                          >
                            {patient.first_name} {patient.last_name || ''}
                          </span>
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
                        <div className={`flex ${patient.today_appointments && patient.today_appointments.length > 0 ? 'gap-0.5' : 'gap-3'}`}>
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
                          {patient.today_appointments && patient.today_appointments.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const firstAppointment = patient.today_appointments[0];
                                setAppointmentToComplete({ id: firstAppointment.id, patientName: patient.first_name });
                                setShowAppointmentActionsDialog(true);
                              }}
                              className="h-9 w-9 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200 rounded-lg"
                              title="Manage Appointment"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          )}

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
                        <span className="font-medium">Age:</span>
                        <p>{patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years` : 'Not specified'}</p>
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
                    

                    
                    {/* In-Progress Treatments */}
                    {patientsInProgressTreatments[patient.id] && patientsInProgressTreatments[patient.id].length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300 bg-gray-25 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-gray-700" />
                            <span className="font-medium text-gray-700">In-Progress Treatments</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDentalChart(patient)}
                            className="h-6 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            View All ({patientsInProgressTreatments[patient.id].length})
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {patientsInProgressTreatments[patient.id].slice(0, 2).map((treatment) => (
                            <div key={treatment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                                <span className="font-medium text-gray-800">{treatment.treatment_type}</span>
                                <span className="text-gray-600">• Tooth {treatment.tooth_number}</span>
                                {treatment.created_by && (
                                  <span className="text-gray-600">• {treatment.created_by}</span>
                                )}
                                {treatment.treatment_date && (
                                  <span className="text-gray-600">• 📅 {new Date(treatment.treatment_date).toLocaleDateString()}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1 sm:mt-0">
                                <Badge className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                  {treatment.treatment_status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContinueTreatment(patient, treatment)}
                                  className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  Continue
                                </Button>
                              </div>
                            </div>
                          ))}
                          {patientsInProgressTreatments[patient.id].length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{patientsInProgressTreatments[patient.id].length - 2} more treatments
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Upcoming Appointments */}
                    {patientsWithAppointments[patient.id] && 
                     patientsWithAppointments[patient.id].filter((appointment: any) => appointment.status === 'Confirmed').length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300 bg-gray-25 rounded-lg p-3">
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
                    
                    {/* Follow-ups Display (only when follow-ups filter is active) */}
                    {activeFilter === 'follow-ups' && followUpPatients.filter((fu) => fu.patient_id === patient.id).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300 bg-gray-25 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-700" />
                          <span className="font-medium text-gray-700">Follow-ups</span>
                        </div>
                        <div className="space-y-2">
                          {followUpPatients
                            .filter((fu) => fu.patient_id === patient.id)
                            .map((followUp) => {
                              const isOverdue = followUp.due_date && new Date(followUp.due_date) < new Date();
                              const isDueSoon = followUp.due_date && new Date(followUp.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
                              
                              return (
                                <div key={followUp.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {followUp.due_date ? new Date(followUp.due_date).toLocaleDateString() : 'No date set'}
                                      </span>
                                      {isOverdue && (
                                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                      )}
                                      {isDueSoon && !isOverdue && (
                                        <Badge variant="secondary" className="text-xs">Due Soon</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {followUp.reason || 'No reason specified'}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setFollowUpToComplete({ id: followUp.id, patientName: patient.first_name });
                                      setShowCompleteConfirmDialog(true);
                                    }}
                                    className="h-8 px-3 text-xs border-green-500 text-green-700 hover:bg-green-100 hover:border-green-600"
                                  >
                                    Complete
                                  </Button>
                                </div>
                              );
                            })}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMedicalRecord(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Add Medical Record"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Records</span>
                          </Button>
                        </div>
                        
                        {/* Last row with Prescription and Communication buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddPrescription(patient)}
                            className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                            title="Add Prescription"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Prescription</span>
                          </Button>
                          {patient.today_appointments && patient.today_appointments.length > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const firstAppointment = patient.today_appointments[0];
                                handleCompleteAppointment(firstAppointment.id, patient.first_name);
                              }}
                              className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                              title="Complete Today's Appointment"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSearchTerm('');
                                  setActiveFilter('all');
                                  setFilteredPatients(patients);
                                  setDisplayedPatients(patients.slice(0, recordsPerPage));
                                  setCurrentPage(1);
                                }}
                                className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                                title="Clear Search & Filters"
                              >
                                <X className="w-4 h-4" />
                                <span className="text-sm font-medium">Clear</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallPatient(patient.phone)}
                                className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                                title="Call Patient"
                              >
                                <Phone className="w-4 h-4" />
                                <span className="text-sm font-medium">Call</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsAppPatient(patient.phone)}
                                className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                                title="WhatsApp Patient"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                <span className="text-sm font-medium">WhatsApp</span>
                              </Button>
                            </>
                          )}
                        </div>
                        {patient.today_appointments && patient.today_appointments.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallPatient(patient.phone)}
                              className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                              title="Call Patient"
                            >
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">Call</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWhatsAppPatient(patient.phone)}
                              className="h-10 px-3 flex items-center gap-2 justify-center bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all duration-200"
                              title="WhatsApp Patient"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                              <span className="text-sm font-medium">WhatsApp</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {displayedPatients.length === 0 && (
                <div className="text-center py-8">
                  {activeFilter === 'in-progress' ? (
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  ) : activeFilter === 'lab-orders' ? (
                    <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  ) : activeFilter === 'follow-ups' ? (
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  ) : (
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  )}
                  <p className="text-gray-600 font-medium">
                    {!dataLoaded 
                      ? "Click 'Search' to load patients" 
                      : searchTerm 
                        ? "No patients found matching your search" 
                        : activeFilter === 'in-progress'
                          ? "No patients with in-progress treatments"
                          : activeFilter === 'lab-orders'
                            ? "No patients with lab orders"
                            : activeFilter === 'follow-ups'
                              ? "No patients with follow-ups"
                              : "No appointments scheduled for today"
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {!dataLoaded 
                      ? "Load patient data to get started" 
                      : searchTerm
                        ? "Try a different search term or add a new patient"
                        : activeFilter === 'in-progress'
                          ? "Complete some treatments to see them here"
                          : activeFilter === 'lab-orders'
                            ? "Create lab orders for patients to see them here"
                            : activeFilter === 'follow-ups'
                              ? "Schedule follow-ups for patients to see them here"
                              : "Use the search function to find specific patients or create new appointments"
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
                    numberingSystem={dentalNumberingSystem}
                    selectedTreatmentToContinue={selectedTreatmentToContinue}
                    onTreatmentContinued={() => setSelectedTreatmentToContinue(null)}
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
                          {dentalTreatments
                            .filter(treatment => treatment.treatment_date) // Only show treatments with dates
                            .sort((a, b) => {
                              // First sort by date (newest first)
                              const dateComparison = new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime();
                              if (dateComparison !== 0) return dateComparison;
                              // If dates are the same, sort by creation time (newest first)
                              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            })
                            .slice(0, 5)
                            .map((treatment) => (
                            <div key={treatment.id} className="border rounded p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{treatment.treatment_type}</h4>
                                  <p className="text-sm text-gray-600">Tooth {treatment.tooth_number}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(treatment.treatment_date).toLocaleDateString()}
                                  </p>
                                  {treatment.created_by && (
                                    <p className="text-sm text-blue-600 mt-1">
                                      <User className="h-3 w-3 inline mr-1" />
                                      {treatment.created_by.includes(',') ? 'Doctors: ' : 'Doctor: '}{treatment.created_by}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getTreatmentStatusColor(treatment.treatment_status)}>
                                  {treatment.treatment_status}
                                </Badge>
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
                    <span className="font-medium">Age:</span>
                    <p>{selectedPatientHistory?.date_of_birth ? `${calculateAge(selectedPatientHistory.date_of_birth)} years` : 'Not specified'}</p>
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 mb-6 bg-transparent">
                  <TabsTrigger value="dental" className="text-xs sm:text-sm">Dental Treatments</TabsTrigger>
                  <TabsTrigger value="appointments" className="text-xs sm:text-sm">Appointments</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="text-xs sm:text-sm">Prescriptions</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes & Records</TabsTrigger>
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
                                {treatment.created_by && (
                                  <p className="text-blue-600 mt-1">
                                    <User className="h-3 w-3 inline mr-1" />
                                    {treatment.created_by.includes(',') ? 'Doctors: ' : 'Doctor: '}{treatment.created_by}
                                  </p>
                                )}
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
                                  {/* Show dentist info only if there are multiple dentists and appointment has dentist_id */}
                                  {dentists.length > 1 && appointment.dentist_id && (
                                    <p className="text-sm text-blue-600 mt-1">
                                      <Stethoscope className="h-3 w-3 inline mr-1" />
                                      Attended by: {getDentistName(appointment.dentist_id)}
                                    </p>
                                  )}
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
              <div className="flex gap-2 justify-center sm:justify-end pt-4">
                <Button variant="outline" onClick={() => setShowMedicalHistory(false)} className="w-full sm:w-auto px-6 py-3 text-base">
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
            // Dialog onOpenChange called
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
                  {labWorkOrders
                    .sort((a, b) => {
                      // Sorting by created_at
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }) // Last ordered first
                    .map((order) => (
                    <Card key={order.id} className="border-2 border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{order.work_type.charAt(0).toUpperCase() + order.work_type.slice(1)}</CardTitle>
                            <p className="text-sm text-gray-600">
                              Lab Type: {order.work_type.charAt(0).toUpperCase() + order.work_type.slice(1)}
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
                            <p>{formatDate(order.order_date)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Expected Date:</span>
                            <p>{order.expected_completion_date ? formatDate(order.expected_completion_date) : 'Not specified'}</p>
                          </div>
                          {order.lab_name && order.lab_name.trim() !== '' && (
                            <div>
                              <span className="font-medium">Lab Facility:</span>
                              <p>{order.lab_name}</p>
                            </div>
                          )}
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
                              // Update Status button clicked for order
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

        {/* Delete Treatment Confirmation Dialog */}
        <Dialog open={showDeleteTreatmentConfirmDialog} onOpenChange={setShowDeleteTreatmentConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Treatment
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this treatment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {treatmentToDelete && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium">{treatmentToDelete.treatment_type}</p>
                  <p className="text-sm text-gray-600">Tooth {treatmentToDelete.tooth_number}</p>
                  <p className="text-sm text-gray-500">
                    {treatmentToDelete.treatment_date && new Date(treatmentToDelete.treatment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline" 
                onClick={() => {
                  setShowDeleteTreatmentConfirmDialog(false);
                  setTreatmentToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive" 
                onClick={confirmDeleteTreatment}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>



        {/* Appointment Actions Dialog */}
        <Dialog open={showAppointmentActionsDialog} onOpenChange={setShowAppointmentActionsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Manage Appointment
              </DialogTitle>
              <DialogDescription>
                Choose an action for {appointmentToComplete?.patientName}'s appointment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {/* Complete Option */}
              <Button
                onClick={() => {
                  if (appointmentToComplete) {
                    handleCompleteAppointment(appointmentToComplete.id, appointmentToComplete.patientName);
                  }
                }}
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete Appointment
              </Button>

              {/* Cancel Option */}
              <Button
                onClick={() => {
                  if (appointmentToComplete) {
                    handleCancelAppointment(appointmentToComplete.id, appointmentToComplete.patientName);
                  }
                }}
                variant="destructive"
                className="w-full justify-start"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>

              {/* Reschedule Option */}
              <Button
                onClick={() => {
                  if (appointmentToComplete) {
                    handleRescheduleAppointment(appointmentToComplete.id, appointmentToComplete.patientName);
                  }
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reschedule Appointment
              </Button>

              {/* Follow Up Option */}
              <Button
                onClick={() => {
                  if (appointmentToComplete) {
                    handleFollowUpAppointment(appointmentToComplete.id, appointmentToComplete.patientName);
                  }
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                Add to Follow-up List
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAppointmentActionsDialog(false);
                  setAppointmentToComplete(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Follow-up Form Dialog */}
        <Dialog open={showFollowUpForm} onOpenChange={setShowFollowUpForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Schedule Follow-up
              </DialogTitle>
              <DialogDescription>
                Set follow-up details for {appointmentToComplete?.patientName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Follow-up Date */}
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                
                {/* Quick Date Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 3);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    3 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 5);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    5 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    1 Week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 10);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    10 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 14);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    2 Weeks
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 1);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                    }}
                    className="text-xs"
                  >
                    1 Month
                  </Button>
                </div>
              </div>

              {/* Follow-up Reason */}
              <div className="space-y-2">
                <Label htmlFor="followUpReason">Reason for Follow-up</Label>
                
                {/* Common Reasons Dropdown */}
                <Select value={followUpReason} onValueChange={setFollowUpReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a common reason or enter custom..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Post-treatment check-up">Post-treatment check-up</SelectItem>
                    <SelectItem value="Suture removal">Suture removal</SelectItem>
                    <SelectItem value="Healing progress review">Healing progress review</SelectItem>
                    <SelectItem value="Pain management follow-up">Pain management follow-up</SelectItem>
                    <SelectItem value="Medication review">Medication review</SelectItem>
                    <SelectItem value="Complication monitoring">Complication monitoring</SelectItem>
                    <SelectItem value="Treatment outcome assessment">Treatment outcome assessment</SelectItem>
                    <SelectItem value="Oral hygiene instruction">Oral hygiene instruction</SelectItem>
                    <SelectItem value="Preventive care reminder">Preventive care reminder</SelectItem>
                    <SelectItem value="Lab results review">Lab results review</SelectItem>
                    <SelectItem value="Treatment plan discussion">Treatment plan discussion</SelectItem>
                    <SelectItem value="Custom reason...">Custom reason...</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom Reason Textarea (shown when "Custom reason..." is selected) */}
                {followUpReason === "Custom reason..." && (
                  <Textarea
                    id="customFollowUpReason"
                    value={customFollowUpReason}
                    onChange={(e) => setCustomFollowUpReason(e.target.value)}
                    placeholder="Enter custom reason for follow-up..."
                    rows={2}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFollowUpForm(false);
                  setFollowUpDate('');
                  setFollowUpReason('');
                  setCustomFollowUpReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFollowUp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Schedule Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Follow-up Confirmation Dialog */}
        <Dialog open={showCompleteConfirmDialog} onOpenChange={setShowCompleteConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Follow-up
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to complete this follow-up for {followUpToComplete?.patientName}?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-gray-600">
                This will mark the follow-up as completed and remove it from the active list.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteConfirmDialog(false);
                  setFollowUpToComplete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (followUpToComplete) {
                    handleRemoveFromFollowUp(followUpToComplete.id, followUpToComplete.patientName);
                    setShowCompleteConfirmDialog(false);
                    setFollowUpToComplete(null);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
