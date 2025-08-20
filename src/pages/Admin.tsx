import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isAdminLoggedIn, clearAdminSession } from '@/lib/auth';
import { useAppointments } from '@/hooks/useAppointments';
import { useSettings } from '@/hooks/useSettings';
import { useClinic } from '@/contexts/ClinicContext';
import { appointmentsApi, settingsApi } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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
  AlertCircle
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
  breakStart: string;
  breakEnd: string;
  slotInterval: number;
}

interface SchedulingSettings {
  appointmentsDisabled: boolean;
  disableMessage: string;
  disableUntilDate: string;
  disableUntilTime: string;
  weeklyHolidays: string[];
  customHolidays: string[];
  daySchedules: {
    [key: string]: DaySchedule;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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
    date: new Date(),
    time: '',
    selectedDate: new Date(),
    isCalendarOpen: false
  });
  const [bookedSlotsForNewAppointment, setBookedSlotsForNewAppointment] = useState<string[]>([]);
  const [isLoadingSlotsForNewAppointment, setIsLoadingSlotsForNewAppointment] = useState(false);
  


  // Supabase hooks
  const { clinic, loading: clinicLoading } = useClinic();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    error: appointmentsError,
    updateAppointment,
    deleteAppointment
  } = useAppointments();
  const { settings, loading: settingsLoading } = useSettings();

  // Default scheduling settings
  const [schedulingSettings, setSchedulingSettings] = useState<SchedulingSettings>({
    appointmentsDisabled: false,
    disableMessage: "We're currently not accepting new appointments. Please check back later or contact us directly.",
    disableUntilDate: '',
    disableUntilTime: '',
    weeklyHolidays: [],
    customHolidays: [],
    daySchedules: {
      Mon: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Tue: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Wed: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Thu: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Fri: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Sat: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Sun: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 }
    }
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Day name to number mapping
  const dayNumbers = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

  useEffect(() => {
    // Check if admin is logged in
    if (!isAdminLoggedIn()) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [navigate]);

  // Sync local state with database settings
  useEffect(() => {
    if (settings) {
      console.log('Syncing settings from database:', settings);
      
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
        daySchedules: {
          Mon: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Tue: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Wed: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Thu: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Fri: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Sat: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
          Sun: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 }
        }
      };

      // Convert day schedules from database format
      if (settings.day_schedules) {
        Object.entries(settings.day_schedules).forEach(([dayNumber, schedule]) => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[parseInt(dayNumber)] || 'Sun';
          
          convertedSettings.daySchedules[dayName as keyof typeof convertedSettings.daySchedules] = {
            enabled: schedule.enabled ?? true,
            startTime: schedule.start_time || '09:00',
            endTime: schedule.end_time || '18:00',
            breakStart: schedule.break_start || '13:00',
            breakEnd: schedule.break_end || '14:00',
            slotInterval: schedule.slot_interval_minutes || 30
          };
        });
      }

      setSchedulingSettings(convertedSettings);
    }
  }, [settings]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

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
📞 Contact: +91 98765 43210

Please arrive 10 minutes early.
Cancel or reschedule: ${bookingLink}

Thank you for choosing Jeshna Dental Clinic!`;

      case 'cancellation':
        return `❌ Appointment Cancelled

Dear ${appointment.name},
Your appointment for ${format(new Date(appointment.date), 'MMMM dd, yyyy')} at ${appointment.time} has been cancelled.

You can book a new appointment here: ${bookingLink}

We apologize for any inconvenience.
Jeshna Dental Clinic`;

      case 'reminder':
        return `⏰ Appointment Reminder

Hi ${appointment.name},
This is a reminder for your appointment tomorrow at ${appointment.time}.

📍 Location: Jeshna Dental Clinic
📞 Contact: +91 98765 43210

Please confirm by replying "Yes" or "No"`;

      default:
        return '';
    }
  };

  const handleWhatsApp = (phone: string, type: 'confirmation' | 'cancellation' | 'reminder', appointment: Appointment) => {
    const message = getWhatsAppMessage(type, appointment);
    const encodedMessage = encodeURIComponent(message);
    // Remove any non-numeric characters from phone number
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditDialog(true);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      if (updateAppointment) {
        await updateAppointment(appointmentId, { status: newStatus as any });
      }
      toast.success(`Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      if (updateAppointment) {
        await updateAppointment(appointmentId, { status: 'Completed' });
      }
      toast.success('Appointment marked as completed');
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
        toast.success('Appointment cancelled');
        
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
      toast.success('Appointment deleted permanently');
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const handleNewAppointmentForClient = (appointment: Appointment) => {
    const today = new Date();
    setNewAppointmentForClient({
      date: today,
      time: '',
      selectedDate: today,
      isCalendarOpen: false
    });
    setBookedSlotsForNewAppointment([]);
    setShowNewAppointmentForClient(true);
    // Check booked slots for today's date when dialog opens
    checkBookedSlotsForNewAppointment(today);
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
    // Default settings - same as appointment page
    const currentSettings = {
    startTime: '09:00',
    endTime: '20:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotIntervalMinutes: 30,
    };

    const [startH, startM] = currentSettings.startTime.split(':').map(Number);
    const [endH, endM] = currentSettings.endTime.split(':').map(Number);
    const [breakStartH, breakStartM] = currentSettings.breakStart.split(':').map(Number);
    const [breakEndH, breakEndM] = currentSettings.breakEnd.split(':').map(Number);

    const start = new Date(dateForSlots);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(dateForSlots);
    end.setHours(endH, endM, 0, 0);
    const breakStart = new Date(dateForSlots);
    breakStart.setHours(breakStartH, breakStartM, 0, 0);
    const breakEnd = new Date(dateForSlots);
    breakEnd.setHours(breakEndH, breakEndM, 0, 0);

    const intervalMs = currentSettings.slotIntervalMinutes * 60 * 1000;
    const slots: { label: string; value: string; disabled: boolean; booked: boolean }[] = [];

    for (let t = start.getTime(); t < end.getTime(); t += intervalMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + intervalMs);

      // Exclude slots overlapping the break window
      const overlapsBreak = slotStart < breakEnd && slotEnd > breakStart;

      // Disable past times if the selected date is today
      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const isPast = isToday && slotStart.getTime() <= now.getTime();

      if (!overlapsBreak && slotEnd <= end) {
        const label = `${format(slotStart, 'hh:mm a')} - ${format(slotEnd, 'hh:mm a')}`;
        const isBooked = bookedSlotsForNewAppointment.includes(label);
        slots.push({ 
          label, 
          value: label, 
          disabled: isPast || isBooked,
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

    try {
      // Create new appointment with same client data but new date/time
      const newAppointment = {
        clinic_id: clinic.id,
        name: selectedAppointment.name,
        phone: selectedAppointment.phone,
        email: selectedAppointment.email,
        date: format(newAppointmentForClient.selectedDate, 'yyyy-MM-dd'),
        time: newAppointmentForClient.time,
        status: 'Confirmed' as const
      };

      // Add to database using the appointments API
      await appointmentsApi.create(newAppointment);
      
      toast.success(`New appointment created for ${selectedAppointment.name} on ${format(newAppointmentForClient.selectedDate, 'MMM dd, yyyy')} at ${newAppointmentForClient.time}`);
      setShowNewAppointmentForClient(false);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error creating new appointment:', error);
      toast.error('Failed to create new appointment');
    }
  };

  const handleScheduleUpdate = (day: string, field: keyof DaySchedule, value: any) => {
    setSchedulingSettings(prev => ({
      ...prev,
      daySchedules: {
        ...prev.daySchedules,
        [day]: {
          ...prev.daySchedules[day],
          [field]: value
        }
      }
    }));
  };

  const handleSaveDaySchedule = async () => {
    try {
      if (clinic?.id) {
        console.log('Saving day schedule for clinic:', clinic.id);
        
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
          day_schedules: daySchedules,
          notification_settings: {
            email_notifications: true,
            reminder_hours: 24,
            auto_confirm: true
          }
        };
        
        console.log('Settings data to save:', settingsData);
        
        const result = await settingsApi.upsert(settingsData);
        console.log('Day schedule saved successfully:', result);
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
        console.log(`Automatic cleanup: Removed ${deletedCount} old appointments`);
        // Optionally show a subtle notification
        toast.success(`Cleaned up ${deletedCount} old appointments automatically`);
      } else {
        console.log('Automatic cleanup: No old data to clean');
      }
    } catch (error) {
      console.error('Error in automatic cleanup:', error);
      // Don't show error to user - this runs silently
    }
  };

  // Run automatic cleanup when admin page loads
  useEffect(() => {
    // Run cleanup once when admin page is accessed
    // This ensures old data is cleaned up every time admin visits the page
    runAutomaticCleanup();
  }, []);

  const handleDisableAppointmentsToggle = async (checked: boolean) => {
    setSchedulingSettings(prev => ({
      ...prev,
      appointmentsDisabled: checked
    }));
    
    // Save to database
    try {
      if (clinic?.id) {
        console.log('Saving disable appointments setting:', checked);
        
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
          disabled_appointments: checked,
          disabled_slots: [],
          day_schedules: daySchedules,
          notification_settings: {
            email_notifications: true,
            reminder_hours: 24,
            auto_confirm: true
          }
        };
        
        console.log('Settings data to save:', settingsData);
        
        const result = await settingsApi.upsert(settingsData);
        console.log('Disable appointments setting saved successfully:', result);
        toast.success(checked ? 'Appointments disabled' : 'Appointments enabled');
      }
    } catch (error) {
      console.error('Error saving disable appointments setting:', error);
      toast.error('Failed to save setting');
    }
  };

  const handleWeeklyHolidayToggle = async (day: string) => {
    // Convert day name to number (0=Sunday, 1=Monday, etc.)
    const dayNumber = dayNumbers[day as keyof typeof dayNumbers];
    
    const currentWeeklyHolidays = schedulingSettings.weeklyHolidays || [];
    const updatedWeeklyHolidays = currentWeeklyHolidays.includes(day)
      ? currentWeeklyHolidays.filter(d => d !== day)
      : [...currentWeeklyHolidays, day];
    
    // Convert to numbers for database
    const weeklyHolidayNumbers = updatedWeeklyHolidays.map(d => dayNumbers[d as keyof typeof dayNumbers]);
    
    setSchedulingSettings(prev => ({
      ...prev,
      weeklyHolidays: updatedWeeklyHolidays
    }));
    
    // Save to database
    try {
      if (clinic?.id) {
        console.log('Saving weekly holidays for clinic:', clinic.id);
        console.log('Weekly holiday numbers:', weeklyHolidayNumbers);
        
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
          weekly_holidays: weeklyHolidayNumbers,
          custom_holidays: (schedulingSettings.customHolidays || []).map(date => new Date(date).toISOString().split('T')[0]),
          disabled_appointments: schedulingSettings.appointmentsDisabled,
          disabled_slots: [],
          day_schedules: daySchedules,
          notification_settings: {
            email_notifications: true,
            reminder_hours: 24,
            auto_confirm: true
          }
        };
        
        console.log('Settings data to save:', settingsData);
        
        const result = await settingsApi.upsert(settingsData);
        console.log('Settings saved successfully:', result);
        toast.success('Weekly holidays updated');
      }
    } catch (error) {
      console.error('Error saving weekly holidays:', error);
      toast.error('Failed to save weekly holidays');
    }
  };

  const [newCustomHoliday, setNewCustomHoliday] = useState('');

  const handleAddCustomHoliday = async () => {
    if (newCustomHoliday) {
      const updatedCustomHolidays = [...schedulingSettings.customHolidays, newCustomHoliday];
      
      setSchedulingSettings(prev => ({
        ...prev,
        customHolidays: updatedCustomHolidays
      }));
      setNewCustomHoliday('');
      
      // Save to database
      try {
        if (clinic?.id) {
          await settingsApi.upsert({
            clinic_id: clinic.id,
            weekly_holidays: schedulingSettings.weeklyHolidays.map(d => dayNumbers[d as keyof typeof dayNumbers]),
            custom_holidays: updatedCustomHolidays.map(date => new Date(date).toISOString().split('T')[0]), // Convert to DATE format
            disabled_appointments: schedulingSettings.appointmentsDisabled,
            disabled_slots: [],
            day_schedules: {},
            notification_settings: {
              email_notifications: true,
              reminder_hours: 24,
              auto_confirm: true
            }
          });
          toast.success('Custom holiday added');
        }
      } catch (error) {
        console.error('Error saving custom holiday:', error);
        toast.error('Failed to save custom holiday');
      }
    }
  };

  const handleRemoveCustomHoliday = async (holiday: string) => {
    const updatedCustomHolidays = schedulingSettings.customHolidays.filter(h => h !== holiday);
    
    setSchedulingSettings(prev => ({
      ...prev,
      customHolidays: updatedCustomHolidays
    }));
    
    // Save to database
    try {
      if (clinic?.id) {
        console.log('Removing custom holiday:', holiday);
        
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
          custom_holidays: updatedCustomHolidays.map(date => new Date(date).toISOString().split('T')[0]),
          disabled_appointments: schedulingSettings.appointmentsDisabled,
          disabled_slots: [],
          day_schedules: daySchedules,
          notification_settings: {
            email_notifications: true,
            reminder_hours: 24,
            auto_confirm: true
          }
        };
        
        console.log('Settings data after removing custom holiday:', settingsData);
        
        const result = await settingsApi.upsert(settingsData);
        console.log('Settings updated successfully after removing custom holiday:', result);
        toast.success('Custom holiday removed');
      }
    } catch (error) {
      console.error('Error removing custom holiday:', error);
      toast.error('Failed to remove custom holiday');
    }
  };

  // Use real appointments data if available, otherwise use empty array
  const realAppointments = appointments || [];
  const filteredAppointments = realAppointments.filter(appointment => {
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const completedAppointments = realAppointments.filter(apt => apt.status === 'Completed').length;
  const cancelledAppointments = realAppointments.filter(apt => apt.status === 'Cancelled').length;
  const totalAppointments = realAppointments.length;

  // Show loading while data is being fetched
  if (isLoading || clinicLoading || appointmentsLoading || settingsLoading) {
  return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
            {clinicLoading && <p className="text-sm text-gray-500 mt-2">Loading clinic data...</p>}
            {appointmentsLoading && <p className="text-sm text-gray-500 mt-2">Loading appointments...</p>}
            {settingsLoading && <p className="text-sm text-gray-500 mt-2">Loading settings...</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage appointments and clinic settings</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                onClick={() => setShowSettings(!showSettings)} 
                variant="outline" 
                className="flex items-center gap-2 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 text-sm">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
                <p className="text-xs text-muted-foreground">Finished appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Today</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{cancelledAppointments}</div>
                <p className="text-xs text-muted-foreground">Cancelled appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Cancelled Appointments Section */}
          {cancelledAppointments > 0 && (
            <Card className="mb-6 md:mb-8">
              <CardHeader>
                <CardTitle className="text-red-700">Cancelled Appointments</CardTitle>
                <CardDescription>Recently cancelled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realAppointments
                    .filter(apt => apt.status === 'Cancelled')
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
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
                            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                            title="Call patient"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(appointment.phone, 'cancellation', appointment)}
                            className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
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
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-8 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-w-[140px]"
                />
                {filterDate && filterDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Reset to today"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
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
              <Button 
                onClick={() => setShowNewAppointmentDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Appointment</span>
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || filterDate || filterStatus !== 'all') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">Active Filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {filterDate && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                      Date: {format(new Date(filterDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filterStatus !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
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
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
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
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
                                className="h-8 w-8 p-0 text-blue-600 border-blue-300 hover:bg-blue-50 flex-shrink-0"
                                title="Call patient"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsApp(appointment.phone, 'confirmation', appointment)}
                                className="h-8 w-8 p-0 text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0"
                                title="Send WhatsApp message"
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
                              className="h-8 px-2 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
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

          {/* Settings Section */}
          {showSettings && (
            <Card className="mt-6 md:mt-8">
            <CardHeader>
              <CardTitle>Scheduling Settings</CardTitle>
                <CardDescription>Control the appointment window and slot generation</CardDescription>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`break-start-${selectedDay}`}>Break Start</Label>
                          <Input
                            id={`break-start-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].breakStart}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'breakStart', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`break-end-${selectedDay}`}>Break End</Label>
                          <Input
                            id={`break-end-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].breakEnd}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'breakEnd', e.target.value)}
                          />
                        </div>
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
                      
                      {/* Save Button */}
                      <div className="pt-4">
                        <Button 
                          onClick={handleSaveDaySchedule}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Save Day Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                  value={selectedAppointment.status} 
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
                      disabled={(date) => date < new Date()}
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
                            slot.booked ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed' : ''
                          )}
                          disabled={slot.disabled}
                          onClick={() => !slot.booked && setNewAppointmentForClient(prev => ({ ...prev, time: slot.value }))}
                        >
                          {slot.label}
                          {slot.booked && (
                            <span className="ml-1 text-xs">(Booked)</span>
                          )}
                        </Button>
                      ))}
                    </div>
                    {bookedSlotsForNewAppointment.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Red slots are already booked. Please select an available time.
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

      <Footer />
    </div>
  );
};

export default Admin;


