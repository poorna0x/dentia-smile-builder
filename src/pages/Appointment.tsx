import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dentistChildImage from '@/assets/dentist-patient.jpg';
// Frontend-only: send to WhatsApp

const Appointment = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  type SchedulingSettings = {
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
    breakStart: string; // "HH:MM"
    breakEnd: string;   // "HH:MM"
    slotIntervalMinutes: number;
    weeklyHolidays: number[]; // 0-6 (Sun-Sat)
    customHolidays: string[]; // ISO yyyy-MM-dd
    disabledAppointments?: boolean;
  };

  const defaultSettings: SchedulingSettings = {
    startTime: '09:00',
    endTime: '20:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotIntervalMinutes: 30,
    weeklyHolidays: [],
    customHolidays: [],
  };

  const settings: SchedulingSettings = useMemo(() => {
    try {
      const raw = localStorage.getItem('clinicSchedulingSettings');
      if (!raw) return defaultSettings;
      const parsed = JSON.parse(raw);
      return {
        ...defaultSettings,
        ...parsed,
        slotIntervalMinutes: Number(parsed.slotIntervalMinutes) || defaultSettings.slotIntervalMinutes,
        weeklyHolidays: Array.isArray(parsed.weeklyHolidays) ? parsed.weeklyHolidays : defaultSettings.weeklyHolidays,
        customHolidays: Array.isArray(parsed.customHolidays) ? parsed.customHolidays : defaultSettings.customHolidays,
      } as SchedulingSettings;
    } catch {
      return defaultSettings;
    }
  }, []);

  const isHoliday = (d: Date) => {
    const iso = format(d, 'yyyy-MM-dd');
    const isWeeklyHoliday = settings.weeklyHolidays.includes(d.getDay());
    const isCustomHoliday = settings.customHolidays.includes(iso);
    return isWeeklyHoliday || isCustomHoliday;
  };

  const generateTimeSlots = (dateForSlots: Date) => {
    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);
    const [breakStartH, breakStartM] = settings.breakStart.split(':').map(Number);
    const [breakEndH, breakEndM] = settings.breakEnd.split(':').map(Number);

    const start = new Date(dateForSlots);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(dateForSlots);
    end.setHours(endH, endM, 0, 0);
    const breakStart = new Date(dateForSlots);
    breakStart.setHours(breakStartH, breakStartM, 0, 0);
    const breakEnd = new Date(dateForSlots);
    breakEnd.setHours(breakEndH, breakEndM, 0, 0);

    const intervalMs = settings.slotIntervalMinutes * 60 * 1000;
    const slots: { label: string; value: string; disabled: boolean }[] = [];

    if (isHoliday(dateForSlots)) {
      return slots;
    }

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
        slots.push({ label, value: label, disabled: isPast });
      }
    }

    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(date), [date, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.disabledAppointments) return;
    const formattedDate = format(date, 'MMM dd, yyyy');
    const message = `Hi, I'm ${name} (${email}, ${phone}) and I want an appointment on ${formattedDate}. Preferred time: ${selectedTime}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/6363116263?text=${encodedMessage}`, '_blank');
  };

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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full p-4 text-base border-2 border-border rounded-xl focus:border-accent transition-colors"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium text-primary">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full p-4 text-base border-2 border-border rounded-xl focus:border-accent transition-colors"
                    />
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
                          // Disable past dates + Sundays
                          disabled={(day) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return day < today || day.getDay() === 0;
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
                    {settings.disabledAppointments ? (
                      <div className="text-sm text-destructive">
                        Appointments are temporarily disabled.
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-sm text-destructive">
                        Holiday: Appointments are not available on the selected date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {timeSlots.map((ts) => (
                          <Button
                            key={ts.value}
                            type="button"
                            variant={selectedTime === ts.value ? 'default' : 'outline'}
                            className={cn('justify-center', selectedTime === ts.value ? 'btn-appointment' : '')}
                            disabled={ts.disabled}
                            onClick={() => setSelectedTime(ts.value)}
                          >
                            {ts.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="btn-appointment w-full text-lg py-4"
                    disabled={settings.disabledAppointments || !name.trim() || !email.trim() || !phone.trim() || !selectedTime}
                  >
                    Send Appointment Request
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
