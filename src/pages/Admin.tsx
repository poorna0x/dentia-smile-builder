import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedAppointments } from '@/hooks/useOptimizedAppointments'
import { useSettings } from '@/hooks/useSettings';
import { useClinic } from '@/contexts/ClinicContext';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { usePermissions } from '@/hooks/usePermissions';
import { appointmentsApi, settingsApi, disabledSlotsApi, DisabledSlot, dentistsApi, Dentist, staffPermissionsApi } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { QueryOptimizer } from '@/lib/db-optimizations';
import { showLocalNotification, requestNotificationPermission } from '@/lib/notifications';
import LogoutButton from '@/components/LogoutButton';
import { sendAppointmentConfirmation } from '@/lib/email';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Edit, 
  X, 
  User,
  MessageCircle,
  Search,
  LogOut,
  Plus,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Users,
  Save
} from 'lucide-react';

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Types
interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled';
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string[];  // Changed to array to support multiple breaks
  breakEnd: string[];    // Changed to array to support multiple breaks
  slotInterval: number;
}

interface SchedulingSettings {
  appointmentsDisabled: boolean;
  disableMessage: string;
  disableUntilDate: string;
  disableUntilTime: string;
  weeklyHolidays: string[];
  customHolidays: string[];
  showStatsCards: boolean;
  minimumAdvanceNotice: number; // Hours in advance required for booking
  daySchedules: {
    [key: string]: DaySchedule;
  };
}

const Admin = () => {
  // 🎯 AUTOMATIC PATIENT LINKING: Both appointment booking dialogs now use automatic patient linking
  // - Database trigger automatically finds existing patients by phone/name or creates new ones
  // - No manual search needed - works exactly like the public booking page
  // - Both "General New Appointment" and "New Appointment for Same Client" work seamlessly
  
  const navigate = useNavigate();
  
  // Ensure page starts at top
  useScrollToTop();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [showNewAppointmentForClient, setShowNewAppointmentForClient] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: ''
  });
  const [newAppointmentForClient, setNewAppointmentForClient] = useState({
    date: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(),
    time: '',
    selectedDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(),
    isCalendarOpen: false
  });
  const [bookedSlotsForNewAppointment, setBookedSlotsForNewAppointment] = useState<string[]>([]);
  const [isLoadingSlotsForNewAppointment, setIsLoadingSlotsForNewAppointment] = useState(false);
  const [showUpcomingAppointments, setShowUpcomingAppointments] = useState(false);
  const [upcomingPeriod, setUpcomingPeriod] = useState<'tomorrow' | 'next-week' | 'all'>('tomorrow');
  const [generalNewAppointment, setGeneralNewAppointment] = useState({
    name: '',
    phone: '',
    email: '',
    date: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(),
    time: '',
    selectedDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(),
    isCalendarOpen: false
  });
  const [bookedSlotsForGeneral, setBookedSlotsForGeneral] = useState<string[]>([]);
  const [isLoadingSlotsForGeneral, setIsLoadingSlotsForGeneral] = useState(false);

  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Disabled slots state
  const [disabledSlots, setDisabledSlots] = useState<DisabledSlot[]>([]);
  const [showDisabledSlotsDialog, setShowDisabledSlotsDialog] = useState(false);
  const [newDisabledSlot, setNewDisabledSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00'
  });

  // Patient search and validation state
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<any>(null);
  const [showPatientSearchDialog, setShowPatientSearchDialog] = useState(false);

  // Multi-dentist support states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [isLoadingDentists, setIsLoadingDentists] = useState(false);

  // Patient view confirmation dialog state
  const [showPatientViewDialog, setShowPatientViewDialog] = useState(false);
  const [patientToView, setPatientToView] = useState<Appointment | null>(null);

  // Staff permissions state
  const [staffPermissions, setStaffPermissions] = useState({
    canAccessSettings: false,
    canAccessPatientPortal: false
  });


  


  // Supabase hooks
  const { clinic, loading: clinicLoading } = useClinic();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    error: appointmentsError,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refresh: refreshAppointments
  } = useOptimizedAppointments()
  const { settings, loading: settingsLoading, refresh: refreshSettings } = useSettings();
  const { isDentist, isStaff, hasPermission, clearRole, userRole, refreshPermissions } = usePermissions();
  const { toast: toastHook } = useToast();

  // Load staff permissions when clinic is available
  useEffect(() => {
    if (clinic && clinic.id && isDentist) {
      loadStaffPermissions();
    }
  }, [clinic, isDentist]);

  // Load staff permissions from database
  const loadStaffPermissions = async () => {
    if (!clinic || !clinic.id) return;
    
    try {
      const permissions = await staffPermissionsApi.getByClinic(clinic.id);
      if (permissions) {
        setStaffPermissions({
          canAccessSettings: permissions.can_access_settings,
          canAccessPatientPortal: permissions.can_access_patient_portal
        });
      }
    } catch (error) {
      console.error('Error loading staff permissions:', error);
    }
  };

  // Auto-save staff permissions to database
  const saveStaffPermissions = async (newPermissions?: {
    canAccessSettings?: boolean;
    canAccessPatientPortal?: boolean;
  }) => {
    if (!clinic || !clinic.id) return;
    
    // Use new permissions if provided, otherwise use current state
    const permissionsToSave = {
      canAccessSettings: newPermissions?.canAccessSettings ?? staffPermissions.canAccessSettings,
      canAccessPatientPortal: newPermissions?.canAccessPatientPortal ?? staffPermissions.canAccessPatientPortal
    };
    
    console.log('💾 Saving staff permissions:', {
      clinicId: clinic.id,
      permissions: permissionsToSave
    });
    
    try {
      const result = await staffPermissionsApi.upsert(clinic.id, {
        can_access_settings: permissionsToSave.canAccessSettings,
        can_access_patient_portal: permissionsToSave.canAccessPatientPortal
      });
      
      console.log('✅ Staff permissions saved successfully:', result);
      
      // Refresh permissions in usePermissions hook
      await refreshPermissions();
    } catch (error) {
      console.error('❌ Error saving staff permissions:', error);
      toastHook({
        title: "❌ Error",
        description: "Failed to save staff permissions. Please try again.",
        variant: "destructive"
      });
    }
  };

      // Lightweight real-time simulation (silent)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  


  // Default scheduling settings
  const [schedulingSettings, setSchedulingSettings] = useState<SchedulingSettings>({
    appointmentsDisabled: false,
    disableMessage: "We're currently not accepting new appointments. Please check back later or contact us directly.",
    disableUntilDate: '',
    disableUntilTime: '',
    weeklyHolidays: [],
    customHolidays: [],
    showStatsCards: true,
    minimumAdvanceNotice: 24, // Default: 24 hours advance notice
    daySchedules: {
      Mon: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Tue: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Wed: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Thu: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Fri: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Sat: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
      Sun: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 }
    }
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Day name to number mapping
  const dayNumbers = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check if admin is logged in using new auth system
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/admin', { replace: true });
      return;
    }
    
    // Request notification permission for admin
    const setupNotifications = async () => {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission ? 'granted' : 'denied');
      
      if (permission) {
        // Admin notification permission granted
      } else {
        // Admin notification permission denied
      }
    };
    
    setupNotifications();
    

    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    

  }, [navigate]);

  // Sync local state with database settings
  useEffect(() => {
    if (settings) {
      // Syncing settings from database
      
      // Convert database format to frontend format
      const convertedSettings: SchedulingSettings = {
        appointmentsDisabled: settings.disabled_appointments || false,
        disableMessage: "We're currently not accepting new appointments. Please check back later or contact us directly.",
        disableUntilDate: settings.disable_until_date || '',
        disableUntilTime: settings.disable_until_time || '',
        weeklyHolidays: (settings.weekly_holidays || []).map(dayNumber => {
          // Convert number back to day name
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return dayNames[dayNumber] || 'Sun';
        }),
        customHolidays: settings.custom_holidays || [],
        showStatsCards: settings.show_stats_cards !== false, // Default to true if not set
        minimumAdvanceNotice: settings.minimum_advance_notice !== null && settings.minimum_advance_notice !== undefined ? settings.minimum_advance_notice : 24, // Default: 24 hours
        daySchedules: {
          Mon: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Tue: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Wed: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Thu: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Fri: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Sat: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 },
          Sun: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: ['13:00'], breakEnd: ['14:00'], slotInterval: 30 }
        }
      };

      // Convert day schedules from database format
      if (settings.day_schedules) {
        Object.entries(settings.day_schedules).forEach(([dayNumber, schedule]) => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[parseInt(dayNumber)] || 'Sun';
          
          // Handle transition from single string to array for breaks
          const breakStart = Array.isArray(schedule.break_start) 
            ? schedule.break_start 
            : [schedule.break_start || '13:00'];
          const breakEnd = Array.isArray(schedule.break_end) 
            ? schedule.break_end 
            : [schedule.break_end || '14:00'];
          
          convertedSettings.daySchedules[dayName as keyof typeof convertedSettings.daySchedules] = {
            enabled: schedule.enabled ?? true,
            startTime: schedule.start_time || '09:00',
            endTime: schedule.end_time || '18:00',
            breakStart: breakStart,
            breakEnd: breakEnd,
            slotInterval: schedule.slot_interval_minutes || 30
          };
        });
      }

      setSchedulingSettings(convertedSettings);
    }
  }, [settings]);

  // Realtime subscriptions for live updates
  useEffect(() => {
    if (!clinic?.id) return;

    // Setting up admin lightweight real-time simulation for clinic

    const setupLightweightRealtime = async () => {
      try {
        const { useLightweightRealtime } = await import('@/lib/lightweight-realtime');
        const { subscribeToAppointments, subscribeToSettings, subscribeToDisabledSlots } = useLightweightRealtime(clinic.id);

        // Subscribe to appointments with smart polling (silent)
        const unsubscribeAppointments = await subscribeToAppointments((update) => {
          if (update.type === 'UPDATED') {
            refreshAppointments();
          }
        });

        // Subscribe to settings with longer intervals (silent)
        const unsubscribeSettings = await subscribeToSettings((update) => {
          if (update.type === 'UPDATED') {
            refreshSettings();
          }
        });

        // Subscribe to disabled slots (silent)
        const unsubscribeDisabledSlots = await subscribeToDisabledSlots((update) => {
          if (update.type === 'UPDATED') {
            setTimeout(() => {
              if (typeof loadDisabledSlots === 'function') {
                loadDisabledSlots();
              }
            }, 100);
          }
        });

        // Admin lightweight real-time simulation active (silent)

        // Cleanup function
        return () => {
          // Cleaning up admin lightweight real-time subscriptions
          unsubscribeAppointments();
          unsubscribeSettings();
          unsubscribeDisabledSlots();
        };
      } catch (error) {
        console.error('❌ Failed to setup admin lightweight real-time:', error);
        // Silent failure - no user notification
      }
    };

    // Temporarily disable lightweight real-time to test navigation
    // const cleanup = setupLightweightRealtime();
    // return () => {
    //   cleanup.then(unsubscribe => unsubscribe?.());
    // };
  }, [clinic?.id, refreshAppointments, refreshSettings]);

  // Patient search and validation functions
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim() || !clinic?.id) return;
    
    setIsSearchingPatients(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, email, date_of_birth, allergies')
        .eq('clinic_id', clinic.id)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      setPatientSearchResults(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error searching patients');
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleSelectPatientForBooking = (patient: any) => {
    setSelectedPatientForBooking(patient);
    setGeneralNewAppointment(prev => ({
      ...prev,
      name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
      phone: patient.phone,
      email: patient.email || ''
    }));
    setShowPatientSearchDialog(false);
    toast.success(`Selected patient: ${patient.first_name} ${patient.last_name || ''}`);
  };

  const clearSelectedPatient = () => {
    setSelectedPatientForBooking(null);
    setGeneralNewAppointment(prev => ({
      ...prev,
      name: '',
      phone: '',
      email: ''
    }));
  };

  // Note: Logout is now handled by the LogoutButton component
  // which uses the unified authentication system

  // WhatsApp message templates
  const getWhatsAppMessage = (type: 'confirmation' | 'cancellation' | 'reminder', appointment: Appointment) => {
    const baseUrl = window.location.origin;
    const bookingLink = `${baseUrl}/appointment`;
    
    switch (type) {
      case 'confirmation':
        return `✅ Appointment Confirmed!

Dear ${appointment.name},

Your appointment is confirmed for ${format(new Date(appointment.date), 'MMMM dd, yyyy')} at ${appointment.time}.

📍 Location: Jeshna Dental Clinic
🏥 Address: 123 Dental Street, Bangalore, Karnataka 560001
🗺️ Map: https://maps.google.com/?q=Jeshna+Dental+Clinic+Bangalore
📞 Phone: 6363116263

Please arrive 10 minutes early. If you need to reschedule, please call us at least 24 hours in advance.

Looking forward to seeing you! 😊

Best regards,
Jeshna Dental Clinic Team`;

      case 'cancellation':
        return `❌ Appointment Cancelled

Dear ${appointment.name},

We're sorry, but your appointment for ${format(new Date(appointment.date), 'MMMM dd, yyyy')} at ${appointment.time} has been cancelled.

You can rebook your appointment here: ${bookingLink}

📍 Location: Jeshna Dental Clinic
🏥 Address: 123 Dental Street, Bangalore, Karnataka 560001
🗺️ Map: https://maps.google.com/?q=Jeshna+Dental+Clinic+Bangalore
📞 Phone: 6363116263

We apologize for any inconvenience. Please feel free to contact us if you have any questions.

Best regards,
Jeshna Dental Clinic Team`;

      case 'reminder':
        return `⏰ Appointment Reminder

Hi ${appointment.name},

This is a friendly reminder for your appointment tomorrow at ${appointment.time}.

📍 Location: Jeshna Dental Clinic
🏥 Address: 123 Dental Street, Bangalore, Karnataka 560001
🗺️ Map: https://maps.google.com/?q=Jeshna+Dental+Clinic+Bangalore
📞 Phone: 6363116263

Please arrive 10 minutes early. If you need to reschedule, please call us at least 24 hours in advance.

Looking forward to seeing you! 😊

Best regards,
Jeshna Dental Clinic Team`;

      default:
        return '';
    }
  };

  const handleWhatsApp = (phone: string, type: 'confirmation' | 'cancellation' | 'reminder' | 'direct', appointment: Appointment) => {
    // Remove any non-numeric characters from phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (type === 'direct') {
      // Just open WhatsApp without any pre-filled message
      window.open(`https://wa.me/91${cleanPhone}`, '_blank');
      return;
    }
    
    const message = getWhatsAppMessage(type, appointment);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleSendReminder = (appointment: Appointment) => {
    const confirmSend = window.confirm(`Send WhatsApp reminder to ${appointment.name}?`);
    
    if (confirmSend) {
      handleWhatsApp(appointment.phone, 'reminder', appointment);
      // Mark this reminder as sent
      setSentReminders(prev => new Set([...prev, appointment.id]));
      toast.success(`Reminder sent to ${appointment.name}`);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditingAppointment({ ...appointment }); // Create a copy for editing
    setShowEditDialog(true);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      if (updateAppointment) {
        await updateAppointment(appointmentId, { status: newStatus as any });
      }
      
      // Force refresh appointments to get immediate update
      if (refreshAppointments) {
        await refreshAppointments();
      }
      
      // Update the editing appointment state
      if (editingAppointment && editingAppointment.id === appointmentId) {
        setEditingAppointment(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      
      toast.success(`Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  // Load disabled slots for the current month
  const loadDisabledSlots = async () => {
    if (!clinic?.id) return;
    
    try {
      const startDate = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');
      const slots = await disabledSlotsApi.getByClinicAndDateRange(clinic.id, startDate, endDate);
      setDisabledSlots(slots);
    } catch (error) {
      console.error('Error loading disabled slots:', error);
      toast.error('Failed to load disabled slots');
    }
  };

  // Add a new disabled slot
  const handleAddDisabledSlot = async () => {
    if (!clinic?.id) {
      toast.error('Clinic information not available');
      return;
    }

    // Validate inputs
    if (!newDisabledSlot.date) {
      toast.error('Please select a date');
      return;
    }

    if (!newDisabledSlot.startTime || !newDisabledSlot.endTime) {
      toast.error('Please select start and end times');
      return;
    }

    if (newDisabledSlot.startTime >= newDisabledSlot.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(newDisabledSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error('Cannot disable slots in the past');
      return;
    }
    
    try {
      // Creating disabled slot

      const slot = await disabledSlotsApi.create({
        clinic_id: clinic.id,
        date: newDisabledSlot.date,
        start_time: newDisabledSlot.startTime,
        end_time: newDisabledSlot.endTime
      });
      
      // Disabled slot created successfully
      
      setDisabledSlots(prev => [...prev, slot]);
      setShowDisabledSlotsDialog(false);
      setNewDisabledSlot({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00'
      });
      toast.success('Time slot disabled successfully');
    } catch (error) {
      console.error('Error adding disabled slot:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          toast.error('This time slot is already disabled');
        } else if (error.message.includes('foreign key')) {
          toast.error('Invalid clinic ID');
        } else if (error.message.includes('permission')) {
          toast.error('Permission denied. Please check your database permissions.');
        } else {
          toast.error(`Failed to disable time slot: ${error.message}`);
        }
      } else {
        toast.error('Failed to disable time slot. Please check if the database table exists.');
      }
    }
  };

  // Remove a disabled slot
  const handleRemoveDisabledSlot = async (slotId: string) => {
    try {
      await disabledSlotsApi.delete(slotId);
      setDisabledSlots(prev => prev.filter(slot => slot.id !== slotId));
      toast.success('Time slot re-enabled');
    } catch (error) {
      console.error('Error removing disabled slot:', error);
      toast.error('Failed to re-enable time slot');
    }
  };

  // Load disabled slots when clinic changes
  useEffect(() => {
    if (clinic?.id) {
      loadDisabledSlots();
    }
  }, [clinic?.id]);



  const loadDentists = async () => {
    if (!clinic?.id) return;
    
    try {
      setIsLoadingDentists(true);
      const dentistsList = await dentistsApi.getAll(clinic.id);
      setDentists(dentistsList);
    } catch (error) {
      console.error('Failed to load dentists:', error);
      toast.error('Failed to load dentists');
    } finally {
      setIsLoadingDentists(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    // Find the appointment to complete
    const appointment = appointments?.find(apt => apt.id === appointmentId);
    if (!appointment) {
      toast.error('Appointment not found');
      return;
    }

    // Load dentists and show complete dialog
    setAppointmentToComplete(appointment);
    await loadDentists();
    setShowCompleteDialog(true);
    setShowEditDialog(false); // Close the edit dialog
  };

  const handleConfirmComplete = async () => {
    if (!appointmentToComplete || !selectedDentistId) {
      toast.error('Please select a dentist');
      return;
    }

    try {
      if (updateAppointment) {
        await updateAppointment(appointmentToComplete.id, { 
          status: 'Completed',
          dentist_id: selectedDentistId
        });
      }
      
      // Force refresh appointments to get immediate update
      if (refreshAppointments) {
        await refreshAppointments();
      }
      
      toast.success('Appointment marked as completed');
      
      // Reset and close dialogs
      setShowCompleteDialog(false);
      setAppointmentToComplete(null);
      setSelectedDentistId('');
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      try {
        if (updateAppointment) {
          await updateAppointment(appointmentId, { status: 'Cancelled' });
        }
        
        // Force refresh appointments to get immediate update
        if (refreshAppointments) {
          await refreshAppointments();
        }
        
        toast.success('Appointment cancelled');
        
        // Auto-close the edit dialog
        setShowEditDialog(false);
        
        // Show WhatsApp button for cancellation message
        const appointment = appointments?.find(apt => apt.id === appointmentId);
        if (appointment) {
          toast.info('Click the WhatsApp button to send cancellation message to patient', {
            duration: 5000,
            action: {
              label: 'Send WhatsApp',
              onClick: () => handleWhatsApp(appointment.phone, 'cancellation', appointment)
            }
          });
        }
      } catch (error) {
        toast.error('Failed to cancel appointment');
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      if (deleteAppointment) {
        await deleteAppointment(appointmentId);
      }
      
      // Force refresh appointments to get immediate update
      if (refreshAppointments) {
        await refreshAppointments();
      }
      
      toast.success('Appointment deleted permanently');
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const handleDeleteAllCancelledAppointments = async () => {
    try {
      if (!clinic?.id) {
        toast.error('Clinic information not available');
        return;
      }

      // Get all cancelled appointments for this clinic
      const allAppointments = await appointmentsApi.getAll(clinic.id);
      const cancelledAppointments = allAppointments.filter(apt => apt.status === 'Cancelled');
      
      if (cancelledAppointments.length === 0) {
        toast.info('No cancelled appointments to delete');
        return;
      }

      // Delete all cancelled appointments
      for (const appointment of cancelledAppointments) {
        if (deleteAppointment) {
          await deleteAppointment(appointment.id);
        }
      }

      // Force refresh appointments to get immediate update
      if (refreshAppointments) {
        await refreshAppointments();
      }

      toast.success(`${cancelledAppointments.length} cancelled appointments deleted permanently`);
    } catch (error) {
      console.error('Error deleting all cancelled appointments:', error);
      toast.error('Failed to delete cancelled appointments');
    }
  };



  const handleNewAppointmentForClient = (appointment: Appointment) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewAppointmentForClient({
      date: tomorrow,
      time: '',
      selectedDate: tomorrow,
      isCalendarOpen: false
    });
    setBookedSlotsForNewAppointment([]);
    
    // Close the edit dialog first
    setShowEditDialog(false);
    
    // Then open the new appointment dialog
    setShowNewAppointmentForClient(true);
    
    // Check booked slots for tomorrow's date when dialog opens
    checkBookedSlotsForNewAppointment(tomorrow);
  };

  const checkBookedSlotsForNewAppointment = async (date: Date) => {
    if (!clinic?.id) return;
    
    setIsLoadingSlotsForNewAppointment(true);
    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      const existingAppointments = await appointmentsApi.getByDate(clinic.id, appointmentDate);
      
      // Get booked time slots (exclude cancelled appointments)
      const booked = existingAppointments
        .filter(apt => apt.status !== 'Cancelled')
        .map(apt => apt.time);
      
      setBookedSlotsForNewAppointment(booked);
    } catch (error) {
      console.error('Error checking booked slots:', error);
      setBookedSlotsForNewAppointment([]);
    } finally {
      setIsLoadingSlotsForNewAppointment(false);
    }
  };

  // Generate time slots like the appointment page
  const generateTimeSlotsForNewAppointment = (dateForSlots: Date) => {
    // Get actual settings from database for the specific day
    const daySettings = getDaySettingsForGeneral(dateForSlots);
    
    // Check if the day is enabled
    if (!daySettings.enabled) {
      return [];
    }
    
    // Check if it's a holiday
    if (isDateHolidayForGeneral(dateForSlots)) {
      return [];
    }
    
    // Check if appointments are disabled globally
    if (daySettings.disabledAppointments) {
      return [];
    }

    // Get disabled slots for this date
    const dateString = format(dateForSlots, 'yyyy-MM-dd');
    const disabledSlotsForDate = disabledSlots.filter(slot => slot.date === dateString);

    const [startH, startM] = daySettings.startTime.split(':').map(Number);
    const [endH, endM] = daySettings.endTime.split(':').map(Number);

    const start = new Date(dateForSlots);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(dateForSlots);
    end.setHours(endH, endM, 0, 0);

    // Convert break arrays to Date objects for multiple breaks
    // Handle both old single string format and new array format
    const breakStartArray = Array.isArray(daySettings.breakStart) ? daySettings.breakStart : [daySettings.breakStart];
    const breakEndArray = Array.isArray(daySettings.breakEnd) ? daySettings.breakEnd : [daySettings.breakEnd];
    
    const breakPeriods = breakStartArray.map((breakStart, index) => {
      const [breakStartH, breakStartM] = breakStart.split(':').map(Number);
      const [breakEndH, breakEndM] = breakEndArray[index].split(':').map(Number);
      
      const breakStartDate = new Date(dateForSlots);
      breakStartDate.setHours(breakStartH, breakStartM, 0, 0);
      const breakEndDate = new Date(dateForSlots);
      breakEndDate.setHours(breakEndH, breakEndM, 0, 0);
      
      return { start: breakStartDate, end: breakEndDate };
    });

    const intervalMs = daySettings.slotIntervalMinutes * 60 * 1000;
    const slots: { label: string; value: string; disabled: boolean; booked: boolean }[] = [];

    for (let t = start.getTime(); t < end.getTime(); t += intervalMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + intervalMs);

      // Check if slot overlaps with any break period
      const overlapsBreak = breakPeriods.some(breakPeriod => 
        slotStart < breakPeriod.end && slotEnd > breakPeriod.start
      );

      // Check if slot overlaps with any disabled slot
      const overlapsDisabledSlot = disabledSlotsForDate.some(disabledSlot => {
        const [disabledStartH, disabledStartM] = disabledSlot.start_time.split(':').map(Number);
        const [disabledEndH, disabledEndM] = disabledSlot.end_time.split(':').map(Number);
        
        const disabledStart = new Date(dateForSlots);
        disabledStart.setHours(disabledStartH, disabledStartM, 0, 0);
        const disabledEnd = new Date(dateForSlots);
        disabledEnd.setHours(disabledEndH, disabledEndM, 0, 0);
        
        return slotStart < disabledEnd && slotEnd > disabledStart;
      });

      // Disable past times if the selected date is today
      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const isPast = isToday && slotStart.getTime() <= now.getTime();

      if (!overlapsBreak && !overlapsDisabledSlot && slotEnd <= end) {
        const label = `${format(slotStart, 'hh:mm a')} - ${format(slotEnd, 'hh:mm a')}`;
        const isBooked = bookedSlotsForNewAppointment.includes(label);
        slots.push({ 
          label, 
          value: label, 
          disabled: isPast || isBooked || overlapsDisabledSlot,
          booked: isBooked
        });
      }
    }

    return slots;
  };

  const handleCreateNewAppointmentForClient = async () => {
    if (!selectedAppointment || !newAppointmentForClient.time || !clinic?.id) {
      toast.error('Please select a time slot');
      return;
    }

    // Check if selected date is a holiday
    if (isDateHolidayForGeneral(newAppointmentForClient.selectedDate)) {
      toast.error('Clinic is closed on the selected date. Please choose another date.');
      return;
    }

    // Check if appointments are disabled
    const daySettings = getDaySettingsForGeneral(newAppointmentForClient.selectedDate);
    if (daySettings.disabledAppointments) {
      toast.error('Appointments are currently disabled. Please try again later.');
      return;
    }

    // Check if the day is enabled
    if (!daySettings.enabled) {
      toast.error('Clinic is closed on this day of the week. Please choose another date.');
      return;
    }

    try {
      console.log('🔍 Creating appointment for same client with data:', {
        clinic_id: clinic.id,
        name: selectedAppointment.name,
        phone: selectedAppointment.phone,
        email: selectedAppointment.email,
        date: format(newAppointmentForClient.selectedDate, 'yyyy-MM-dd'),
        time: newAppointmentForClient.time,
        status: 'Confirmed'
      });

      // Create new appointment with same client data but new date/time
      const newAppointment = {
        clinic_id: clinic.id,
        name: selectedAppointment.name,
        phone: selectedAppointment.phone,
        email: selectedAppointment.email,
        date: format(newAppointmentForClient.selectedDate, 'yyyy-MM-dd'),
        time: newAppointmentForClient.time,
        status: 'Confirmed' as const,
        patient_id: null  // Automatic patient linking: Database trigger will find existing patient by phone/name or create new one
      };

      console.log('🚀 Calling appointmentsApi.create for same client with:', newAppointment);
      const result = await appointmentsApi.create(newAppointment);
      console.log('✅ Appointment for same client created successfully:', result);
      
      // Clear cache to ensure fresh data
      QueryOptimizer.clearCache('appointments');
      
      // Also clear specific date cache for immediate reflection
      const appointmentDate = format(newAppointmentForClient.selectedDate, 'yyyy-MM-dd');
      QueryOptimizer.clearCache(`appointments_date_${clinic.id}_${appointmentDate}`);
      
      // Send email confirmation
      try {
        const emailSent = await sendAppointmentConfirmation({
          name: selectedAppointment.name,
          phone: selectedAppointment.phone,
          email: selectedAppointment.email,
          date: format(newAppointmentForClient.selectedDate, 'MMM dd, yyyy'),
          time: newAppointmentForClient.time,
          status: 'Confirmed',
          clinicName: clinic?.name || 'Dental Clinic',
          clinicPhone: clinic?.contact_phone || '',
          clinicEmail: clinic?.contact_email || ''
        });
        
        if (emailSent) {
          console.log('✅ Email confirmation sent successfully');
        } else {
          console.warn('⚠️ Failed to send email confirmation');
        }
      } catch (emailError) {
        console.error('❌ Error sending email confirmation:', emailError);
      }

      toast.success(`New appointment created for ${selectedAppointment.name} on ${format(newAppointmentForClient.selectedDate, 'MMM dd, yyyy')} at ${newAppointmentForClient.time}`);
      setShowNewAppointmentForClient(false);
      setShowEditDialog(false);
    } catch (error) {
      console.error('❌ Error creating new appointment for same client:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast.error('Failed to create new appointment');
    }
  };

  // Phone number formatting function (same as appointment page)
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
    }
    
    // Return original if no formatting needed
    return cleaned;
  };

  // Phone number validation function (same as appointment page)
  const validatePhone = (phoneNumber: string): boolean => {
    // Format the phone number first
    const formatted = formatPhoneNumber(phoneNumber);
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (formatted.length === 10 && /^[6-9]\d{9}$/.test(formatted)) {
      return true;
    }
    
    return false;
  };

  // Name formatting function (same as appointment page)
  const formatName = (name: string): string => {
    // Remove extra spaces and trim
    let formatted = name.trim().replace(/\s+/g, ' ');
    
    // Convert to title case (first letter of each word capitalized)
    formatted = formatted.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    
    return formatted;
  };

  // Email validation function (same as appointment page)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateGeneralAppointment = async () => {
    // Validation checks (same as appointment page)
    if (!generalNewAppointment.name || !generalNewAppointment.phone || !generalNewAppointment.time || !clinic?.id) {
      toast.error('Please fill in all required fields and select a time slot');
      return;
    }

    // Validate phone number
    if (!validatePhone(generalNewAppointment.phone)) {
      toast.error('Please enter a valid 10-digit mobile number (e.g., 9876543210, +91 9876543210, 09876543210)');
      return;
    }

    // Validate email if provided
    if (generalNewAppointment.email && !validateEmail(generalNewAppointment.email)) {
      toast.error('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Check if selected date is a holiday
    if (isDateHolidayForGeneral(generalNewAppointment.selectedDate)) {
      toast.error('Clinic is closed on the selected date. Please choose another date.');
      return;
    }

    // Check if appointments are disabled
    const daySettings = getDaySettingsForGeneral(generalNewAppointment.selectedDate);
    if (daySettings.disabledAppointments) {
      toast.error('Appointments are currently disabled. Please try again later.');
      return;
    }

    try {
      console.log('🔍 Creating appointment with data:', {
        clinic_id: clinic.id,
        name: formatName(generalNewAppointment.name),
        phone: formatPhoneNumber(generalNewAppointment.phone),
        email: generalNewAppointment.email.trim(),
        date: format(generalNewAppointment.selectedDate, 'yyyy-MM-dd'),
        time: generalNewAppointment.time,
        status: 'Confirmed'
      });

      const newAppointment = {
        clinic_id: clinic.id,
        name: formatName(generalNewAppointment.name),
        phone: formatPhoneNumber(generalNewAppointment.phone),
        email: generalNewAppointment.email.trim(),
        date: format(generalNewAppointment.selectedDate, 'yyyy-MM-dd'),
        time: generalNewAppointment.time,
        status: 'Confirmed' as const,
        patient_id: null  // Automatic patient linking: Database trigger will find existing patient by phone/name or create new one
      };

      console.log('🚀 Calling appointmentsApi.create with:', newAppointment);
      const result = await appointmentsApi.create(newAppointment);
      console.log('✅ Appointment created successfully:', result);
      
      // Clear cache to ensure fresh data
      QueryOptimizer.clearCache('appointments');
      
      // Also clear specific date cache for immediate reflection
      const appointmentDate = format(generalNewAppointment.selectedDate, 'yyyy-MM-dd');
      QueryOptimizer.clearCache(`appointments_date_${clinic.id}_${appointmentDate}`);
      
      // Send email confirmation
      try {
        const emailSent = await sendAppointmentConfirmation({
          name: formatName(generalNewAppointment.name),
          phone: formatPhoneNumber(generalNewAppointment.phone),
          email: generalNewAppointment.email.trim(),
          date: format(generalNewAppointment.selectedDate, 'MMM dd, yyyy'),
          time: generalNewAppointment.time,
          status: 'Confirmed',
          clinicName: clinic?.name || 'Dental Clinic',
          clinicPhone: clinic?.contact_phone || '',
          clinicEmail: clinic?.contact_email || ''
        });
        
        if (emailSent) {
          console.log('✅ Email confirmation sent successfully');
        } else {
          console.warn('⚠️ Failed to send email confirmation');
        }
      } catch (emailError) {
        console.error('❌ Error sending email confirmation:', emailError);
      }

      toast.success(`New appointment created for ${generalNewAppointment.name} on ${format(generalNewAppointment.selectedDate, 'MMM dd, yyyy')} at ${generalNewAppointment.time}`);
      setShowNewAppointmentDialog(false);
      
      // Reset form
      setGeneralNewAppointment({
        name: '',
        phone: '',
        email: '',
        date: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        })(),
        time: '',
        selectedDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        })(),
        isCalendarOpen: false
      });
    } catch (error) {
      console.error('❌ Error creating new appointment:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast.error('Failed to create new appointment');
    }
  };

  // Function to initialize general appointment dialog
  const handleOpenGeneralAppointmentDialog = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setGeneralNewAppointment({
      name: '',
      phone: '',
      email: '',
      date: tomorrow,
      time: '',
      selectedDate: tomorrow,
      isCalendarOpen: false
    });
    
    setBookedSlotsForGeneral([]);
    setShowNewAppointmentDialog(true);
    
    // Check booked slots for tomorrow's date when dialog opens
    checkBookedSlotsForGeneral(tomorrow);
  };

  const checkBookedSlotsForGeneral = async (date: Date) => {
    if (!clinic?.id) return;
    
    setIsLoadingSlotsForGeneral(true);
    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      // Checking booked slots for date
      
      // Force refresh appointments data to get latest bookings
      // This bypasses cache to ensure we get real-time data
      const freshAppointments = await appointmentsApi.getByDate(clinic.id, appointmentDate);
              // Fresh appointments for date
      
      // Filter out cancelled appointments
      const existingAppointments = freshAppointments.filter(apt => apt.status !== 'Cancelled');
              // Existing appointments (excluding cancelled)
      
      // Extract the full time ranges for comparison
      const booked = existingAppointments.map(apt => apt.time);
      
              // Booked time slots processed
      
      // Test time format matching
      const testTime = '09:00 AM - 09:30 AM';
              // Time format testing completed
      
      setBookedSlotsForGeneral(booked);
    } catch (error) {
      console.error('Error checking booked slots:', error);
      setBookedSlotsForGeneral([]);
    } finally {
      setIsLoadingSlotsForGeneral(false);
    }
  };

  // Get settings for the specific day of the week (same as appointment page)
  const getDaySettingsForGeneral = (selectedDate: Date) => {
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daySchedule = settings?.day_schedules?.[dayOfWeek];
    
    return {
      startTime: daySchedule?.start_time || '09:00',
      endTime: daySchedule?.end_time || '20:00',
      breakStart: daySchedule?.break_start || '13:00',
      breakEnd: daySchedule?.break_end || '14:00',
      slotIntervalMinutes: daySchedule?.slot_interval_minutes || 30,
      enabled: daySchedule?.enabled ?? true,
      weeklyHolidays: settings?.weekly_holidays || [],
      customHolidays: settings?.custom_holidays || [],
      disabledAppointments: settings?.disabled_appointments || false,
    };
  };

  // Check if a date is a holiday (same as appointment page)
  const isDateHolidayForGeneral = (checkDate: Date): boolean => {
    if (!settings) return false;
    
    const isoDate = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check weekly holidays (array of numbers: 0=Sunday, 1=Monday, etc.)
    const weeklyHolidays = settings.weekly_holidays || [];
    const isWeeklyHoliday = weeklyHolidays.includes(dayOfWeek);
    
    // Check custom holidays (array of date strings)
    const customHolidays = settings.custom_holidays || [];
    const isCustomHoliday = customHolidays.includes(isoDate);
    
    return isWeeklyHoliday || isCustomHoliday;
  };

  const generateTimeSlotsForGeneral = (dateForSlots: Date) => {
    // generateTimeSlotsForGeneral called
    
    const daySettings = getDaySettingsForGeneral(dateForSlots);
    
    // Check if the day is enabled
    if (!daySettings.enabled) {
      return [];
    }
    
    // Check if it's a holiday
    if (isDateHolidayForGeneral(dateForSlots)) {
      return [];
    }
    
    // Check if appointments are disabled globally
    if (daySettings.disabledAppointments) {
      return [];
    }

    // Get disabled slots for this date
    const dateString = format(dateForSlots, 'yyyy-MM-dd');
    const disabledSlotsForDate = disabledSlots.filter(slot => slot.date === dateString);

    const [startH, startM] = daySettings.startTime.split(':').map(Number);
    const [endH, endM] = daySettings.endTime.split(':').map(Number);

    const start = new Date(dateForSlots);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(dateForSlots);
    end.setHours(endH, endM, 0, 0);

    // Convert break arrays to Date objects for multiple breaks
    // Handle both old single string format and new array format
    const breakStartArray = Array.isArray(daySettings.breakStart) ? daySettings.breakStart : [daySettings.breakStart];
    const breakEndArray = Array.isArray(daySettings.breakEnd) ? daySettings.breakEnd : [daySettings.breakEnd];
    
    const breakPeriods = breakStartArray.map((breakStart, index) => {
      const [breakStartH, breakStartM] = breakStart.split(':').map(Number);
      const [breakEndH, breakEndM] = breakEndArray[index].split(':').map(Number);
      
      const breakStartDate = new Date(dateForSlots);
      breakStartDate.setHours(breakStartH, breakStartM, 0, 0);
      const breakEndDate = new Date(dateForSlots);
      breakEndDate.setHours(breakEndH, breakEndM, 0, 0);
      
      return { start: breakStartDate, end: breakEndDate };
    });

    const intervalMs = daySettings.slotIntervalMinutes * 60 * 1000;
    const slots: { label: string; value: string; disabled: boolean; booked: boolean }[] = [];

    for (let t = start.getTime(); t < end.getTime(); t += intervalMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + intervalMs);

      // Check if slot overlaps with any break period
      const overlapsBreak = breakPeriods.some(breakPeriod => 
        slotStart < breakPeriod.end && slotEnd > breakPeriod.start
      );

      // Check if slot overlaps with any disabled slot
      const overlapsDisabledSlot = disabledSlotsForDate.some(disabledSlot => {
        const [disabledStartH, disabledStartM] = disabledSlot.start_time.split(':').map(Number);
        const [disabledEndH, disabledEndM] = disabledSlot.end_time.split(':').map(Number);
        
        const disabledStart = new Date(dateForSlots);
        disabledStart.setHours(disabledStartH, disabledStartM, 0, 0);
        const disabledEnd = new Date(dateForSlots);
        disabledEnd.setHours(disabledEndH, disabledEndM, 0, 0);
        
        return slotStart < disabledEnd && slotEnd > disabledStart;
      });

      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const isPast = isToday && slotStart.getTime() <= now.getTime();

      if (!overlapsBreak && !overlapsDisabledSlot && slotEnd <= end) {
        const label = `${format(slotStart, 'hh:mm a')} - ${format(slotEnd, 'hh:mm a')}`;
        const isBooked = bookedSlotsForGeneral.includes(label);
        
        // Slot booking status checked
        
        slots.push({ 
          label, 
          value: label, // Store the full time range format instead of just HH:mm
          disabled: isPast || isBooked || overlapsDisabledSlot,
          booked: isBooked
        });
      }
    }

    return slots;
  };

  // Debounced auto-save function
  const debouncedAutoSave = (settingsToSave: SchedulingSettings) => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      try {
        if (clinic?.id) {
          // Auto-saving settings
          
          // Convert day schedules to the correct format
          const daySchedules = Object.entries(settingsToSave.daySchedules).reduce((acc, [day, schedule]) => {
            const dayNumber = dayNumbers[day as keyof typeof dayNumbers];
            if (dayNumber !== undefined) {
              acc[dayNumber] = {
                start_time: schedule.startTime,
                end_time: schedule.endTime,
                break_start: schedule.breakStart,
                break_end: schedule.breakEnd,
                slot_interval_minutes: schedule.slotInterval,
                enabled: schedule.enabled
              };
            }
            return acc;
          }, {} as Record<number, any>);

          const settingsData = {
            clinic_id: clinic.id,
            weekly_holidays: (settingsToSave.weeklyHolidays || []).map(d => dayNumbers[d as keyof typeof dayNumbers]),
            custom_holidays: (settingsToSave.customHolidays || []).map(date => new Date(date).toISOString().split('T')[0]),
            disabled_appointments: settingsToSave.appointmentsDisabled,
            disabled_slots: [],
            show_stats_cards: settingsToSave.showStatsCards,
            minimum_advance_notice: settingsToSave.minimumAdvanceNotice,
            day_schedules: daySchedules,
            notification_settings: {
              email_notifications: true,
              reminder_hours: 24,
              auto_confirm: true
            }
          };
          
          // Attempting to save settings data
          const result = await settingsApi.upsert(settingsData);
                      // Settings auto-saved successfully
          toast.success('Settings saved automatically');
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error);
        toast.error('Failed to auto-save settings');
      }
    }, 2000); // 2 second delay

    setAutoSaveTimeout(timeout);
  };

  const handleScheduleUpdate = (day: string, field: keyof DaySchedule, value: any) => {
    const updatedSettings = {
      ...schedulingSettings,
      daySchedules: {
        ...schedulingSettings.daySchedules,
        [day]: {
          ...schedulingSettings.daySchedules[day],
          [field]: value
        }
      }
    };
    
    setSchedulingSettings(updatedSettings);
    
    // Trigger auto-save
    debouncedAutoSave(updatedSettings);
  };

  const handleSaveDaySchedule = async () => {
    try {
      if (clinic?.id) {
        // Saving day schedule for clinic
        
        // Convert day schedules to the correct format
        const daySchedules = Object.entries(schedulingSettings.daySchedules).reduce((acc, [day, schedule]) => {
          const dayNumber = dayNumbers[day as keyof typeof dayNumbers];
          if (dayNumber !== undefined) {
            acc[dayNumber] = {
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              break_start: schedule.breakStart,
              break_end: schedule.breakEnd,
              slot_interval_minutes: schedule.slotInterval,
              enabled: schedule.enabled
            };
          }
          return acc;
        }, {} as Record<number, any>);

        const settingsData = {
          clinic_id: clinic.id,
          weekly_holidays: (schedulingSettings.weeklyHolidays || []).map(d => dayNumbers[d as keyof typeof dayNumbers]),
          custom_holidays: (schedulingSettings.customHolidays || []).map(date => new Date(date).toISOString().split('T')[0]),
          disabled_appointments: schedulingSettings.appointmentsDisabled,
          disabled_slots: [],
          show_stats_cards: schedulingSettings.showStatsCards,
          minimum_advance_notice: schedulingSettings.minimumAdvanceNotice,
          day_schedules: daySchedules,
          notification_settings: {
            email_notifications: true,
            reminder_hours: 24,
            auto_confirm: true
          }
        };
        
        // Settings data to save
        
        const result = await settingsApi.upsert(settingsData);
        // Day schedule saved successfully
        toast.success('Day schedule saved successfully');
      }
    } catch (error) {
      console.error('Error saving day schedule:', error);
      toast.error('Failed to save day schedule');
    }
  };

  /**
   * Automatic cleanup function - runs silently in background
   * 
   * This function automatically removes old appointment data to keep the database clean:
   * - Removes cancelled appointments older than 10 days
   * - Removes completed appointments older than 10 days
   * - Keeps confirmed appointments (never deleted automatically)
   * - Runs silently without user interaction
   * - Only shows notification if data was actually cleaned
   * - Handles errors gracefully without showing to user
   * 
   * TODO: This can be enhanced with:
   * - Scheduled cleanup (daily/weekly)
   * - Configurable retention period
   * - Email notifications for large cleanups
   */
  const runAutomaticCleanup = async () => {
    try {
      // Run cleanup automatically without user interaction
      const result = await supabase.rpc('cleanup_old_appointments');
      
      if (result.error) {
        console.error('Automatic cleanup error:', result.error);
        return;
      }
      
      const deletedCount = result.data;
      
      // Only show success message if data was actually cleaned
      if (deletedCount > 0) {
        // Automatic cleanup: Removed old appointments
        // Optionally show a subtle notification
        toast.success(`Cleaned up ${deletedCount} old appointments automatically`);
      } else {
        // Automatic cleanup: No old data to clean
      }
    } catch (error) {
      console.error('Error in automatic cleanup:', error);
      // Don't show error to user - this runs silently
    }
  };

  // Automatic cleanup disabled - function not created in database yet
  // useEffect(() => {
  //   // Run cleanup once when admin page is accessed
  //   // This ensures old data is cleaned up every time admin visits the page
  //   runAutomaticCleanup();
  // }, []);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Listen for appointment completion events from other pages
  useEffect(() => {
    const handleAppointmentCompleted = (event: CustomEvent) => {
      console.log('🔄 Admin page received appointment completion event:', event.detail);
      // Trigger refresh to update appointments list
      if (refreshAppointments) {
        refreshAppointments();
      }
    };

    window.addEventListener('appointmentCompleted', handleAppointmentCompleted as EventListener);

    return () => {
      window.removeEventListener('appointmentCompleted', handleAppointmentCompleted as EventListener);
    };
  }, [refreshAppointments]);

  const handleDisableAppointmentsToggle = (checked: boolean) => {
    const updatedSettings = {
      ...schedulingSettings,
      appointmentsDisabled: checked
    };
    
    setSchedulingSettings(updatedSettings);
    
    // Trigger auto-save
    debouncedAutoSave(updatedSettings);
  };

  const handleWeeklyHolidayToggle = (day: string) => {
    const currentWeeklyHolidays = schedulingSettings.weeklyHolidays || [];
    const updatedWeeklyHolidays = currentWeeklyHolidays.includes(day)
      ? currentWeeklyHolidays.filter(d => d !== day)
      : [...currentWeeklyHolidays, day];
    
    const updatedSettings = {
      ...schedulingSettings,
      weeklyHolidays: updatedWeeklyHolidays
    };
    
    setSchedulingSettings(updatedSettings);
    
    // Trigger auto-save
    debouncedAutoSave(updatedSettings);
  };

  const [newCustomHoliday, setNewCustomHoliday] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAddCustomHoliday = () => {
    if (newCustomHoliday) {
      const updatedSettings = {
        ...schedulingSettings,
        customHolidays: [...schedulingSettings.customHolidays, newCustomHoliday]
      };
      
      setSchedulingSettings(updatedSettings);
      setNewCustomHoliday('');
      
      // Trigger auto-save
      debouncedAutoSave(updatedSettings);
    }
  };

  const handleRemoveCustomHoliday = (holiday: string) => {
    const updatedSettings = {
      ...schedulingSettings,
      customHolidays: schedulingSettings.customHolidays.filter(h => h !== holiday)
    };
    
    setSchedulingSettings(updatedSettings);
    
    // Trigger auto-save
    debouncedAutoSave(updatedSettings);
  };

  // Handle patient view navigation
  const handleViewPatient = (appointment: Appointment) => {
    setPatientToView(appointment);
    setShowPatientViewDialog(true);
  };

  const handleConfirmViewPatient = () => {
    if (patientToView) {
      // Check if user is staff and doesn't have patient portal permission
      if (isStaff && !hasPermission('access_patient_portal')) {
        toastHook({
          title: "Access Restricted",
          description: "Patient management access is not enabled for staff.",
          variant: "destructive"
        });
        setShowPatientViewDialog(false);
        setPatientToView(null);
        return;
      }
      
      // Navigate to AdminPatientManagement with search term
      navigate('/admin/patients', { 
        state: { 
          searchTerm: patientToView.name,
          autoSearch: true 
        }
      });
      setShowPatientViewDialog(false);
      setPatientToView(null);
    }
  };

  // Use real appointments data if available, otherwise use empty array
  const realAppointments = appointments || [];

  // Refresh booked slots for general appointment when appointments data changes
  useEffect(() => {
    if (showNewAppointmentDialog && generalNewAppointment.selectedDate) {
      // Force refresh booked slots when dialog is open and appointments change
      checkBookedSlotsForGeneral(generalNewAppointment.selectedDate);
    }
  }, [appointments, showNewAppointmentDialog, generalNewAppointment.selectedDate]);

  // Additional effect to refresh slots when appointments change (for real-time updates)
  useEffect(() => {
    if (showNewAppointmentDialog && generalNewAppointment.selectedDate) {
      // Small delay to ensure appointments data is updated
      const timer = setTimeout(() => {
        checkBookedSlotsForGeneral(generalNewAppointment.selectedDate);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [appointments]);

  // Refresh general appointment dialog when settings change
  useEffect(() => {
    if (showNewAppointmentDialog && generalNewAppointment.selectedDate) {
      // Refresh booked slots when settings change (holidays, working hours, etc.)
      checkBookedSlotsForGeneral(generalNewAppointment.selectedDate);
    }
  }, [settings]);

  // Memoized filtered appointments for better performance
  const filteredAppointments = useMemo(() => {
    return realAppointments.filter(appointment => {
      const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.phone.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
      const matchesDate = !filterDate || appointment.date === filterDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [realAppointments, searchTerm, filterStatus, filterDate]);

  // Memoized appointment statistics for better performance
  const appointmentStats = useMemo(() => {
    const completed = realAppointments.filter(apt => apt.status === 'Completed').length;
    const cancelled = realAppointments.filter(apt => apt.status === 'Cancelled').length;
    const total = realAppointments.length;
    return { completed, cancelled, total };
  }, [realAppointments]);

  const completedAppointments = appointmentStats.completed;
  const cancelledAppointments = appointmentStats.cancelled;
  const totalAppointments = appointmentStats.total;

  // Memoized upcoming appointments for better performance
  const upcomingAppointments = useMemo(() => {
    if (!realAppointments) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date();
    let endDate = new Date();
    
    // Set both to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    switch (upcomingPeriod) {
      case 'tomorrow':
        startDate.setDate(today.getDate() + 1);
        endDate.setDate(today.getDate() + 1);
        break;
      case 'next-week':
        startDate.setDate(today.getDate() + 1);
        endDate.setDate(today.getDate() + 7);
        break;
      case 'all':
        startDate.setDate(today.getDate() + 1);
        endDate.setFullYear(today.getFullYear() + 10); // Far future date to get all
        break;
      default:
        startDate.setDate(today.getDate() + 1);
        endDate.setDate(today.getDate() + 1);
    }

    return realAppointments
      .filter(apt => {
        const appointmentDate = new Date(apt.date);
        appointmentDate.setHours(0, 0, 0, 0);
        
        const isInRange = appointmentDate >= startDate && appointmentDate <= endDate;
        const isConfirmed = apt.status === 'Confirmed';
        
        return isInRange && isConfirmed;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [realAppointments, upcomingPeriod]);

  const getUpcomingAppointments = () => upcomingAppointments;

  // Show loading while data is being fetched
  if (isLoading || clinicLoading || appointmentsLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Centered Logo Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-center">
              <div className="text-center">
                <img 
                  src="/logo.png" 
                  alt="Dentia Smile Builder" 
                  className="h-16 w-auto mx-auto mb-2"
                />
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Dentia Smile Builder
                </h1>
                <p className="text-slate-600 text-sm md:text-base font-medium">
                  Professional Dental Care Management
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <p className="text-slate-700 text-lg font-medium mb-2">Loading admin dashboard...</p>
            <div className="space-y-1">
              {clinicLoading && <p className="text-sm text-slate-500">Loading clinic data...</p>}
              {appointmentsLoading && <p className="text-sm text-slate-500">Loading appointments...</p>}
              {settingsLoading && <p className="text-sm text-slate-500">Loading settings...</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Centered Clinic Name Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Dentia Smile Builder
              </h1>
              <p className="text-slate-600 text-sm md:text-base font-medium">
                Professional Dental Care Management
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-slate-600 mt-2">Manage appointments and clinic settings</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                onClick={() => navigate('/admin/patients')}
                variant="outline" 
                className="flex items-center gap-2 text-sm border-2 border-blue-400 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-500 shadow-sm transition-all duration-200"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Patient Management</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  // Scroll to settings section after a short delay to ensure it's rendered
                  setTimeout(() => {
                    const settingsSection = document.getElementById('settings-section');
                    if (settingsSection) {
                      settingsSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                  }, 100);
                }} 
                variant="outline" 
                className={`flex items-center gap-2 text-sm border-2 transition-all duration-200 ${
                  showSettings 
                    ? 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-500 shadow-md' 
                    : 'border-slate-400 text-slate-700 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-500 shadow-sm'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <LogoutButton />
            </div>
          </div>

          {/* Stats Cards */}
          {schedulingSettings.showStatsCards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Appointments</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{totalAppointments}</div>
                  <p className="text-xs text-blue-700">All time</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{completedAppointments}</div>
                  <p className="text-xs text-green-700">Finished appointments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Cancelled Today</CardTitle>
                  <X className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">{cancelledAppointments}</div>
                  <p className="text-xs text-red-700">Cancelled appointments</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancelled Appointments Section */}
          {cancelledAppointments > 0 && (
            <Card className="mb-6 md:mb-8 bg-gradient-to-br from-red-50 to-rose-100 border-red-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-red-800">Cancelled Appointments</CardTitle>
                    <CardDescription className="text-red-700">Recently cancelled appointments</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete all ${cancelledAppointments} cancelled appointments? This action cannot be undone.`)) {
                        handleDeleteAllCancelledAppointments();
                      }
                    }}
                    className="text-red-700 border-2 border-red-400 hover:bg-red-100 hover:text-red-800 hover:border-red-500 shadow-sm transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realAppointments
                    .filter(apt => apt.status === 'Cancelled')
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-red-100/50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium text-gray-900">{appointment.name}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(appointment.date), 'yyyy-MM-dd')} at {appointment.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${appointment.phone}`, '_self')}
                            className="flex items-center gap-2 text-blue-600 border-2 border-blue-400 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 shadow-sm transition-all duration-200"
                            title="Call patient"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(appointment.phone, 'cancellation', appointment)}
                            className="flex items-center gap-2 text-green-600 border-2 border-green-400 hover:bg-green-100 hover:text-green-700 hover:border-green-500 shadow-sm transition-all duration-200"
                            title="Send WhatsApp message"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the appointment for ${appointment.name}? This action cannot be undone.`)) {
                                handleDeleteAppointment(appointment.id);
                              }
                            }}
                            className="flex items-center gap-2 text-red-600 border-2 border-red-400 hover:bg-red-100 hover:text-red-700 hover:border-red-500 shadow-sm transition-all duration-200"
                            title="Delete appointment"
                          >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}



          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 p-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-slate-200 shadow-sm">
            {/* Search Bar - Full Width */}
            <div className="w-full">
                              <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="search"
                    name="adminSearchQuery"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white/80 w-full rounded-md px-3 py-2 text-sm"
                    autoComplete="new-password"
                    aria-autocomplete="none"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    onFocus={(e) => {
                      e.target.setAttribute('autocomplete', 'new-password');
                      e.target.setAttribute('readonly', 'true');
                      setTimeout(() => {
                        e.target.removeAttribute('readonly');
                        e.target.focus();
                      }, 10);
                    }}
                    onBlur={(e) => {
                      e.target.setAttribute('autocomplete', 'new-password');
                    }}

                  />
                </div>
            </div>
            
            {/* Filter Controls - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-12 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white/80 w-full"
                />
                {filterDate && filterDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                    title="Reset to today"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Tomorrow Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setFilterDate(format(tomorrow, 'yyyy-MM-dd'));
                  // Also update upcoming appointments to show tomorrow
                  setUpcomingPeriod('tomorrow');
                }}
                className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400 transition-colors w-full"
                title="Filter for tomorrow"
              >
                Tomorrow
              </Button>
              
              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white/80">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* New Appointment Button */}
              <Button 
                onClick={handleOpenGeneralAppointmentDialog}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border-2 border-blue-500 w-full"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Appointment</span>
                <span className="sm:hidden">New Apt</span>
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || filterDate || filterStatus !== 'all') && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">Active Filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-200/50 rounded text-xs border border-blue-300">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {filterDate && (
                    <span className="px-2 py-1 bg-blue-200/50 rounded text-xs border border-blue-300">
                      Date: {format(new Date(filterDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filterStatus !== 'all' && (
                    <span className="px-2 py-1 bg-blue-200/50 rounded text-xs border border-blue-300">
                      Status: {filterStatus}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDate(format(new Date(), 'yyyy-MM-dd'));
                    setFilterStatus('all');
                  }}
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Appointments Table */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">Appointments</CardTitle>
              <CardDescription className="text-purple-600">
                Filter and manage appointment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="min-w-[150px]">Patient Name</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[140px]">Time Slot</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow 
                        key={appointment.id} 
                        id={`appointment-${appointment.id}`}
                        className="hover:bg-purple-50/50 transition-all duration-200"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User 
                              className="h-4 w-4 text-gray-500 flex-shrink-0 cursor-pointer hover:text-blue-600 transition-colors" 
                              onClick={() => handleViewPatient(appointment)}
                              title="View patient details"
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{appointment.name}</div>
                              <div className="text-sm text-gray-500 truncate">{appointment.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${appointment.phone}`, '_self')}
                                className="h-8 w-8 p-0 text-blue-600 border-2 border-blue-400 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 flex-shrink-0 shadow-sm transition-all duration-200"
                                title="Call patient"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsApp(appointment.phone, 
                                  appointment.status === 'Cancelled' ? 'cancellation' : 'direct', 
                                  appointment
                                )}
                                className="h-8 w-8 p-0 text-green-600 border-2 border-green-400 hover:bg-green-100 hover:text-green-700 hover:border-green-500 flex-shrink-0 shadow-sm transition-all duration-200"
                                title={appointment.status === 'Cancelled' ? "Send cancellation message" : "Open WhatsApp chat"}
                              >
                                <WhatsAppIcon className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm truncate">{appointment.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{format(new Date(appointment.date), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-gray-500 truncate">{appointment.time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditAppointment(appointment)}
                              className="h-8 px-2 text-blue-600 border-2 border-blue-400 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 text-xs shadow-sm transition-all duration-200"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            
                            {/* Reminder Button - only for non-cancelled appointments */}
                            {appointment.status !== 'Cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(appointment)}
                                className={`h-8 w-8 p-0 ${
                                  sentReminders.has(appointment.id) 
                                    ? 'text-red-600 border-2 border-red-400 hover:bg-red-100 hover:text-red-700 hover:border-red-500' 
                                    : 'text-yellow-600 border-2 border-yellow-400 hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-500'
                                } flex-shrink-0 shadow-sm transition-all duration-200`}
                                title={sentReminders.has(appointment.id) ? "Reminder sent" : "Send WhatsApp reminder"}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No appointments found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments Section */}
          <Card className="mt-6 md:mt-8 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-800">Upcoming Appointments</CardTitle>
                  <CardDescription className="text-blue-700">View and manage future appointments</CardDescription>
                </div>
                <div className="flex items-center space-x-3 bg-blue-100/50 px-4 py-2 rounded-lg border border-blue-300">
                  <Label htmlFor="upcoming-toggle" className="text-sm font-medium text-blue-800">Show Upcoming</Label>
                  <Switch
                    id="upcoming-toggle"
                    checked={showUpcomingAppointments}
                    onCheckedChange={setShowUpcomingAppointments}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-blue-200"
                  />
                </div>
              </div>
            </CardHeader>
            {showUpcomingAppointments && (
              <CardContent>
                <div className="space-y-4">
                  {/* Period Selection Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={upcomingPeriod === 'tomorrow' ? 'default' : 'outline'}
                      onClick={() => setUpcomingPeriod('tomorrow')}
                      className={`text-xs ${upcomingPeriod === 'tomorrow' ? 'bg-blue-600 hover:bg-blue-700' : 'border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 shadow-sm'}`}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      size="sm"
                      variant={upcomingPeriod === 'next-week' ? 'default' : 'outline'}
                      onClick={() => setUpcomingPeriod('next-week')}
                      className={`text-xs ${upcomingPeriod === 'next-week' ? 'bg-blue-600 hover:bg-blue-700' : 'border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 shadow-sm'}`}
                    >
                      Next Week
                    </Button>
                    <Button
                      size="sm"
                      variant={upcomingPeriod === 'all' ? 'default' : 'outline'}
                      onClick={() => setUpcomingPeriod('all')}
                      className={`text-xs ${upcomingPeriod === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 shadow-sm'}`}
                    >
                      All
                    </Button>
                  </div>

                  {/* Upcoming Appointments List */}
                  <div className="space-y-3">
                    {getUpcomingAppointments().map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">{appointment.name}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(appointment.date), 'yyyy-MM-dd')} at {appointment.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${appointment.phone}`, '_self')}
                            className="flex items-center gap-2 text-blue-600 border-2 border-blue-400 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 shadow-sm transition-all duration-200"
                            title="Call patient"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(appointment.phone, 'confirmation', appointment)}
                            className="flex items-center gap-2 text-green-600 border-2 border-green-400 hover:bg-green-100 hover:text-green-700 hover:border-green-500 shadow-sm transition-all duration-200"
                            title="Send WhatsApp message"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAppointment(appointment)}
                            className="flex items-center gap-2 text-purple-600 border-2 border-purple-400 hover:bg-purple-100 hover:text-purple-700 hover:border-purple-500 shadow-sm transition-all duration-200"
                            title="Edit appointment"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getUpcomingAppointments().length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        No upcoming appointments found for the selected period.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Settings Section - Only visible to dentists or staff with settings access */}
          {showSettings && (isDentist || hasPermission('change_settings')) && (
            <Card id="settings-section" className="mt-6 md:mt-8 bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-emerald-800">Scheduling Settings</CardTitle>
                <CardDescription className="text-emerald-700">Control the appointment window and slot generation</CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                {/* Disable Appointments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Disable All Appointments</Label>
                      <p className="text-sm text-gray-600">Temporarily stop accepting new appointments</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-1 bg-white">
                      <Switch
                        checked={schedulingSettings.appointmentsDisabled}
                        onCheckedChange={handleDisableAppointmentsToggle}
                        className="border-2 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Show Stats Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Show Stats Cards</Label>
                      <p className="text-sm text-gray-600">Display total, completed, and cancelled appointment statistics</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-1 bg-white">
                      <Switch
                        checked={schedulingSettings.showStatsCards}
                        onCheckedChange={(checked) => {
                          const updatedSettings = {
                            ...schedulingSettings,
                            showStatsCards: checked
                          };
                          setSchedulingSettings(updatedSettings);
                          debouncedAutoSave(updatedSettings);
                        }}
                        className="border-2 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Minimum Advance Notice */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Minimum Advance Notice</Label>
                    <p className="text-sm text-gray-600">How many hours in advance patients must book appointments</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="168"
                        step="1"
                        value={schedulingSettings.minimumAdvanceNotice}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const updatedSettings = {
                            ...schedulingSettings,
                            minimumAdvanceNotice: value
                          };
                          setSchedulingSettings(updatedSettings);
                          debouncedAutoSave(updatedSettings);
                        }}
                        className="w-full"
                        placeholder="24"
                      />
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      hours
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {schedulingSettings.minimumAdvanceNotice === 0 ? (
                      "Patients can book appointments immediately"
                    ) : schedulingSettings.minimumAdvanceNotice < 24 ? (
                      `Patients must book at least ${schedulingSettings.minimumAdvanceNotice} hour${schedulingSettings.minimumAdvanceNotice === 1 ? '' : 's'} in advance`
                    ) : (
                      `Patients must book at least ${Math.floor(schedulingSettings.minimumAdvanceNotice / 24)} day${Math.floor(schedulingSettings.minimumAdvanceNotice / 24) === 1 ? '' : 's'} and ${schedulingSettings.minimumAdvanceNotice % 24} hour${schedulingSettings.minimumAdvanceNotice % 24 === 1 ? '' : 's'} in advance`
                    )}
                  </div>
                </div>

                {/* Weekly Holidays */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Weekly Holidays</Label>
                  <p className="text-sm text-gray-600">Select days when the clinic is closed</p>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {days.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`holiday-${day}`}
                          checked={schedulingSettings.weeklyHolidays.includes(day)}
                          onCheckedChange={() => handleWeeklyHolidayToggle(day)}
                        />
                        <Label htmlFor={`holiday-${day}`} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Holidays */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Custom Holidays</Label>
                  <p className="text-sm text-gray-600">Add specific dates when the clinic is closed</p>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Select holiday date"
                      className="flex-1"
                      value={newCustomHoliday}
                      onChange={(e) => setNewCustomHoliday(e.target.value)}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddCustomHoliday} className="text-red-600 border-red-300 hover:bg-red-50">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {schedulingSettings.customHolidays.map((holiday, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{holiday}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveCustomHoliday(holiday)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disabled Time Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Disabled Time Slots</Label>
                      <p className="text-sm text-gray-600">Temporarily disable specific time slots</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowDisabledSlotsDialog(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                  
                  {/* Display current disabled slots */}
                  <div className="space-y-2">
                    {disabledSlots.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No disabled slots</div>
                    ) : (
                      disabledSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-red-800">
                              {format(new Date(slot.date), 'MMM dd, yyyy')} • {slot.start_time} - {slot.end_time}
                            </div>

                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleRemoveDisabledSlot(slot.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Day Schedule Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Day Schedule Settings</Label>
                  <p className="text-sm text-gray-600">Set different schedules for each day of the week</p>
                  
                  {/* Day Selection */}
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(day)}
                        className="min-w-[60px]"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>

                  {/* Selected Day Schedule */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedDay} Schedule</CardTitle>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`enabled-${selectedDay}`} className="text-sm">Enabled</Label>
                          <div className="border-2 border-gray-300 rounded-lg p-1 bg-white">
                            <Switch
                              id={`enabled-${selectedDay}`}
                              checked={schedulingSettings.daySchedules[selectedDay].enabled}
                              onCheckedChange={(checked) => handleScheduleUpdate(selectedDay, 'enabled', checked)}
                              className="border-2 border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`start-${selectedDay}`}>Start Time</Label>
                          <Input
                            id={`start-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].startTime}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`end-${selectedDay}`}>End Time</Label>
                          <Input
                            id={`end-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].endTime}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>
                      
                                            <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Break Periods</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentBreaks = schedulingSettings.daySchedules[selectedDay].breakStart;
                              const newBreaks = [...currentBreaks, '13:00'];
                              const newBreakEnds = [...schedulingSettings.daySchedules[selectedDay].breakEnd, '14:00'];
                              handleScheduleUpdate(selectedDay, 'breakStart', newBreaks);
                              handleScheduleUpdate(selectedDay, 'breakEnd', newBreakEnds);
                            }}
                            className="h-8"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Break
                          </Button>
                        </div>
                        
                        {schedulingSettings.daySchedules[selectedDay].breakStart.map((breakStart, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                              <Label htmlFor={`break-start-${selectedDay}-${index}`}>Break {index + 1} Start</Label>
                              <Input
                                id={`break-start-${selectedDay}-${index}`}
                                type="time"
                                value={breakStart}
                                onChange={(e) => {
                                  const newBreaks = [...schedulingSettings.daySchedules[selectedDay].breakStart];
                                  newBreaks[index] = e.target.value;
                                  handleScheduleUpdate(selectedDay, 'breakStart', newBreaks);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`break-end-${selectedDay}-${index}`}>Break {index + 1} End</Label>
                              <Input
                                id={`break-end-${selectedDay}-${index}`}
                                type="time"
                                value={schedulingSettings.daySchedules[selectedDay].breakEnd[index]}
                                onChange={(e) => {
                                  const newBreakEnds = [...schedulingSettings.daySchedules[selectedDay].breakEnd];
                                  newBreakEnds[index] = e.target.value;
                                  handleScheduleUpdate(selectedDay, 'breakEnd', newBreakEnds);
                                }}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newBreaks = schedulingSettings.daySchedules[selectedDay].breakStart.filter((_, i) => i !== index);
                                  const newBreakEnds = schedulingSettings.daySchedules[selectedDay].breakEnd.filter((_, i) => i !== index);
                                  handleScheduleUpdate(selectedDay, 'breakStart', newBreaks);
                                  handleScheduleUpdate(selectedDay, 'breakEnd', newBreakEnds);
                                }}
                                className="h-10 w-10 p-0"
                                disabled={schedulingSettings.daySchedules[selectedDay].breakStart.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                <div className="space-y-2">
                        <Label htmlFor={`interval-${selectedDay}`}>Slot Interval (minutes)</Label>
                        <Input
                          id={`interval-${selectedDay}`}
                          type="number"
                          min="15"
                          max="120"
                          step="15"
                          value={schedulingSettings.daySchedules[selectedDay].slotInterval}
                          onChange={(e) => handleScheduleUpdate(selectedDay, 'slotInterval', parseInt(e.target.value))}
                        />
                      </div>
                      
                      {/* Auto-save indicator */}
                      <div className="pt-4">
                        <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Changes will be saved automatically</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                

              </CardContent>
            </Card>
          )}

          {/* Staff Permissions Section - Only visible to dentists */}
          {showSettings && isDentist && (
            <Card className="mt-6 md:mt-8 bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Permissions
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Control what staff members can access in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Settings Access */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Settings Access</Label>
                      <p className="text-sm text-gray-600">Allow staff to modify clinic settings</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-1 bg-white">
                      <Switch
                        checked={staffPermissions.canAccessSettings}
                        onCheckedChange={async (checked) => {
                          setStaffPermissions(prev => ({
                            ...prev,
                            canAccessSettings: checked
                          }));
                          // Auto-save after state update
                          setTimeout(async () => {
                            await saveStaffPermissions({
                              canAccessSettings: checked
                            });
                            toastHook({
                              title: "✅ Settings Access Updated",
                              description: checked ? "Staff can now access settings" : "Staff settings access disabled",
                            });
                          }, 100);
                        }}
                        className="border-2 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Patient Portal Access */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Patient Portal Access</Label>
                      <p className="text-sm text-gray-600">Allow staff to access patient management</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-1 bg-white">
                      <Switch
                        checked={staffPermissions.canAccessPatientPortal}
                        onCheckedChange={async (checked) => {
                          setStaffPermissions(prev => ({
                            ...prev,
                            canAccessPatientPortal: checked
                          }));
                          // Auto-save after state update
                          setTimeout(async () => {
                            console.log('🔧 Before save - Patient Portal Access:', {
                              currentState: staffPermissions.canAccessPatientPortal,
                              newValue: checked,
                              allPermissions: staffPermissions
                            });
                            await saveStaffPermissions({
                              canAccessPatientPortal: checked
                            });
                            console.log('🔧 Staff permissions after save:', {
                              canAccessSettings: staffPermissions.canAccessSettings,
                              canAccessPatientPortal: checked
                            });
                            toastHook({
                              title: "✅ Patient Portal Access Updated",
                              description: checked ? "Staff can now access patient management" : "Staff patient portal access disabled",
                            });
                          }, 100);
                        }}
                        className="border-2 border-gray-300"
                      />
                    </div>
                  </div>
                </div>




              </CardContent>
            </Card>
          )}
          

          
          {/* Staff Access Denied Message */}
          {showSettings && isStaff && !hasPermission('change_settings') && (
            <Card className="mt-6 md:mt-8 bg-gradient-to-br from-red-50 to-pink-100 border-red-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Access Restricted
                </CardTitle>
                <CardDescription className="text-red-700">
                  Settings access is limited to dentists only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  As a staff member, you can view and manage appointments but cannot modify system settings. 
                  Please contact your dentist for any settings changes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status Notice */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className={`border rounded-lg p-4 ${
                appointmentsError 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  <div className={`mr-3 ${
                    appointmentsError ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {appointmentsError ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${
                      appointmentsError ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {appointmentsError ? 'Database Connection Error' : 'Real-time Data Connected'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      appointmentsError ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {appointmentsError ? (
                        `Error: ${appointmentsError}. Using mock data for testing.`
                      ) : (
                        <>
                          Connected to Supabase! Appointments update in real-time. 
                          {filteredAppointments && filteredAppointments.length > 0 && (
                            <span className="ml-2 font-medium">
                              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} shown
                              {realAppointments.length !== filteredAppointments.length && (
                                <span className="text-green-600"> ({realAppointments.length} total)</span>
                              )}
                            </span>
                          )}
                          {filteredAppointments.length === 0 && realAppointments.length > 0 && (
                            <span className="ml-2 font-medium text-orange-600">
                              No appointments for selected filters ({realAppointments.length} total)
                            </span>
                          )}
                          {clinic && (
                            <span className="ml-2 text-xs">
                              Clinic: {clinic.name}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </main>

      {/* Hidden dummy form to prevent autofill */}
      <form style={{ display: 'none' }}>
        <input type="text" name="email" autoComplete="email" />
        <input type="text" name="name" autoComplete="name" />
        <input type="tel" name="phone" autoComplete="tel" />
      </form>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg w-[95vw] sm:w-auto max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Manage appointment for {selectedAppointment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="flex-1 overflow-y-auto space-y-5 px-2 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="text-sm text-gray-600 truncate">{selectedAppointment.name}</div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="text-sm text-gray-600 truncate">{selectedAppointment.phone}</div>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="text-sm text-gray-600 truncate">{selectedAppointment.email}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <div className="text-sm text-gray-600">
                    {format(new Date(selectedAppointment.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <Label>Time</Label>
                  <div className="text-sm text-gray-600">{selectedAppointment.time}</div>
                </div>
              </div>
                            <div>
                <Label>Status</Label>
                <Select 
                  value={editingAppointment?.status || selectedAppointment.status} 
                  onValueChange={(value) => handleStatusUpdate(selectedAppointment.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
        </div>
          )}
          <DialogFooter className="flex-shrink-0 flex flex-col gap-2 pt-6">
            <Button
              onClick={() => selectedAppointment && handleCompleteAppointment(selectedAppointment.id)}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full h-12"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
            <Button
              onClick={() => selectedAppointment && handleCancelAppointment(selectedAppointment.id)}
              variant="destructive"
              className="flex items-center justify-center gap-2 w-full h-12"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={() => selectedAppointment && handleNewAppointmentForClient(selectedAppointment)}
              variant="outline"
              className="flex items-center justify-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50 w-full h-12"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Appointment for Same Client Dialog */}
      <Dialog open={showNewAppointmentForClient} onOpenChange={setShowNewAppointmentForClient}>
        <DialogContent className="sm:max-w-lg w-[95vw] sm:w-auto max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>New Appointment for {selectedAppointment?.name}</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for the same client
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="flex-1 overflow-y-auto space-y-5 px-2 pb-2">
              {/* Client Info Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedAppointment.name}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedAppointment.phone}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Email:</span> {selectedAppointment.email}
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                
                {/* Holiday/Clinic Closed Messages */}
                {newAppointmentForClient.selectedDate && (
                  <>
                    {isDateHolidayForGeneral(newAppointmentForClient.selectedDate) && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Clinic is closed on this date
                      </div>
                    )}
                    {getDaySettingsForGeneral(newAppointmentForClient.selectedDate).disabledAppointments && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Appointments are currently disabled
                      </div>
                    )}
                  </>
                )}
                <Popover open={newAppointmentForClient.isCalendarOpen} onOpenChange={(open) => setNewAppointmentForClient(prev => ({ ...prev, isCalendarOpen: open }))}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setNewAppointmentForClient(prev => ({ ...prev, isCalendarOpen: !prev.isCalendarOpen }))}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newAppointmentForClient.selectedDate ? (
                        format(newAppointmentForClient.selectedDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newAppointmentForClient.selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setNewAppointmentForClient(prev => ({
                            ...prev,
                            selectedDate: date,
                            isCalendarOpen: false,
                            time: '' // Reset time when date changes
                          }));
                          // Check booked slots for the selected date
                          checkBookedSlotsForNewAppointment(date);
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || isDateHolidayForGeneral(date);
                      }}
                      className={cn("p-3 pointer-events-auto")}

                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <Label>Select Time</Label>
                {isLoadingSlotsForNewAppointment ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Checking available slots...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {generateTimeSlotsForNewAppointment(newAppointmentForClient.selectedDate).map((slot) => (
                        <Button
                          key={slot.value}
                          type="button"
                          variant={newAppointmentForClient.time === slot.value ? 'default' : 'outline'}
                          className={cn(
                            'justify-center text-xs p-2 h-auto',
                            newAppointmentForClient.time === slot.value ? 'bg-purple-600 hover:bg-purple-700 text-white' : '',
                            slot.booked ? 'bg-red-500 text-white border-red-500 cursor-not-allowed hover:bg-red-500 hover:text-white' : ''
                          )}
                          disabled={slot.disabled || slot.booked}
                          onClick={() => !slot.booked && setNewAppointmentForClient(prev => ({ ...prev, time: slot.value }))}
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                    {bookedSlotsForNewAppointment.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Red slots are unavailable. Please select an available time.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 flex flex-col gap-2 pt-6">
            <Button
              onClick={handleCreateNewAppointmentForClient}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 w-full h-12"
            >
              <Plus className="h-4 w-4" />
              Create Appointment
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewAppointmentForClient(false)}
              className="flex items-center justify-center gap-2 w-full h-12"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* General New Appointment Dialog */}
      <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
        <DialogContent className="sm:max-w-lg w-[95vw] sm:w-auto max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for any patient
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-5 px-2 pb-2">
            {/* Patient Information */}
            <form autoComplete="new-password" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
              
              {/* Patient Search Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Patient Selection</Label>
                  {selectedPatientForBooking && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelectedPatient}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                
                {selectedPatientForBooking ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Selected Patient</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedPatientForBooking.first_name} {selectedPatientForBooking.last_name || ''}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {selectedPatientForBooking.phone}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-medium">Email:</span> {selectedPatientForBooking.email || 'Not provided'}
                      </div>
                      {selectedPatientForBooking.allergies?.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="font-medium">Allergies:</span> {selectedPatientForBooking.allergies.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPatientSearchDialog(true)}
                      className="w-full border-2 border-blue-400 text-blue-700 hover:bg-blue-50"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Existing Patients
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      Or enter details below to create a new patient
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentPatientName">Patient Name *</Label>
                <Input
                  id="appointmentPatientName"
                  name="appointmentPatientName"
                  type="text"
                  value={generalNewAppointment.name}
                  onChange={(e) => setGeneralNewAppointment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter patient name"
                  className="border-2 border-slate-300 focus:border-blue-500"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                    e.target.setAttribute('readonly', 'true');
                    setTimeout(() => {
                      e.target.removeAttribute('readonly');
                      e.target.focus();
                    }, 10);
                  }}
                  onBlur={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentPhoneNumber">Phone Number *</Label>
                <Input
                  id="appointmentPhoneNumber"
                  name="appointmentPhoneNumber"
                  type="text"
                  inputMode="tel"
                  value={generalNewAppointment.phone}
                  onChange={(e) => setGeneralNewAppointment(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className={cn(
                    "border-2 focus:border-blue-500",
                    generalNewAppointment.phone && !validatePhone(generalNewAppointment.phone) 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-slate-300"
                  )}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                    e.target.setAttribute('readonly', 'true');
                    setTimeout(() => {
                      e.target.removeAttribute('readonly');
                      e.target.focus();
                    }, 10);
                  }}
                  onBlur={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                  }}
                />
                {generalNewAppointment.phone && !validatePhone(generalNewAppointment.phone) && (
                  <div className="text-sm text-red-600">
                    Please enter a valid 10-digit mobile number
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentEmail">Email</Label>
                <Input
                  id="appointmentEmail"
                  name="appointmentEmail"
                  type="text"
                  inputMode="email"
                  value={generalNewAppointment.email}
                  onChange={(e) => setGeneralNewAppointment(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className={cn(
                    "border-2 focus:border-blue-500",
                    generalNewAppointment.email && !validateEmail(generalNewAppointment.email) 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-slate-300"
                  )}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                    e.target.setAttribute('readonly', 'true');
                    setTimeout(() => {
                      e.target.removeAttribute('readonly');
                      e.target.focus();
                    }, 10);
                  }}
                  onBlur={(e) => {
                    e.target.setAttribute('autocomplete', 'new-password');
                  }}
                />
                {generalNewAppointment.email && !validateEmail(generalNewAppointment.email) && (
                  <div className="text-sm text-red-600">
                    Please enter a valid email address
                  </div>
                )}
                {!generalNewAppointment.email && (
                  <div className="text-xs text-gray-500">
                    We don't spam, so don't worry
                  </div>
                )}
              </div>
            </div>
            </form>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              
              {/* Holiday/Clinic Closed Messages */}
              {generalNewAppointment.selectedDate && (
                <>
                  {isDateHolidayForGeneral(generalNewAppointment.selectedDate) && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Clinic is closed on this date
                    </div>
                  )}
                  {getDaySettingsForGeneral(generalNewAppointment.selectedDate).disabledAppointments && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Appointments are currently disabled
                    </div>
                  )}
                </>
              )}
              
              <Popover open={generalNewAppointment.isCalendarOpen} onOpenChange={(open) => setGeneralNewAppointment(prev => ({ ...prev, isCalendarOpen: open }))}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-2 border-slate-300 focus:border-blue-500"
                    onClick={() => setGeneralNewAppointment(prev => ({ ...prev, isCalendarOpen: !prev.isCalendarOpen }))}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {generalNewAppointment.selectedDate ? (
                      format(generalNewAppointment.selectedDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={generalNewAppointment.selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setGeneralNewAppointment(prev => ({
                          ...prev,
                          selectedDate: date,
                          isCalendarOpen: false,
                          time: '' // Reset time when date changes
                        }));
                        // Check booked slots for the selected date
                        checkBookedSlotsForGeneral(date);
                      }
                    }}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || isDateHolidayForGeneral(date);
                    }}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label>Select Time</Label>
              {isLoadingSlotsForGeneral ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Checking available slots...
                </div>
              ) : (
                <>
                  {generateTimeSlotsForGeneral(generalNewAppointment.selectedDate).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No available slots for this date</p>
                      <p className="text-sm">Clinic may be closed or all slots are booked</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {generateTimeSlotsForGeneral(generalNewAppointment.selectedDate).map((slot) => (
                        <Button
                          key={slot.value}
                          type="button"
                          variant={generalNewAppointment.time === slot.value ? 'default' : 'outline'}
                          className={cn(
                            'justify-center text-xs p-2 h-auto border-2',
                            slot.booked ? 'bg-red-500 text-white border-red-500 cursor-not-allowed hover:bg-red-500 hover:text-white' : 
                            generalNewAppointment.time === slot.value ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 'border-slate-300 hover:border-blue-500'
                          )}
                          disabled={slot.disabled || slot.booked}
                          onClick={() => !slot.booked && setGeneralNewAppointment(prev => ({ ...prev, time: slot.value }))}
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {bookedSlotsForGeneral.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Red slots are unavailable. Please select an available time.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 flex flex-col gap-2 pt-6">
            <Button
              onClick={handleCreateGeneralAppointment}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full h-12 border-2 border-blue-500 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Create Appointment
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewAppointmentDialog(false)}
              className="flex items-center justify-center gap-2 w-full h-12 border-2 border-slate-300 hover:border-slate-400 shadow-sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disabled Slots Dialog */}
      <Dialog open={showDisabledSlotsDialog} onOpenChange={setShowDisabledSlotsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Time Slot</DialogTitle>
            <DialogDescription>
              Temporarily disable a specific time slot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disabled-date">Date</Label>
              <Input
                id="disabled-date"
                type="date"
                value={newDisabledSlot.date}
                onChange={(e) => setNewDisabledSlot(prev => ({ ...prev, date: e.target.value }))}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disabled-start">Start Time</Label>
                <Input
                  id="disabled-start"
                  type="time"
                  value={newDisabledSlot.startTime}
                  onChange={(e) => setNewDisabledSlot(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled-end">End Time</Label>
                <Input
                  id="disabled-end"
                  type="time"
                  value={newDisabledSlot.endTime}
                  onChange={(e) => setNewDisabledSlot(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDisabledSlotsDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDisabledSlot}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Disable Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Patient Search Dialog */}
      <Dialog open={showPatientSearchDialog} onOpenChange={setShowPatientSearchDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Search Existing Patients</DialogTitle>
            <DialogDescription>
              Search for existing patients to link with the appointment
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-2">
            {/* Search Input */}
            <div className="space-y-2">
              <Label>Search by Name, Phone, or Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Enter patient name, phone, or email..."
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    if (searchTerm.length >= 2) {
                      searchPatients(searchTerm);
                    } else {
                      setPatientSearchResults([]);
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {isSearchingPatients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-600">Searching patients...</span>
                </div>
              ) : patientSearchResults.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Found {patientSearchResults.length} patient(s)
                  </div>
                  {patientSearchResults.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatientForBooking(patient)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
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
                          {patient.allergies?.length > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              ⚠️ Allergies: {patient.allergies.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${patient.phone}`, '_self');
                            }}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            title="Call"
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients found</p>
                  <p className="text-sm">Try searching with a different term</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPatientSearchDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowPatientSearchDialog(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continue with New Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Appointment with Dentist Selection Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Appointment
            </DialogTitle>
            <DialogDescription>
              Select which dentist attended this appointment
            </DialogDescription>
          </DialogHeader>
          
          {appointmentToComplete && (
            <div className="space-y-4 py-4">
              {/* Appointment Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {appointmentToComplete.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {format(new Date(appointmentToComplete.date), 'PPP')}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {appointmentToComplete.time}
                  </div>
                </div>
              </div>

              {/* Dentist Selection */}
              <div className="space-y-2">
                <Label htmlFor="dentist-select" className="font-medium">Who attended this appointment? *</Label>
                {isLoadingDentists ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-600">Loading dentists...</span>
                  </div>
                ) : dentists.length === 0 ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    No dentists found for this clinic. Please add dentists in SuperAdmin first.
                  </div>
                ) : (
                  <Select
                    value={selectedDentistId}
                    onValueChange={setSelectedDentistId}
                  >
                    <SelectTrigger id="dentist-select">
                      <SelectValue placeholder="Select a dentist" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.id} value={dentist.id}>
                          {dentist.name}
                          {dentist.specialization && ` (${dentist.specialization})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  This information will be used for analytics and reporting
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setAppointmentToComplete(null);
                setSelectedDentistId('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmComplete}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!selectedDentistId || isLoadingDentists}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient View Confirmation Dialog */}
      <Dialog open={showPatientViewDialog} onOpenChange={setShowPatientViewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              View Patient Details
            </DialogTitle>
            <DialogDescription>
              Navigate to Patient Management to view detailed patient information
            </DialogDescription>
          </DialogHeader>
          
          {patientToView && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {patientToView.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {patientToView.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {patientToView.phone}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                This will open Patient Management and automatically search for "{patientToView.name}" to show their complete medical history, records, and appointment history.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPatientViewDialog(false);
                setPatientToView(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmViewPatient}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <User className="h-4 w-4 mr-2" />
              View Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Admin;


