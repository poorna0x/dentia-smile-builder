import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { patientApi, treatmentPlanApi, medicalRecordApi } from '@/lib/patient-management';
import { dentalTreatmentApi, toothConditionApi, dentalNoteApi, toothChartUtils } from '@/lib/dental-treatments';
import { supabase } from '@/lib/supabase';
import ToothChart from '@/components/ToothChart';
import { Plus, Search, Edit, Trash2, User, Calendar, FileText, Activity, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Circle } from 'lucide-react';

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
  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [duplicateType, setDuplicateType] = useState<'phone' | 'name' | 'both'>('phone');
  const [nameSimilarity, setNameSimilarity] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Dental chart state
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [selectedPatientForDental, setSelectedPatientForDental] = useState<Patient | null>(null);
  const [dentalTreatments, setDentalTreatments] = useState<any[]>([]);
  const [toothConditions, setToothConditions] = useState<any[]>([]);
  const [dentalNotes, setDentalNotes] = useState<any[]>([]);
  const [loadingDentalData, setLoadingDentalData] = useState(false);
  
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

  // Load patients on component mount
  useEffect(() => {
    console.log('Component: Clinic context changed:', clinic);
    if (clinic?.id) {
      console.log('Component: Loading patients for clinic:', clinic.id);
      // Don't auto-load data, wait for user action
    } else {
      console.log('Component: No clinic ID available');
    }
  }, [clinic?.id]);

  // Filter patients based on search term with improved partial matching
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If no search term, show all patients (but only if data is loaded)
      if (dataLoaded) {
        setFilteredPatients(patients);
      } else {
        setFilteredPatients([]);
      }
    } else {
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = patients.filter(patient => {
        const firstName = patient.first_name.toLowerCase();
        const lastName = patient.last_name ? patient.last_name.toLowerCase() : '';
        const fullName = `${firstName} ${lastName}`.trim();
        const phone = patient.phone;
        const email = patient.email ? patient.email.toLowerCase() : '';

        // 1. Exact matches (highest priority)
        if (firstName === searchLower || 
            lastName === searchLower || 
            fullName === searchLower ||
            phone === searchTerm ||
            email === searchLower) {
          return true;
        }

        // 2. Partial matches (starts with) - more restrictive
        if (firstName.startsWith(searchLower) || 
            lastName.startsWith(searchLower) ||
            fullName.startsWith(searchLower) ||
            phone.startsWith(searchTerm) ||
            email.startsWith(searchLower)) {
          return true;
        }

        // 3. Contains matches (anywhere in the text) - only if search term is 3+ characters
        if (searchLower.length >= 3) {
          if (firstName.includes(searchLower) || 
              lastName.includes(searchLower) ||
              fullName.includes(searchLower) ||
              phone.includes(searchTerm) ||
              email.includes(searchLower)) {
            return true;
          }
        }

        // 4. Word boundary matches (for multi-word searches)
        const searchWords = searchLower.split(' ').filter(word => word.length > 0);
        if (searchWords.length > 1) {
          return searchWords.every(word => 
            firstName.includes(word) || 
            lastName.includes(word) ||
            fullName.includes(word)
          );
        }

        return false;
      });
      setFilteredPatients(filtered);
    }
    // Reset pagination when search changes
    setCurrentPage(1);
  }, [searchTerm, patients, dataLoaded]);

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
    
    if (!dataLoaded) {
      // If no data loaded yet, load all patients first
      await loadPatients();
    }
    
    // Search is already handled by useEffect, just show feedback
    const searchResults = filteredPatients.length;
    
    if (searchTerm.trim() === '') {
      toast({
        title: "Search",
        description: "Please enter a search term",
      });
      return;
    }
    
    toast({
      title: "Search Complete",
      description: `Found ${searchResults} patients matching "${searchTerm}"`,
    });
  };

  const handleShowAll = () => {
    setShowConfirmDialog(true);
  };

  const confirmShowAll = async () => {
    setShowConfirmDialog(false);
    
    // If no data loaded yet, load it first
    if (!dataLoaded && clinic?.id) {
      setLoading(true);
      try {
        await loadPatients();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load patients",
          variant: "destructive"
        });
        return;
      } finally {
        setLoading(false);
      }
    }
    
    // Show all patients from database (not filtered by search)
    setShowAllData(true);
    setFilteredPatients(patients); // Reset to show all patients, not search results
    setCurrentPage(1);
    
    toast({
      title: "All Database Patients",
      description: `Showing all ${totalPatients} patients with pagination (50 per page)`,
    });
  };

  const handleShowPaginated = () => {
    setShowAllData(false);
    setCurrentPage(1);
    
    // Restore search results if there was a search
    if (searchTerm.trim() !== '') {
      const filtered = patients.filter(patient =>
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.last_name && patient.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        patient.phone.includes(searchTerm) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
      toast({
        title: "Search Results",
        description: `Showing ${filtered.length} patients from search`,
      });
    } else {
      setFilteredPatients(patients);
      toast({
        title: "All Patients",
        description: `Showing all ${patients.length} patients`,
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const handleAddMedicalRecord = async () => {
    if (!clinic?.id) return;
    
    try {
      await medicalRecordApi.create(clinic.id, medicalRecordForm);
      toast({
        title: "Success",
        description: "Medical record added successfully"
      });
      setShowMedicalRecordForm(false);
      setMedicalRecordForm({
        patient_id: '',
        record_type: '',
        title: '',
        description: '',
        file_url: '',
        record_date: '',
        created_by: '',
        notes: ''
      });
    } catch (error) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
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
              <div className="relative" autoComplete="off">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  name="search"
                  id="patient-search"
                />
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
                onClick={() => {
                  setSearchTerm('');
                  setFilteredPatients([]);
                  setDisplayedPatients([]);
                  setDataLoaded(false);
                }}
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                Clear
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
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>
                    Enter patient information below
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
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowPatientForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPatient}>
                    Add Patient
                  </Button>
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
                <Card key={patient.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {patient.first_name} {patient.last_name || ''}
                        </CardTitle>
                        <CardDescription>
                          Phone: {patient.phone} | Email: {patient.email}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDentalChart(patient)}
                          className="flex items-center gap-2"
                        >
                          <Circle className="w-4 h-4" />
                          Dental Chart
                        </Button>
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
                                <Badge variant={treatment.treatment_status === 'Completed' ? 'default' : 'secondary'}>
                                  {treatment.treatment_status}
                                </Badge>
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
      </div>
    </>
  );
}
