import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, Mail, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentsApi } from '@/lib/supabase';
import { useClinic } from '@/contexts/ClinicContext';
import { format } from 'date-fns';

const CheckAppointmentStatus = () => {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Phone number formatting function (same as booking form)
  const formatPhoneNumber = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  };

  // Phone number validation function (same as booking form)
  const validatePhone = (phoneNumber: string): boolean => {
    const formatted = formatPhoneNumber(phoneNumber);
    return formatted.length === 10 && /^[6-9]\d{9}$/.test(formatted);
  };

  // Name formatting function (same as booking form)
  const formatName = (name: string): string => {
    let formatted = name.trim().replace(/\s+/g, ' ');
    formatted = formatted.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    return formatted;
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone input change
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    if (!value.trim()) {
      setPhoneError('');
      return;
    }
    
    if (!validatePhone(value)) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g., 9876543210, +91 9876543210, 09876543210)');
    } else {
      setPhoneError('');
    }
  };

  // Handle name input change
  const handleNameChange = (value: string) => {
    setName(value);
    
    if (!value.trim()) {
      setNameError('');
      return;
    }
    
    if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters long');
    } else {
      setNameError('');
    }
  };

  // Handle email input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    if (!value.trim()) {
      setEmailError('');
      return;
    }
    
    if (!validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Check appointment status
  const handleCheckStatus = async () => {
    // Validate inputs
    if (!validatePhone(phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Show verification dialog
    setShowVerificationDialog(true);
  };

  // Verify and find appointment
  const handleVerifyAndFind = async () => {
    setIsChecking(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const formattedName = formatName(name);
      const formattedEmail = email.trim().toLowerCase();

      if (!clinic?.id) {
        toast.error('Clinic information not available');
        return;
      }

      // Get all appointments for this phone number
      const allAppointments = await appointmentsApi.getAll(clinic.id);
      
      // Filter for upcoming appointments matching phone, name, and email
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        
        return appointmentDate >= today && 
               appointment.phone === formattedPhone &&
               appointment.name.toLowerCase() === formattedName.toLowerCase() &&
               appointment.email === formattedEmail;
      });

      if (upcomingAppointments.length === 0) {
        toast.error('No upcoming appointments found for the provided details');
        setShowVerificationDialog(false);
        return;
      }

      // Get the next upcoming appointment
      const nextAppointment = upcomingAppointments.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];

      // Navigate to booking completion page with appointment details
      const params = new URLSearchParams({
        name: nextAppointment.name,
        date: format(new Date(nextAppointment.date), 'MMMM dd, yyyy'),
        time: nextAppointment.time,
        email: nextAppointment.email,
        phone: nextAppointment.phone
      });
      
      navigate(`/booking-complete?${params.toString()}`);
      
    } catch (error) {
      console.error('Error checking appointment status:', error);
      toast.error('Error checking appointment status. Please try again.');
    } finally {
      setIsChecking(false);
      setShowVerificationDialog(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg border-2 border-blue-200 max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Check Appointment Status</CardTitle>
          <p className="text-gray-600 text-sm">
            Enter your details to view your upcoming appointment
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="check-phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="check-phone"
              type="tel"
              placeholder="9876543210, +91 9876543210, or 09876543210"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full p-3 border-2 rounded-lg focus:border-blue-500 transition-colors"
            />
            {phoneError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {phoneError}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="check-name" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="check-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full p-3 border-2 rounded-lg focus:border-blue-500 transition-colors"
            />
            {nameError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {nameError}
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="check-email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="check-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full p-3 border-2 rounded-lg focus:border-blue-500 transition-colors"
            />
            {emailError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {emailError}
              </div>
            )}
          </div>

          {/* Check Status Button */}
          <Button
            onClick={handleCheckStatus}
            disabled={!phone.trim() || !name.trim() || !email.trim() || phoneError || nameError || emailError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
          >
            <Search className="w-5 h-5 mr-2" />
            Check Appointment Status
          </Button>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isChecking ? 'Verifying Details...' : 'Verify Your Details'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Please confirm your details before we check your appointment status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2 relative">
            {/* Loading Overlay */}
            {isChecking && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                  <p className="text-base font-medium text-gray-700">Checking your appointment...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait...</p>
                </div>
              </div>
            )}
            
            {/* Verification Details */}
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
          </div>
          
          <DialogFooter className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowVerificationDialog(false)}
              disabled={isChecking}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyAndFind}
              disabled={isChecking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isChecking ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="font-medium">Checking...</span>
                </div>
              ) : (
                'Verify & Find'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckAppointmentStatus;
