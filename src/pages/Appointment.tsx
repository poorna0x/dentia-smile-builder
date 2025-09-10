import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { appointmentsApi, supabase, disabledSlotsApi, DisabledSlot, getMinimumAdvanceNotice } from '@/lib/supabase';
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
import { QueryOptimizer } from '@/lib/db-optimizations';

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clinic, loading: clinicLoading, error: clinicError } = useClinic();
  const { settings, loading: settingsLoading } = useSettings();
  
  
  // Ensure page starts at top
  useScrollToTop();

  // Debug: Log settings structure (simplified)
  useEffect(() => {
    console.log('⚙️ Settings useEffect triggered, settings:', !!settings);
  }, [settings]);

  // Handle pre-filled patient data from URL parameters
  useEffect(() => {
    const patientParam = searchParams.get('patient');
    if (patientParam) {
      try {
        const patientData = JSON.parse(decodeURIComponent(patientParam));
        if (patientData.name) setName(patientData.name);
        if (patientData.phone) setPhone(patientData.phone);
        if (patientData.email) setEmail(patientData.email);
        
        // Store patient ID for appointment creation
        if (patientData.id) {
          localStorage.setItem('appointmentPatientId', patientData.id);
        }
        
        // Pre-filled patient data
      } catch (error) {
        console.error('Error parsing patient data from URL:', error);
      }
    }
    
    // Cleanup function to clear patient ID when component unmounts
    return () => {
      localStorage.removeItem('appointmentPatientId');
    };
  }, [searchParams]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today; // Start with today
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
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

  // Add debounce mechanism to prevent duplicate refreshes
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  
  // 🚀 OPTIMIZED: Single loading state for all time slot operations
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(true);


  // Get next available booking date (skip holidays and respect minimum advance notice)
  const getNextAvailableDate = (): Date => {
    const today = new Date();
    const now = new Date();
    
    // Get minimum advance notice from settings (default to 24 hours)
    const minimumAdvanceNotice = getMinimumAdvanceNotice(settings);
    
    
    
    // Calculate the earliest allowed booking time
    const earliestBookingTime = new Date(now.getTime() + (minimumAdvanceNotice * 60 * 60 * 1000));
    
    // Start checking from the earliest allowed date
    let startDate = new Date(earliestBookingTime);
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    // If minimum advance notice is 0, allow booking today
    // Otherwise, if the earliest booking time is today, start from tomorrow
    if (minimumAdvanceNotice === 0) {
      // For 0 hours advance notice, start from today
      startDate = new Date(today);
    } else if (startDate <= today) {
      // For non-zero advance notice, start from tomorrow if earliest time is today
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
    }
    
    // Check up to 30 days ahead to find an available date
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      
      // Check if it's a holiday
      const isHoliday = isDateHoliday(checkDate);
      if (!isHoliday) {
        return checkDate;
      }
    }
    
    // Fallback to the earliest allowed date if all dates are holidays
    return startDate;
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
      // Appointment Debug - Settings loaded, calculating next available date
      
      const nextAvailableDate = getNextAvailableDate();
      // Appointment Debug - Next available date calculated
      setDate(nextAvailableDate);
    }
  }, [settings, settingsLoading]);



  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // FALLBACK: Force data load after component mounts (backup approach)
  // SINGLE: Initial data load when everything is ready
  useEffect(() => {
    if (clinic?.id && !settingsLoading && settings && !hasInitiallyLoaded) {
      checkBookedSlots(true);
    }
  }, [clinic?.id, settingsLoading, settings, hasInitiallyLoaded]);

  // Setup push notifications on component mount
  useEffect(() => {
    if (clinic?.id) {
  
    }
  }, [clinic?.id]);



  // Check for booked slots and disabled slots when date changes
  const checkBookedSlots = useCallback(async (forceRefresh = false) => {
    if (!clinic?.id) return;
    
    // 🚀 FIXED: Only apply debounce for non-force refreshes, and reduce it
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const minRefreshInterval = forceRefresh ? 0 : 100; // Reduced from 300ms to 100ms
    
    if (!forceRefresh && timeSinceLastRefresh < minRefreshInterval) {
      return;
    }
    
    // 🚀 FIXED: Allow force refresh even if already refreshing
    if (isRefreshing && !forceRefresh) {
      return;
    }
    
    
    setIsRefreshing(true);
    // 🚀 OPTIMIZED: Use single loading state
    if (forceRefresh) {
      setIsLoadingTimeSlots(true);
    }
    setLastRefreshTime(now);
    
    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      
      // 🚀 FIXED: Always clear cache for better consistency
      if (typeof QueryOptimizer !== 'undefined') {
        try {
          // Clear all appointment-related cache entries
          QueryOptimizer.clearCache(`appointments_date_${clinic.id}_${appointmentDate}`);
          QueryOptimizer.clearCache(`appointments_all_${clinic.id}`);
          QueryOptimizer.clearCache('appointments');
        } catch (error) {
          window.console.warn('Failed to clear cache:', error);
        }
      }
      
      // 🚀 OPTIMIZED: Load appointments and disabled slots in parallel for faster loading
      // Force fresh data by bypassing cache
      const [existingAppointments, disabledSlotsData, allAppointments] = await Promise.all([
        // Use the same reliable query as manual query
        supabase
          .from('appointments')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('date', appointmentDate)
          .neq('status', 'Cancelled')
          .then(({ data, error }) => {
            if (error) {
              window.console.error('Database query error:', error);
              throw error;
            }
            return data || [];
          }),
        loadDisabledSlots(date),
        // Also get all appointments for this clinic to see what's in the database
        supabase
          .from('appointments')
          .select('*')
          .eq('clinic_id', clinic.id)
          .order('date', { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          })
      ]);
      
      
      // Get booked time slots (exclude cancelled appointments)
      const booked = existingAppointments
        .filter(apt => apt.status !== 'Cancelled')
        .map(apt => apt.time);
      
      
      // 🚀 OPTIMIZED: Immediate state update for better responsiveness
      setBookedSlots(booked);
      
      // Mark that we've completed initial load
      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true);
      }
    } catch (error) {
      console.error('Error checking booked slots:', error);
      setBookedSlots([]);
    } finally {
      setIsRefreshing(false);
      // 🚀 OPTIMIZED: Mark loading complete
      setIsLoadingTimeSlots(false);
    }
  }, [clinic?.id, date, lastRefreshTime, isRefreshing]);

  // Load when date or clinic changes - but only after initial load is complete
  useEffect(() => {
    if (clinic?.id && !settingsLoading && settings && hasInitiallyLoaded) {
      checkBookedSlots(true);
    }
  }, [date, clinic?.id, settingsLoading, settings, hasInitiallyLoaded]);

  // Force re-render when bookedSlots changes to ensure time slots update
  useEffect(() => {
    if (bookedSlots.length >= 0) { // Changed from > 0 to >= 0 to catch empty arrays too
      setRenderKey(prev => prev + 1);
    }
  }, [bookedSlots]);

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

        // Subscribe to appointments with simple updates
        const unsubscribeAppointments = await subscribeToAppointments((update) => {
          if (update.type === 'UPDATED' || update.type === 'INSERTED') {
            // Simple refresh when appointments change
            const currentDate = format(date, 'yyyy-MM-dd');
            const hasRelevantChanges = update.data.some((appointment: any) => 
              appointment.date === currentDate
            );
            
            if (hasRelevantChanges) {
              // Clear cache and refresh the data immediately
              if (typeof QueryOptimizer !== 'undefined') {
                try {
                  QueryOptimizer.clearCache(`appointments_date_${clinic.id}_${currentDate}`);
                  QueryOptimizer.clearCache('appointments');
                } catch (error) {
                  console.warn('Failed to clear cache on real-time update:', error);
                }
              }
              
              // Refresh with a small delay to ensure database consistency
              setTimeout(() => {
                checkBookedSlots(true);
              }, 200);
            }
          }
          setRealtimeStatus('connected');
        });

        // Subscribe to disabled slots with simple updates
        const unsubscribeDisabledSlots = await subscribeToDisabledSlots((update) => {
          if (update.type === 'UPDATED' || update.type === 'INSERTED' || update.type === 'DELETED') {
            // Simple refresh when disabled slots change
            setTimeout(() => {
              loadDisabledSlots(date);
            }, 100);
          }
        }, format(date, 'yyyy-MM-dd'));

        setRealtimeStatus('connected');
        // Appointment lightweight real-time simulation active

        // Cleanup function
        return () => {
          // Cleaning up appointment lightweight real-time subscriptions
          unsubscribeAppointments();
          unsubscribeDisabledSlots();
          // Reset refresh state on cleanup
          setIsRefreshing(false);
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
  }, [clinic?.id]); // Removed date dependency to prevent re-initialization on every date change

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
    // Allow user to type freely, but format for display
    setPhone(value);
    
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
      // Loading disabled slots for date
      const slots = await disabledSlotsApi.getByClinicAndDate(clinic.id, dateString);
              // Disabled slots loaded
      setDisabledSlots(slots);
    } catch (error) {
      console.error('❌ Error loading disabled slots:', error);
      // Set empty array on error to prevent stale data
      setDisabledSlots([]);
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
    
    // Debug logging for disabled slots
    if (disabledSlotsForDate.length > 0) {
      // Disabled slots for dateString
    }

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
    
    // Debug logging for break periods
    if (breakPeriods.length > 1) {
      // Break Periods Debug
    }

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
        
        const overlaps = slotStart < disabledEnd && slotEnd > disabledStart;
        
        // Debug logging for slot overlap
        if (overlaps) {
          // Slot disabled due to overlap
        }
        
        return overlaps;
      });

      // Disable past times based on minimum advance notice setting
      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const minimumAdvanceNotice = getMinimumAdvanceNotice(settings);
      const earliestAllowedTime = new Date(now.getTime() + (minimumAdvanceNotice * 60 * 60 * 1000));
      const isPast = isToday && slotStart.getTime() <= earliestAllowedTime.getTime();
      
      // Debug logging for time slots
      if (isToday && slotStart.getTime() > now.getTime() && slotStart.getTime() <= earliestAllowedTime.getTime()) {
        // Time Slot Debug - Slot being disabled
      }

      if (!overlapsBreak && slotEnd <= end) {
        const label = `${format(slotStart, 'hh:mm a')} - ${format(slotEnd, 'hh:mm a')}`;
        const isBooked = bookedSlots.includes(label);
        
        const isBlocked = overlapsDisabledSlot;
        
        
        // Only add slots that are not blocked by admin settings
        if (!isBlocked) {
          slots.push({ 
            label, 
            value: label, 
            disabled: isBooked || isPast,
            booked: isBooked
          });
        }
      }
    }

    // Generated time slots for date
    console.log('✅ Generated', slots.length, 'time slots for', format(dateForSlots, 'yyyy-MM-dd'), 'booked slots:', bookedSlots.length);
    return slots;
  };

  // Generate time slots directly - no memoization to avoid timing issues
  const timeSlots = (() => {
    console.log('🎯 TIME SLOTS GENERATION CALLED');
    
    // Don't generate slots if still loading or if settings aren't ready
    if (isLoadingTimeSlots || !settings || settingsLoading) {
      console.log('⏸️ Skipping time slot generation - loading:', isLoadingTimeSlots, 'settings:', !!settings, 'settingsLoading:', settingsLoading, 'renderKey:', renderKey);
      return [];
    }
    
    console.log('🔄 Generating time slots directly', {
      date: format(date, 'yyyy-MM-dd'),
      disabledSlotsCount: disabledSlots.length,
      bookedSlotsCount: bookedSlots.length,
      hasSettings: !!settings,
      renderKey: renderKey
    });
    
    const slots = generateTimeSlots(date);
    
    return slots;
  })();

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
        
        // Check if we have a specific patient ID from URL parameters (only for known patients)
        let patientId = localStorage.getItem('appointmentPatientId');
        
        if (patientId) {
          // Using patient ID from URL parameters
          // Clear the stored patient ID after use
          localStorage.removeItem('appointmentPatientId');
        } else {
          // Don't pre-link patients by phone - let the database trigger handle it
          // This ensures proper name matching and new patient creation
          patientId = null;
          // No pre-existing patient ID, letting database trigger handle patient linking
        }

        const newAppointment = await appointmentsApi.create({
          clinic_id: clinic.id,
          name: formattedName,
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          date: appointmentDate,
          time: selectedTime,
          status: 'Confirmed',
          patient_id: patientId
        });
        
        // 🚀 CRITICAL FIX: Invalidate cache and update state immediately after appointment creation
        // This ensures the booked slot appears immediately without requiring a refresh
        if (clinic?.id) {
          try {
            // Clear QueryOptimizer cache for this specific date
            if (typeof QueryOptimizer !== 'undefined') {
              QueryOptimizer.clearCache(`appointments_date_${clinic.id}_${appointmentDate}`);
              QueryOptimizer.clearCache('appointments');
            }
          } catch (error) {
            console.warn('Failed to clear cache after appointment creation:', error);
          }
          
          // Immediately update the local state to show the booked slot
          setBookedSlots(prevBooked => {
            const newBooked = [...prevBooked, selectedTime];
            // Remove duplicates and sort
            return Array.from(new Set(newBooked)).sort();
          });
          
          // Force refresh the booked slots to ensure consistency with database
          // Use multiple attempts to ensure database transaction is complete
          setTimeout(() => {
            console.log('🔄 First refresh attempt after booking');
            checkBookedSlots(true);
          }, 300);
          
          // Second refresh attempt as backup
          setTimeout(() => {
            console.log('🔄 Second refresh attempt after booking');
            checkBookedSlots(true);
          }, 1000);
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
                      <span className="text-sm text-muted-foreground ml-2">
                        (Valid formats: 9876543210, +91 9876543210, 09876543210)
                      </span>
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
                          // Disable past dates, holidays, and dates that don't meet minimum advance notice
                          disabled={(day) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const now = new Date();
                            
                            // Get minimum advance notice from settings (default to 24 hours)
                            const minimumAdvanceNotice = getMinimumAdvanceNotice(settings);
                            
                            // Calculate the earliest allowed booking time
                            const earliestBookingTime = new Date(now.getTime() + (minimumAdvanceNotice * 60 * 60 * 1000));
                            const earliestBookingDate = new Date(earliestBookingTime);
                            earliestBookingDate.setHours(0, 0, 0, 0);
                            
                            const isPast = day < today;
                            // For 0 hours advance notice, don't check if too soon
                            const isTooSoon = minimumAdvanceNotice === 0 ? false : day < earliestBookingDate;
                            const isHoliday = isDateHoliday(day);
                            
                            // Debug logging for specific dates
                            if (day.getDate() === new Date().getDate()) { // Today
                              // Calendar Debug - Today check
                            } else if (day.getDate() === new Date().getDate() + 1) { // Tomorrow
                              // Calendar Debug - Tomorrow check
                            }
                            
                            return isPast || isTooSoon || isHoliday;
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}

                        />
                      </PopoverContent>
                    </Popover>
                  </div>



                  {/* Time Slots or Holiday Notice */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium text-primary">
                        Available Time Slots
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          checkBookedSlots(true);
                        }}
                        disabled={isLoadingTimeSlots}
                        className="text-xs px-2 py-1 h-7"
                      >
                        {isLoadingTimeSlots ? '⟳' : '↻'} Refresh
                      </Button>
                    </div>
                    
                    {/* 🚀 OPTIMIZED: Single loading state */}
                    {isLoadingTimeSlots ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <div className="text-center">
                        </div>
                      </div>
                    ) : (
                      <div className="h-[280px] flex flex-col">
                        {currentSettings.disabledAppointments ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-sm text-destructive">
                              Appointments are temporarily disabled.
                            </div>
                          </div>
                        ) : timeSlots.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
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
                          </div>
                        ) : (
                          <div className="space-y-2 h-full flex flex-col">
                            <div className="relative">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-y-auto max-h-[200px] p-1">
                                {timeSlots.map((ts) => (
                                  <Button
                                    key={ts.value}
                                    type="button"
                                    variant={ts.booked ? 'destructive' : selectedTime === ts.value ? 'default' : 'outline'}
                                    className={cn(
                                      'justify-center h-12 rounded-md transition-all duration-200 time-slot-button', 
                                      // Booked slots - highest priority styling
                                      ts.booked && '!bg-red-500 !text-white !border-red-500 !cursor-not-allowed hover:!bg-red-600 hover:!text-white hover:!border-red-600',
                                      // Selected slot styling (only if not booked)
                                      selectedTime === ts.value && !ts.booked && 'btn-appointment',
                                      // Disabled slots (past times, not booked)
                                      ts.disabled && !ts.booked && '!bg-gray-300 !text-gray-500 !border-gray-300 !cursor-not-allowed hover:!bg-gray-300 hover:!text-gray-500'
                                    )}
                                    disabled={ts.disabled || ts.booked}
                                    onClick={() => !ts.booked && setSelectedTime(ts.value)}
                                  >
                                    {ts.label}
                                  </Button>
                                ))}
                              </div>
                              {/* Scroll indicator - only show if there are actually more slots */}
                              {(() => {
                                // Calculate how many slots fit in the visible area
                                // Container height: 200px, slot height: 48px (h-12), gap: 8px
                                // Roughly 3-4 rows visible = 9-12 slots (3 columns)
                                const slotsPerRow = 3; // 3 columns
                                const visibleRows = 3; // Conservative estimate for 200px height
                                const visibleSlots = slotsPerRow * visibleRows; // 9 slots
                                const hasMoreSlots = timeSlots.length > visibleSlots;
                                return hasMoreSlots;
                              })() && (
                                <div className="absolute -bottom-4 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center">
                                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-sm border border-blue-200">
                                    Scroll for more slots
                                  </div>
                                </div>
                              )}
                            </div>
                            {(bookedSlots.length > 0 || timeSlots.some(ts => ts.disabled && !ts.booked) || isRefreshing) && (
                              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-gray-200">
                                <div className="space-y-1">
                                  {isRefreshing && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Updating slot availability...</span>
                                    </div>
                                  )}
                                  {bookedSlots.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                                      <span>Red slots are booked and unavailable ({bookedSlots.length} booked)</span>
                                    </div>
                                  )}
                                  {timeSlots.some(ts => ts.disabled && !ts.booked) && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                      <span>Gray slots are past times and unavailable</span>
                                    </div>
                                  )}
                                  <div>Please select an available time slot.</div>
                                </div>
                              </div>
                            )}
                            {(() => {
                              const dateString = format(date, 'yyyy-MM-dd');
                              const disabledSlotsForDate = disabledSlots.filter(slot => slot.date === dateString);
                              return disabledSlotsForDate.length > 0 ? (
                                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">
                                  ⚠️ Some time slots are blocked by admin settings for this date.
                                </div>
                              ) : null;
                            })()}
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
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
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
