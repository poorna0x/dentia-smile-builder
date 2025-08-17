import { useState } from 'react';
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
import dentistChildImage from '@/assets/dentist-child.jpg';

const Appointment = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the message for WhatsApp
    const formattedDate = format(date, 'MMM dd, yyyy');
    const message = `hi I am ${name} and ${formattedDate}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Redirect to WhatsApp
    window.open(`https://wa.me/636163124?text=${encodedMessage}`, '_blank');
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button 
                    type="submit" 
                    className="btn-dental w-full text-lg py-4"
                    disabled={!name.trim()}
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
                      <p className="text-muted-foreground text-sm">Mon to Sat 08:00 - 20:00</p>
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