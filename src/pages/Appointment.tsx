import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dentistChildImage from '@/assets/dentist-patient.jpg';
import { toast } from 'sonner';
import { appointmentsApi } from '@/lib/supabase';
import { useClinic } from '@/contexts/ClinicContext';
import { useSettings } from '@/hooks/useSettings';
import { sendAppointmentConfirmation } from '@/lib/email';
import { showAppointmentNotification, sendPushNotification } from '@/lib/notifications';

const Appointment = () => {
  const { clinic, loading: clinicLoading, error: clinicError } = useClinic();
  const { settings, loading: settingsLoading } = useSettings();

  // Debug: Log settings structure
  useEffect(() => {
    if (settings) {
      console.log('Settings object:', settings);
      console.log('Settings keys:', Object.keys(settings));
    }
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
    
    console.log('Holiday check:', {
      date: isoDate,
      dayOfWeek,
      weeklyHolidays,
      customHolidays,
      isWeeklyHoliday,
      isCustomHoliday
    });
    
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

  // Check for booked slots when date changes or appointments update
  useEffect(() => {
    const checkBookedSlots = async () => {
      if (!clinic?.id) return;
      
      setIsLoadingSlots(true);
      try {
        const appointmentDate = format(date, 'yyyy-MM-dd');
        const existingAppointments = await appointmentsApi.getByDate(clinic.id, appointmentDate);
        
        // Get booked time slots (exclude cancelled appointments)
        const booked = existingAppointments
          .filter(apt => apt.status !== 'Cancelled')
          .map(apt => apt.time);
        
        setBookedSlots(booked);
      } catch (error) {
        console.error('Error checking booked slots:', error);
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    checkBookedSlots();

    // Note: Real-time subscription will be implemented later
    // For now, slots will refresh when date changes or page reloads
  }, [date, clinic?.id]);

  // Phone number validation function
  const validatePhone = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
      return true;
    }
    
    // Check if it's a valid Indian mobile number with country code (12 digits starting with 91)
    if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]\d{9}$/.test(cleaned)) {
      return true;
    }
    
    return false;
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone input change with validation
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    if (!value.trim()) {
      setPhoneError('');
      return;
    }
    
    if (!validatePhone(value)) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g., 9876543210)');
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

  const currentSettings = getDaySettings(date);

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
    
    const [startH, startM] = daySettings.startTime.split(':').map(Number);
    const [endH, endM] = daySettings.endTime.split(':').map(Number);
    const [breakStartH, breakStartM] = daySettings.breakStart.split(':').map(Number);
    const [breakEndH, breakEndM] = daySettings.breakEnd.split(':').map(Number);

    const start = new Date(dateForSlots);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(dateForSlots);
    end.setHours(endH, endM, 0, 0);
    const breakStart = new Date(dateForSlots);
    breakStart.setHours(breakStartH, breakStartM, 0, 0);
    const breakEnd = new Date(dateForSlots);
    breakEnd.setHours(breakEndH, breakEndM, 0, 0);

    const intervalMs = daySettings.slotIntervalMinutes * 60 * 1000;
    const slots: { label: string; value: string; disabled: boolean; booked: boolean }[] = [];

    for (let t = start.getTime(); t < end.getTime(); t += intervalMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + intervalMs);

      // Exclude slots overlapping the break window
      const overlapsBreak = slotStart < breakEnd && slotEnd > breakStart;

      // Disable past times and times within 1 hour if the selected date is today
      const now = new Date();
      const isToday = dateForSlots.toDateString() === now.toDateString();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const isPast = isToday && slotStart.getTime() <= oneHourFromNow.getTime();

      if (!overlapsBreak && slotEnd <= end) {
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
    
    setIsSubmitting(true);
    
    try {
      // Format phone number for storage (remove all non-digits)
      const formattedPhone = phone.replace(/\D/g, '');
      const appointmentDate = format(date, 'yyyy-MM-dd');
      
      // Check for duplicate booking first
      if (clinic?.id) {
        console.log('Checking for duplicate booking...');
        
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
        
        console.log('No duplicate found, proceeding with booking...');
        
        const newAppointment = await appointmentsApi.create({
          clinic_id: clinic.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          date: appointmentDate,
          time: selectedTime,
          status: 'Confirmed'
        });
        
        // Send confirmation email
        const emailSent = await sendAppointmentConfirmation({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          date: appointmentDate,
          time: selectedTime,
          status: 'Confirmed',
          clinicName: clinic.name || 'Jeshna Dental Clinic',
          clinicPhone: clinic.contact_phone || '6363116263',
          clinicEmail: clinic.contact_email || 'poorn8105@gmail.com'
        });
        
        // Show local notification
        await showAppointmentNotification(newAppointment);
        
        // Send push notification to all subscribers
        await sendPushNotification({
          title: 'New Appointment Booked! 🦷',
          body: `${newAppointment.name} - ${newAppointment.date} at ${newAppointment.time}`,
          icon: '/logo.png',
          data: {
            url: '/admin',
            appointment: newAppointment
          }
        });

        if (emailSent) {
          toast.success('Appointment booked successfully! Check your email for confirmation details.');
        } else {
          toast.success('Appointment booked successfully! We will contact you shortly.');
        }
        
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setSelectedTime('');
        setDate(new Date());
        
      } else {
        // Fallback to WhatsApp if no clinic ID
        console.log('No clinic ID, falling back to WhatsApp');
        const formattedDate = format(date, 'MMM dd, yyyy');
        const message = `Hi, I'm ${name} (${email}, ${formattedPhone}) and I want an appointment on ${formattedDate}. Preferred time: ${selectedTime}.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/6363116263?text=${encodedMessage}`, '_blank');
        
        toast.success('Appointment request sent via WhatsApp! You will receive a confirmation email or we will call you shortly.');
        
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setSelectedTime('');
        setDate(new Date());
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      
      // Check if it's a duplicate booking error
      if (error instanceof Error && error.message.includes('duplicate')) {
        toast.error(`This time slot (${selectedTime}) is already booked. Please select a different time.`);
      } else {
        // Fallback to WhatsApp if database fails
        const formattedDate = format(date, 'MMM dd, yyyy');
        const message = `Hi, I'm ${name} (${email}, ${phone}) and I want an appointment on ${formattedDate}. Preferred time: ${selectedTime}.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/6363116263?text=${encodedMessage}`, '_blank');
        
        toast.success('Database unavailable. Appointment request sent via WhatsApp! You will receive a confirmation email or we will call you shortly.');
        
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setSelectedTime('');
        setDate(new Date());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while clinic context is loading
  if (clinicLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
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
        <Navigation />
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
  if (clinicError) {
    return (
      <div className="min-h-screen">
        <Navigation />
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
      <Navigation />

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
                      placeholder="Enter your 10-digit mobile number"
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
                                ts.booked ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed' : ''
                              )}
                              disabled={ts.disabled}
                              onClick={() => !ts.booked && setSelectedTime(ts.value)}
                            >
                              {ts.label}
                              {ts.booked && (
                                <span className="ml-1 text-xs">(Booked)</span>
                              )}
                            </Button>
                          ))}
                        </div>
                        {bookedSlots.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Red slots are already booked. Please select an available time.
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

      <Footer />
    </div>
  );
};

export default Appointment;
