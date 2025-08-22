import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar,
  ArrowLeft,
  Home,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useScrollToTop } from '@/hooks/useScrollToTop';

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

const BookingComplete: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Ensure page starts at top
  useScrollToTop();
  
  // Get appointment details from URL params
  const name = searchParams.get('name') || 'Patient';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const email = searchParams.get('email') || '';

  // TODO: Replace with actual clinic data from database
  // Comment: Update these values with your actual clinic information
  const clinicInfo = {
    name: 'Jeshna Dental Clinic', // TODO: Replace with actual clinic name
    phone: '+91 6363116263', // TODO: Replace with actual clinic phone
    whatsapp: '+91 6363116263', // TODO: Replace with actual WhatsApp number
    address: '123 Dental Street, Bangalore, Karnataka 560001', // TODO: Replace with actual address
    email: 'poorn8105@gmail.com', // TODO: Replace with actual clinic email
    workingHours: 'Mon-Sat: 9:00 AM - 6:00 PM', // TODO: Replace with actual working hours
  };

  const handleCall = () => {
    window.open(`tel:${clinicInfo.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = `Hi, I have an appointment scheduled for ${date} at ${time}. My name is ${name}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${clinicInfo.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleWhatsAppReschedule = () => {
    const message = `Hi, I need to reschedule my appointment for ${date} at ${time}. My name is ${name}. Can you please help me find an alternative time?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${clinicInfo.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleWhatsAppQuery = () => {
    const message = `Hi, I have a question about my appointment scheduled for ${date} at ${time}. My name is ${name}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${clinicInfo.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleDirections = () => {
    // TODO: Replace with actual clinic coordinates
    const address = encodeURIComponent(clinicInfo.address);
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Appointment Query - ${name}`);
    const body = encodeURIComponent(`Hi,\n\nI have an appointment scheduled for ${date} at ${time}.\nMy name is ${name}.\nMy email is ${email}.\n\nPlease let me know if there are any changes.\n\nThank you!`);
    window.open(`mailto:${clinicInfo.email}?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation />
      
      <main className="py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Appointment Confirmed! 🦷
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your appointment has been successfully booked. We've sent a confirmation email to {email}.
            </p>
          </div>

          {/* WhatsApp Actions Banner */}
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl shadow-sm">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <WhatsAppIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800 text-lg">Need to reschedule or have questions?</h3>
              <p className="text-green-700 text-sm">WhatsApp us for quick responses to your queries</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleWhatsAppReschedule}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-0"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span className="font-semibold">Reschedule Appointment</span>
              </Button>
              <Button 
                onClick={handleWhatsAppQuery}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-0"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span className="font-semibold">Ask Questions</span>
              </Button>
            </div>
          </div>

          {/* Appointment Details Card */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold text-gray-900">{time}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient Name</p>
                    <p className="font-semibold text-gray-900">{name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold text-gray-900">{searchParams.get('phone') || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8 shadow-xl border-0 bg-gradient-to-br from-blue-50 to-white rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">
                Need to reschedule or have questions?
              </CardTitle>
              <p className="text-gray-600 text-center mt-2">
                Contact us through any of these methods:
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-8">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <Button 
                  onClick={handleCall}
                  className="h-20 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center space-x-4 transition-all duration-300 transform hover:scale-102 hover:shadow-xl border-0 rounded-xl px-6"
                >
                  <div className="p-2 bg-white/20 rounded-full">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Call Clinic</div>
                    <div className="text-sm opacity-90">Direct phone call</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={handleWhatsAppReschedule}
                  className="h-20 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white flex items-center justify-center space-x-4 transition-all duration-300 transform hover:scale-102 hover:shadow-xl border-0 rounded-xl px-6"
                >
                  <div className="p-2 bg-white/20 rounded-full">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Reschedule via WhatsApp</div>
                    <div className="text-sm opacity-90">Change appointment time</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={handleWhatsAppQuery}
                  className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center space-x-4 transition-all duration-300 transform hover:scale-102 hover:shadow-xl border-0 rounded-xl px-6"
                >
                  <div className="p-2 bg-white/20 rounded-full">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">WhatsApp Query</div>
                    <div className="text-sm opacity-90">Ask questions</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={handleDirections}
                  variant="outline"
                  className="h-20 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400 flex items-center justify-center space-x-4 transition-all duration-300 transform hover:scale-102 hover:shadow-xl rounded-xl px-6 bg-white"
                >
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Get Directions</div>
                    <div className="text-sm opacity-90">Find our location</div>
                  </div>
                </Button>
              </div>
              
              {/* Phone Number Display */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Or call us directly:</p>
                  <p className="text-2xl font-bold text-gray-900">6363116263</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Find Appointment Info Again */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 text-lg mb-2">
                  Need to check your appointment again?
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  You can find your appointment details anytime by visiting our homepage and using the "Check Appointment Status" section at the bottom of the page. Just enter your phone number, name, and email to view your upcoming appointments.
                </p>
                <Button 
                  onClick={() => navigate('/?scroll=check-status')}
                  variant="outline"
                  className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400 transition-all duration-300"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Go to Check Appointment Status
                </Button>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{clinicInfo.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{clinicInfo.address}</p>
                  <p className="text-gray-600 text-sm">{clinicInfo.workingHours}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {clinicInfo.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {clinicInfo.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Back to Home</span>
            </Button>
          </div>

          {/* Important Notes */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3">Important Notes:</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• Please arrive 10 minutes before your scheduled appointment time</li>
              <li>• Bring any previous dental records or X-rays if available</li>
              <li>• If you need to reschedule, please call us at least 24 hours in advance</li>
              <li>• For emergencies, call us immediately at {clinicInfo.phone}</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingComplete;
