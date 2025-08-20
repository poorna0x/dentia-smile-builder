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
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold text-gray-900">{name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleCall}
                  className="h-16 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-0"
                >
                  <Phone className="w-6 h-6" />
                  <span className="font-semibold">Call Clinic</span>
                </Button>
                
                <Button 
                  onClick={handleWhatsApp}
                  className="h-16 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-0"
                >
                  <WhatsAppIcon className="w-6 h-6" />
                  <span className="font-semibold">WhatsApp</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleDirections}
                  variant="outline"
                  className="h-16 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-blue-400"
                >
                  <MapPin className="w-6 h-6" />
                  <span className="font-semibold">Get Directions</span>
                </Button>
                
                <Button 
                  onClick={handleEmail}
                  variant="outline"
                  className="h-16 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-gray-400"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                    @
                  </div>
                  <span className="font-semibold">Send Email</span>
                </Button>
              </div>
            </CardContent>
          </Card>

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
