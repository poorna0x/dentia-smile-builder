import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Clock, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dentistChildImage from '@/assets/dentist-patient.jpg';
import { toast } from 'sonner';
import { appointmentsApi, supabase, disabledSlotsApi, DisabledSlot } from '@/lib/supabase';
import { useClinic } from '@/contexts/ClinicContext';
import { useSettings } from '@/hooks/useSettings';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { sendAppointmentConfirmation } from '@/lib/email';
import CaptchaModal from '@/components/CaptchaModal';
import { 
  checkSecurityStatus, 
  recordAppointmentAttempt, 
  resetSecurityOnSuccess 
} from '@/lib/security';
import { sendNewAppointmentNotification } from '@/lib/push-notifications';



const Appointment = () => {
  const navigate = useNavigate();
  const { clinic, loading: clinicLoading, error: clinicError } = useClinic();
  const { settings, loading: settingsLoading } = useSettings();
  
  // Ensure page starts at top
  useScrollToTop();

  // Debug: Log settings structure (simplified)
  useEffect(() => {
    // Settings loaded successfully
  }, [settings]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState<Date>(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow; // Start with tomorrow, will be updated when settings load
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [disabledSlots, setDisabledSlots] = useState<DisabledSlot[]>([]);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{
    requiresCaptcha: boolean;
    reason: string;
    cooldownRemaining?: number;
  }>({ requiresCaptcha: false, reason: '' });

  // Realtime functionality
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('disconnected');


  // Get next available booking date (skip holidays)
  const getNextAvailableDate = (): Date => {
    const today = new Date();
    let nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 1); // Start with tomorrow
    
    // Check up to 30 days ahead to find an available date
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i + 1);
      
      // Check if it's a holiday
      const isHoliday = isDateHoliday(checkDate);
      if (!isHoliday) {
        return checkDate;
      }
    }
    
    // Fallback to tomorrow if all dates are holidays
    return nextDate;
  };

  // Check if a date is a holiday
  const isDateHoliday = (checkDate: Date): boolean => {
    if (!settings) return false;
    
    const isoDate = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check weekly holidays (array of numbers: 0=Sunday, 1=Monday, etc.)
    const weeklyHolidays = settings.weekly_holidays || [];
    const isWeeklyHoliday = weeklyHolidays.includes(dayOfWeek);
    
    // Check custom holidays (array of date strings)
    const customHolidays = settings.custom_holidays || [];
    const isCustomHoliday = customHolidays.includes(isoDate);
    
    // Holiday check completed
    
    return isWeeklyHoliday || isCustomHoliday;
  };

  // Update date to next available date when settings load
  useEffect(() => {
    if (settings && !settingsLoading) {
      const nextAvailableDate = getNextAvailableDate();
      setDate(nextAvailableDate);
    }
  }, [settings, settingsLoading]);



  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Setup push notifications on component mount
  useEffect(() => {
    if (clinic?.id) {
  
    }
  }, [clinic?.id]);



  // Check for booked slots and disabled slots when date changes
  const checkBookedSlots = useCallback(async () => {
    if (!clinic?.id) return;
    
    setIsLoadingSlots(true);
    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      
      // Force refresh to get latest data (bypass cache)
      const existingAppointments = await appointmentsApi.getByDate(clinic.id, appointmentDate);
      
      // Get booked time slots (exclude cancelled appointments)
      const booked = existingAppointments
        .filter(apt => apt.status !== 'Cancelled')
        .map(apt => apt.time);
      
      // Updated booked slots
      setBookedSlots(booked);
      
      // Load disabled slots for this date
      await loadDisabledSlots(date);
    } catch (error) {
      console.error('Error checking booked slots:', error);
      setBookedSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [clinic?.id, date]);

  // Initial load when date or clinic changes
  useEffect(() => {
    checkBookedSlots();
  }, [date, clinic?.id]);

  // Lightweight real-time simulation for slot availability
  useEffect(() => {
    if (!clinic?.id) return;

    // Setting up lightweight real-time simulation for clinic

    const setupLightweightRealtime = async () => {
      try {
        const { initializeLightweightRealtime, useLightweightRealtime } = await import('@/lib/lightweight-realtime');
        
        // Initialize the lightweight real-time manager first
        initializeLightweightRealtime(supabase, clinic.id);
        
        const { subscribeToAppointments, subscribeToDisabledSlots } = useLightweightRealtime(clinic.id);

        // Subscribe to appointments with smart polling
        const unsubscribeAppointments = await subscribeToAppointments((update) => {
          // Appointment lightweight update
          if (update.type === 'UPDATED') {
            // Check if any changes affect the current date
            const currentDate = format(date, 'yyyy-MM-dd');
            const hasRelevantChanges = update.data.some((appointment: any) => 
              appointment.date === currentDate
            );
            
            if (hasRelevantChanges) {
              // Refreshing booked slots due to appointment changes
              checkBookedSlots();
            }
          }
          setRealtimeStatus('connected');
        });

        // Subscribe to disabled slots with date-specific polling
        const unsubscribeDisabledSlots = await subscribeToDisabledSlots((update) => {
          // Disabled slots lightweight update
          if (update.type === 'UPDATED') {
            // Check if any changes affect the current date
            const currentDate = format(date, 'yyyy-MM-dd');
            const hasRelevantChanges = update.data.some((slot: any) => 
              slot.date === currentDate
            );
            
            if (hasRelevantChanges) {
              // Refreshing disabled slots due to changes
              loadDisabledSlots(date);
            }
          }
        }, format(date, 'yyyy-MM-dd'));

        setRealtimeStatus('connected');
        // Appointment lightweight real-time simulation active

        // Cleanup function
        return () => {
          // Cleaning up appointment lightweight real-time subscriptions
          unsubscribeAppointments();
          unsubscribeDisabledSlots();
        };
      } catch (error) {
        console.error('❌ Failed to setup appointment lightweight real-time:', error);
        setRealtimeStatus('disconnected');
      }
    };

    const cleanup = setupLightweightRealtime();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
      // Also cleanup the lightweight manager when component unmounts
      const cleanupManager = async () => {
        try {
          const { cleanupLightweightRealtime } = await import('@/lib/lightweight-realtime');
          cleanupLightweightRealtime();
        } catch (error) {
          console.warn('⚠️ Failed to cleanup lightweight real-time manager:', error);
        }
      };
      cleanupManager();
    };
  }, [clinic?.id, date]);

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
    }
    
    // Return original if no formatting needed
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
    
    return false;
  };

  // Name formatting function
  const formatName = (name: string): string => {
    // Remove extra spaces and trim
    let formatted = name.trim().replace(/\s+/g, ' ');
    
    // Convert to title case (first letter of each word capitalized)
    formatted = formatted.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    
    return formatted;
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone input change with validation and formatting
  const handlePhoneChange = (value: string) => {
    // Allow user to type freely, but format for display
    setPhone(value);
    
    if (!value.trim()) {
      setPhoneError('');
      return;
    }
    
    // Validate the formatted phone number
    if (!validatePhone(value)) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g., 9876543210, +91 9876543210, 09876543210)');
    } else {
      setPhoneError('');
    }
  };

  // Handle email input change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    
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

  // Get current settings or use defaults
  // Get settings for the specific day of the week
  const getDaySettings = (selectedDate: Date) => {
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daySchedule = settings?.day_schedules?.[dayOfWeek];
    
    // For now, use simple single break format to get the page working
    const breakStart = daySchedule?.break_start || '13:00';
    const breakEnd = daySchedule?.break_end || '14:00';
    
    return {
      startTime: daySchedule?.start_time || '09:00',
      endTime: daySchedule?.end_time || '20:00',
      breakStart: breakStart,
      breakEnd: breakEnd,
      slotIntervalMinutes: daySchedule?.slot_interval_minutes || 30,
      enabled: daySchedule?.enabled ?? true,
      weeklyHolidays: settings?.weekly_holidays || [],
      customHolidays: settings?.custom_holidays || [],
      disabledAppointments: settings?.disabled_appointments || false,
    };
  };

  const currentSettings = getDaySettings(date);

  // Load disabled slots for a specific date
  const loadDisabledSlots = useCallback(async (targetDate: Date) => {
    if (!clinic?.id) return;
    
    try {
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const slots = await disabledSlotsApi.getByClinicAndDate(clinic.id, dateString);
      setDisabledSlots(slots);
    } catch (error) {
      console.error('Error loading disabled slots:', error);
    }
  }, [clinic?.id]);

  const isHoliday = (d: Date) => {
    return isDateHoliday(d);
  };

  const generateTimeSlots = (dateForSlots: Date) => {
    const daySettings = getDaySettings(dateForSlots);
    
    // Check if the day is enabled
    if (!daySettings.enabled) {
      return [];
    }
    
    // Check if it's a holiday
    if (isHoliday(dateForSlots)) {
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

    // Handle break periods - convert arrays to Date objects
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

      // Disable past times and times within 1 hour if the selected date is today
      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const isPast = isToday && slotStart.getTime() <= oneHourFromNow.getTime();

      if (!overlapsBreak && !overlapsDisabledSlot && slotEnd <= end) {
        const label = `${format(slotStart, 'hh:mm a')} - ${format(slotEnd, 'hh:mm a')}`;
        const isBooked = bookedSlots.includes(label);
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

  const timeSlots = generateTimeSlots(date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate phone number
    if (!validatePhone(phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    if (currentSettings.disabledAppointments) {
      toast.error('Appointments are currently disabled');
      return;
    }
    
    // Check security status before proceeding
    const status = checkSecurityStatus();
    setSecurityStatus(status);
    
    if (status.requiresCaptcha) {
      setShowCaptcha(true);
      return;
    }
    
    // Record appointment attempt for security tracking
    recordAppointmentAttempt(email, phone);
    
    // Show confirmation dialog instead of proceeding directly
    setShowConfirmation(true);
  };

  const handleCaptchaSuccess = () => {
    setShowCaptcha(false);
    // Record appointment attempt and show confirmation
    recordAppointmentAttempt(email, phone);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    // Don't close the dialog immediately - let the loader show
    // setShowConfirmation(false);
    
    // Format phone number and name for storage (available in try and catch blocks)
    const formattedPhone = formatPhoneNumber(phone);
    const formattedName = formatName(name);
    
    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      
      // Check for duplicate booking first
      if (clinic?.id) {
        // Checking for duplicate booking
        
        // Get existing appointments for the same date and time
        const existingAppointments = await appointmentsApi.getByDateAndTime(
          clinic.id,
          appointmentDate,
          selectedTime
        );
        
        if (existingAppointments && existingAppointments.length > 0) {
          toast.error(`This time slot (${selectedTime}) is already booked. Please select a different time.`);
          setIsSubmitting(false);
          return;
        }
        
        // No duplicate found, proceeding with booking
        
        const newAppointment = await appointmentsApi.create({
          clinic_id: clinic.id,
          name: formattedName,
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          date: appointmentDate,
          time: selectedTime,
          status: 'Confirmed'
        });
        
        // Send push notification for new appointment
        try {
          await sendNewAppointmentNotification(newAppointment);
          // Push notification sent for new appointment
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
        
        // Send confirmation email to patient
        const patientEmailSent = await sendAppointmentConfirmation({
          name: formattedName,
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          date: appointmentDate,
          time: selectedTime,
          status: 'Confirmed',
          clinicName: clinic.name || 'Jeshna Dental Clinic',
          clinicPhone: clinic.contact_phone || '6363116263',
          clinicEmail: clinic.contact_email || 'poorn8105@gmail.com'
        });

        // Log email status
        // Email status handled

        // Reset security on successful booking
        resetSecurityOnSuccess();

        // Navigate to booking completion page with appointment details
        const params = new URLSearchParams({
          name: formattedName,
          date: format(date, 'MMMM dd, yyyy'),
          time: selectedTime,
          email: email.trim(),
          phone: formattedPhone
        });
        
        navigate(`/booking-complete?${params.toString()}`);
        
      } else {
        // Fallback to WhatsApp if no clinic ID
        // No clinic ID, falling back to WhatsApp
        const formattedDate = format(date, 'MMM dd, yyyy');
        const message = `Hi, I'm ${formattedName} (${email}, ${formattedPhone}) and I want an appointment on ${formattedDate}. Preferred time: ${selectedTime}.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/6363116263?text=${encodedMessage}`, '_blank');
        
        // Navigate to booking completion page with appointment details
        const params = new URLSearchParams({
          name: formattedName,
          date: format(date, 'MMMM dd, yyyy'),
          time: selectedTime,
          email: email.trim(),
          phone: formattedPhone
        });
        
        navigate(`/booking-complete?${params.toString()}`);
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      
      // Check if it's a duplicate booking error
      if (error instanceof Error && error.message.includes('duplicate')) {
        toast.error(`This time slot (${selectedTime}) is already booked. Please select a different time.`);
      } else {
        // Fallback to WhatsApp if database fails
        const formattedDate = format(date, 'MMM dd, yyyy');
        const message = `Hi, I'm ${formattedName} (${email}, ${formattedPhone}) and I want an appointment on ${formattedDate}. Preferred time: ${selectedTime}.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/6363116263?text=${encodedMessage}`, '_blank');
        
        // Navigate to booking completion page with appointment details
        const params = new URLSearchParams({
          name: formattedName,
          date: format(date, 'MMMM dd, yyyy'),
          time: selectedTime,
          email: email.trim(),
          phone: formattedPhone
        });
        
        navigate(`/booking-complete?${params.toString()}`);
      }
    } finally {
      setIsSubmitting(false);
      // Close the dialog after processing is complete
      setShowConfirmation(false);
    }
  };

  // Show loading while clinic context is loading
  if (clinicLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while clinic and settings are loading
  if (clinicLoading || settingsLoading) {
    return (
      <div className="min-h-screen">
        <main className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading appointment page...</p>
                {clinicLoading && <p className="text-sm text-gray-500 mt-2">Loading clinic data...</p>}
                {settingsLoading && <p className="text-sm text-gray-500 mt-2">Loading settings...</p>}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if clinic failed to load
  if (clinicLoading || settingsLoading) {
    return (
      <div className="min-h-screen">
        <main className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <p className="text-muted-foreground">Loading appointment booking...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Clinic loading: {clinicLoading ? 'Yes' : 'No'}, 
                  Settings loading: {settingsLoading ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (clinicError) {
    return (
      <div className="min-h-screen">
        <main className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <p className="text-red-600">Error loading clinic data. Please refresh the page.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Simple fallback if something goes wrong
  if (!clinic && !clinicLoading) {
    return (
      <div className="min-h-screen">
        <main className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Appointment Booking</h1>
                <p className="text-muted-foreground">Loading clinic data...</p>
                <p className="text-sm text-gray-500 mt-2">If this persists, please refresh the page.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">

      <main className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Form Section */}
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="heading-xl text-primary">Book Appointment</h1>
                  <p className="body-lg text-muted-foreground">
                    Book your appointment today for expert dental care tailored to your needs. 
                    Healthy, beautiful smiles start with a simple step, schedule now!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    💌 We don't spam! Your email is only used for appointment confirmations and important updates.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium text-primary">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full p-4 text-base border-2 border-border rounded-xl focus:border-accent transition-colors"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium text-primary">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                      className={cn(
                        "w-full p-4 text-base border-2 rounded-xl focus:border-accent transition-colors",
                        emailError ? "border-red-500 focus:border-red-500" : "border-border"
                      )}
                    />
                    {emailError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {emailError}
                      </div>
                    )}
                    {email && !emailError && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Valid email address
                      </div>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium text-primary">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210, +91 9876543210, or 09876543210"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                      className={cn(
                        "w-full p-4 text-base border-2 rounded-xl focus:border-accent transition-colors",
                        phoneError ? "border-red-500 focus:border-red-500" : "border-border"
                      )}
                    />
                    {phoneError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {phoneError}
                      </div>
                    )}
                    {phone && !phoneError && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Valid phone number
                      </div>
                    )}
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-base font-medium text-primary">
                      Date of Appointment
                    </Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full p-4 text-base border-2 border-border rounded-xl justify-start text-left font-normal hover:border-accent transition-colors",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5 text-accent" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              setDate(selectedDate);
                              setIsCalendarOpen(false);
                            }
                          }}
                          // Disable past dates and holidays
                          disabled={(day) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = day < today;
                            const isHoliday = isDateHoliday(day);
                            return isPast || isHoliday;
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}

                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slots or Holiday Notice */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-primary">
                      Available Time Slots
                    </Label>
                    {currentSettings.disabledAppointments ? (
                      <div className="text-sm text-destructive">
                        Appointments are temporarily disabled.
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-sm text-destructive">
                        {(() => {
                          const daySettings = getDaySettings(date);
                          if (!daySettings.enabled) {
                            return 'Clinic is closed on this day of the week.';
                          } else if (isHoliday(date)) {
                            return 'Clinic is closed on this date (holiday).';
                          } else {
                            return 'No available time slots for this date.';
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isLoadingSlots && (
                          <div className="text-sm text-muted-foreground">
                            Loading available slots...
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timeSlots.map((ts) => (
                            <Button
                              key={ts.value}
                              type="button"
                              variant={selectedTime === ts.value ? 'default' : 'outline'}
                              className={cn(
                                'justify-center', 
                                selectedTime === ts.value ? 'btn-appointment' : '',
                                ts.booked ? 'bg-red-500 text-white border-red-500 cursor-not-allowed hover:bg-red-500 hover:text-white' : ''
                              )}
                              disabled={ts.disabled || ts.booked}
                              onClick={() => !ts.booked && setSelectedTime(ts.value)}
                            >
                              {ts.label}
                            </Button>
                          ))}
                        </div>
                        {bookedSlots.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Red slots are unavailable. Please select an available time.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="btn-appointment w-full text-lg py-4"
                    disabled={
                      currentSettings.disabledAppointments || 
                      !name.trim() || 
                      !email.trim() || 
                      !phone.trim() || 
                      !selectedTime ||
                      !!phoneError ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? 'Booking Appointment...' : 'Book Appointment'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Image Section */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={dentistChildImage}
                  alt="Professional dentist with happy child patient"
                  className="w-full h-auto"
                />
                
                {/* Opening Hours Overlay */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 rounded-full">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">Opening Hours</p>
                      <p className="text-muted-foreground text-sm">Mon to Sat 09:00 - 20:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isSubmitting ? 'Processing Appointment...' : 'Confirm Appointment'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Please review your appointment details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className={`space-y-4 py-2 relative transition-opacity duration-300 ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}>
            {/* Loading Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                  <p className="text-base font-medium text-gray-700">Processing your appointment...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait...</p>
                </div>
              </div>
            )}
            
            {/* Patient Info - Minimal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{formatName(name)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{email.trim().toLowerCase()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="font-medium text-gray-900">{formatPhoneNumber(phone)}</span>
              </div>
            </div>
            
            {/* Appointment Details - Minimal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{format(date, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">{selectedTime}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="font-medium">Processing...</span>
                </div>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
      
      {/* CAPTCHA Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
        reason={securityStatus.reason}
        cooldownRemaining={securityStatus.cooldownRemaining}
      />
    </div>
  );
};

export default Appointment;
