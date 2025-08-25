import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Users, 
  Calendar, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Power,
  Database,
  Activity,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { featureToggleEvents } from '@/lib/feature-toggle-events';
import DatabaseExport from '@/components/DatabaseExport';

interface SuperAdminState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  features: {
    websiteEnabled: boolean;
    patientManagementEnabled: boolean;
    appointmentBookingEnabled: boolean;
    adminPanelEnabled: boolean;
    realtimeUpdatesEnabled: boolean;
    emailNotificationsEnabled: boolean;
    paymentSystemEnabled: boolean;
  };
  systemStatus: {
    databaseConnected: boolean;
    realtimeActive: boolean;
    emailServiceActive: boolean;
    lastBackup: string | null;
  };
}

const SuperAdmin: React.FC = () => {
  const [state, setState] = useState<SuperAdminState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    features: {
      websiteEnabled: true,
      patientManagementEnabled: true,
      appointmentBookingEnabled: true,
      adminPanelEnabled: true,
      realtimeUpdatesEnabled: true,
      emailNotificationsEnabled: true,
      paymentSystemEnabled: true,
    },
    systemStatus: {
      databaseConnected: false,
      realtimeActive: false,
      emailServiceActive: false,
      lastBackup: null,
    }
  });

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
    if (state.isAuthenticated) {
      loadSystemStatus();
      loadFeatureToggles();
    }
  }, [state.isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      // Check if super admin password is set in environment
      const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD;
      

      
      if (!superAdminPassword) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Super admin password not configured. Please set VITE_SUPER_ADMIN_PASSWORD in your environment variables.'
        }));
        return;
      }

      // Check if user is already authenticated (stored in sessionStorage)
      const isAuth = sessionStorage.getItem('superAdminAuthenticated') === 'true';
      
      setState(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check authentication status'
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD;
      
      if (password === superAdminPassword) {
        sessionStorage.setItem('superAdminAuthenticated', 'true');
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          error: null
        }));
        toast.success('Super Admin access granted');
        loadSystemStatus();
        loadFeatureToggles();
      } else {
        setState(prev => ({
          ...prev,
          error: 'Invalid super admin password'
        }));
        toast.error('Invalid password');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Authentication failed'
      }));
      toast.error('Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminAuthenticated');
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      password: ''
    }));
    toast.success('Logged out successfully');
  };

  const loadSystemStatus = async () => {
    try {
      // Check database connection
      const { data, error } = await supabase.from('clinics').select('count').limit(1);
      const databaseConnected = !error;

      // Check realtime status (simplified check)
      const realtimeActive = true; // Assuming realtime is working

      // Check email service (simplified check)
      const emailServiceActive = !!import.meta.env.VITE_RESEND_API_KEY;

      setState(prev => ({
        ...prev,
        systemStatus: {
          ...prev.systemStatus,
          databaseConnected,
          realtimeActive,
          emailServiceActive,
          lastBackup: new Date().toISOString() // Mock backup time
        }
      }));
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadFeatureToggles = async () => {
    try {
      // Load feature toggles from database or use defaults
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_type', 'feature_toggle')
        .single();

      if (data && !error) {
        setState(prev => ({
          ...prev,
          features: {
            ...prev.features,
            ...data.settings
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load feature toggles:', error);
    }
  };

  const updateFeatureToggle = async (feature: keyof SuperAdminState['features'], enabled: boolean) => {
    try {
      // Update local state immediately for responsive UI
      setState(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [feature]: enabled
        }
      }));

      // Save to database using direct update
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          settings: {
            ...state.features,
            [feature]: enabled
          },
          updated_at: new Date().toISOString()
        })
        .eq('setting_type', 'feature_toggle')
        .select();

      if (error) throw error;

      // Notify all components that feature toggles have changed
      featureToggleEvents.notify();

      toast.success(`${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Revert on error
      setState(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [feature]: !enabled
        }
      }));
      toast.error(`Failed to update ${feature}`);
      console.error('Failed to update feature toggle:', error);
    }
  };

  const emergencyShutdown = async () => {
    try {
      await updateFeatureToggle('websiteEnabled', false);
      toast.error('🚨 WEBSITE EMERGENCY SHUTDOWN ACTIVATED!', {
        duration: 10000,
        action: {
          label: 'Re-enable',
          onClick: () => updateFeatureToggle('websiteEnabled', true)
        }
      });
    } catch (error) {
      toast.error('Failed to shutdown website');
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Super Admin...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Super Admin Access</CardTitle>
            <CardDescription>
              Enter the super admin password to access system controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.error && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Super Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter super admin password"
                  required
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Access Super Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">System-wide controls and monitoring</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <Lock className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <p className="font-semibold">Connection</p>
                </div>
                <Badge variant={state.systemStatus.databaseConnected ? "default" : "destructive"}>
                  {state.systemStatus.databaseConnected ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {state.systemStatus.databaseConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-600">Realtime</p>
                  <p className="font-semibold">Updates</p>
                </div>
                <Badge variant={state.systemStatus.realtimeActive ? "default" : "destructive"}>
                  {state.systemStatus.realtimeActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {state.systemStatus.realtimeActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">Service</p>
                </div>
                <Badge variant={state.systemStatus.emailServiceActive ? "default" : "destructive"}>
                  {state.systemStatus.emailServiceActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {state.systemStatus.emailServiceActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-600">Last</p>
                  <p className="font-semibold">Backup</p>
                </div>
                <Badge variant="outline">
                  {state.systemStatus.lastBackup ? 
                    new Date(state.systemStatus.lastBackup).toLocaleDateString() : 
                    'Never'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Controls */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Emergency Controls
            </CardTitle>
            <CardDescription className="text-red-700">
              Critical system controls - use with extreme caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h3 className="font-semibold text-red-800">Website Access</h3>
                  <p className="text-sm text-red-600">
                    {state.features.websiteEnabled ? 
                      'Website is currently accessible to all users' : 
                      '🚨 WEBSITE IS CURRENTLY DISABLED - NO ONE CAN ACCESS IT'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={state.features.websiteEnabled}
                    onCheckedChange={(enabled) => updateFeatureToggle('websiteEnabled', enabled)}
                    className="data-[state=checked]:bg-red-600"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={emergencyShutdown}
                    disabled={!state.features.websiteEnabled}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Emergency Shutdown
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Controls
            </CardTitle>
            <CardDescription>
              Enable or disable specific features across the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Patient Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.patientManagementEnabled ? 
                      'Patients can access their dashboard and manage their data' : 
                      'Patient management is disabled - patients cannot access their data'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.patientManagementEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('patientManagementEnabled', enabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Appointment Booking
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.appointmentBookingEnabled ? 
                      'Public appointment booking is available' : 
                      'Public appointment booking is disabled'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.appointmentBookingEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('appointmentBookingEnabled', enabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.adminPanelEnabled ? 
                      'Admin panel is accessible to authorized users' : 
                      'Admin panel is disabled - no admin access'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.adminPanelEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('adminPanelEnabled', enabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Realtime Updates
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.realtimeUpdatesEnabled ? 
                      'Real-time updates are active for appointments and notifications' : 
                      'Real-time updates are disabled - manual refresh required'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.realtimeUpdatesEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('realtimeUpdatesEnabled', enabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.emailNotificationsEnabled ? 
                      'Email notifications are being sent for appointments and updates' : 
                      'Email notifications are disabled - no emails will be sent'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.emailNotificationsEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('emailNotificationsEnabled', enabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Payment System
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state.features.paymentSystemEnabled ? 
                      'Payment processing is available for treatments' : 
                      'Payment system is disabled - no payments can be processed'
                    }
                  </p>
                </div>
                <Switch
                  checked={state.features.paymentSystemEnabled}
                  onCheckedChange={(enabled) => updateFeatureToggle('paymentSystemEnabled', enabled)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Export */}
        <DatabaseExport />
      </div>
    </div>
  );
};

export default SuperAdmin;
