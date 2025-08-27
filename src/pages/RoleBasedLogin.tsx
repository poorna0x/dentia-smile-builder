import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSmartCaptcha } from '../hooks/useSmartCaptcha';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Lock, User, Stethoscope, Users } from 'lucide-react';
import SmartCaptcha from '../components/SmartCaptcha';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const RoleBasedLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'dentist' | 'staff'>('dentist');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store the selected role in sessionStorage for access control
  const handleRoleSelect = (role: 'dentist' | 'staff') => {
    setSelectedRole(role);
    sessionStorage.setItem('userRole', role);
  };
  
  // Smart CAPTCHA integration
  const {
    isCaptchaVisible,
    failedAttempts,
    incrementFailedAttempts,
    resetFailedAttempts,
    verifyCaptcha
  } = useSmartCaptcha();

  // Get the intended destination from URL params or default to admin
  const searchParams = new URLSearchParams(location.search);
  const intendedPath = searchParams.get('redirect') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      // Save the selected role to sessionStorage
      sessionStorage.setItem('userRole', selectedRole);
      
      // Reset failed attempts on successful login
      resetFailedAttempts();
      
      // Log successful login attempt
      try {
        await supabase.rpc('log_captcha_attempt', {
          p_email: email,
          p_attempt_type: 'login_success',
          p_failed_attempts_count: failedAttempts,
          p_is_successful: true
        });
      } catch (error) {
        // Silent error handling
      }
      
      // Redirect to the intended destination
      navigate(intendedPath);
    } else {
      setError(result.error || 'Login failed');
      // Increment failed attempts for CAPTCHA tracking
      incrementFailedAttempts();
      
      // Log failed login attempt
      try {
        await supabase.rpc('log_captcha_attempt', {
          p_email: email,
          p_attempt_type: 'login_failed',
          p_failed_attempts_count: failedAttempts + 1,
          p_is_successful: false
        });
      } catch (error) {
        // Silent error handling
      }
    }
    
    setIsLoading(false);
  };

  // Handle CAPTCHA verification
  const handleCaptchaVerify = async (userAnswer: string, expectedAnswer: string): Promise<boolean> => {
    return await verifyCaptcha(userAnswer, expectedAnswer);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Show CAPTCHA if required */}
      {isCaptchaVisible ? (
        <SmartCaptcha
          onVerify={handleCaptchaVerify}
          isVisible={isCaptchaVisible}
          failedAttempts={failedAttempts}
          onReset={resetFailedAttempts}
        />
      ) : (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Dental Clinic PMS
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose your role and enter credentials
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(value) => handleRoleSelect(value as 'dentist' | 'staff')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dentist" className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Dentist
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Staff
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dentist" className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Stethoscope className="w-4 h-4" />
                    Full Access
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Complete access to all features including settings and patient management
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In as Dentist'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="staff" className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <Users className="w-4 h-4" />
                    Limited Access
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Access to appointments and basic patient information only
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-staff" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email-staff"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-staff" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password-staff"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In as Staff'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {selectedRole === 'dentist' 
                  ? 'Dentist login provides full access to all system features'
                  : 'Staff login provides limited access to appointments and basic patient information'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoleBasedLogin;
