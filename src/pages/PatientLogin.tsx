/**
 * Patient Login Page
 * 
 * This page allows patients to access their portal using phone number and OTP.
 * Features:
 * - Phone number input with validation
 * - OTP generation and verification
 * - Patient authentication
 * - Redirect to patient dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useClinic } from '@/contexts/ClinicContext';
import { patientAuthApi, patientUtils } from '@/lib/patient-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Phone, Lock, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PatientLogin = () => {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle phone number input
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  // Generate OTP
  const handleGenerateOTP = async () => {
    if (!clinic?.id) {
      toast.error('Clinic information not available');
      return;
    }

    if (!patientUtils.validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const generatedOTP = await patientAuthApi.generateOTP(phone, clinic.id);
      
      // In production, this would be sent via SMS
      // For development, we'll show it in a toast
      toast.success(`OTP sent to ${phone}. OTP: ${generatedOTP}`);
      
      setOtpSent(true);
      setCountdown(60);
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOTP = async () => {
    if (!clinic?.id) {
      toast.error('Clinic information not available');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const patient = await patientAuthApi.verifyOTP(phone, otp, clinic.id);
      
      // Store patient info in session storage
      sessionStorage.setItem('patientData', JSON.stringify(patient));
      
      toast.success('Login successful!');
      navigate('/patient/dashboard');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = () => {
    if (countdown > 0) return;
    handleGenerateOTP();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Login Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Patient Portal</CardTitle>
              <CardDescription>
                Access your medical records and appointments
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Phone Number Input */}
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="pl-10"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      We'll send an OTP to this number
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleGenerateOTP}
                    disabled={!patientUtils.validatePhone(phone) || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </div>
              ) : (
                /* OTP Input */
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      OTP sent to {phone}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6 || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className="w-24"
                    >
                      {countdown > 0 ? `${countdown}s` : 'Resend'}
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setCountdown(0);
                    }}
                    className="w-full"
                  >
                    Change Phone Number
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-600">
                <p>Don't have an account?</p>
                <p className="mt-1">
                  Contact your clinic to register as a patient.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PatientLogin;
