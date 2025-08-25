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
  Globe,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { featureToggleEvents } from '@/lib/feature-toggle-events';
import DatabaseExport from '@/components/DatabaseExport';
import { getNotificationSettings } from '@/lib/whatsapp';

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
  notificationSettings: {
    whatsapp_enabled: boolean;
    whatsapp_phone_number: string;
    send_confirmation: boolean;
    send_reminders: boolean;
    send_reviews: boolean;
    reminder_hours: number;
    review_requests_enabled: boolean;
    review_message_template: string;
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
      notificationSettings: {
    whatsapp_enabled: false,
    whatsapp_phone_number: '',
    send_confirmation: true,
    send_reminders: false,
    send_reviews: false,
    reminder_hours: 24,
    review_requests_enabled: false,
    review_message_template: 'Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}',
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
      loadNotificationSettings();
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

  const loadNotificationSettings = async () => {
    try {
      const settings = await getNotificationSettings();
      if (settings) {
        setState(prev => ({
          ...prev,
          notificationSettings: settings
        }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateNotificationSetting = async (key: string, value: string | boolean) => {
    try {
      // Update local state immediately for responsive UI
      setState(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [key]: value
        }
      }));

      // Determine which setting type to update
      let settingType = '';
      let settingsUpdate = {};
      
      if (key === 'whatsapp_enabled' || key === 'whatsapp_phone_number') {
        settingType = 'whatsapp_notifications';
        // Get current settings and update the specific field
        const { data: currentSettings } = await supabase
          .from('system_settings')
          .select('settings')
          .eq('setting_type', 'whatsapp_notifications')
          .single();
        
        const currentSettingsObj = currentSettings?.settings || {};
        settingsUpdate = {
          ...currentSettingsObj,
          [key === 'whatsapp_enabled' ? 'enabled' : 'phone_number']: value
        };
      } else if (key === 'review_requests_enabled' || key === 'review_message_template') {
        settingType = 'review_requests';
        // Get current settings and update the specific field
        const { data: currentSettings } = await supabase
          .from('system_settings')
          .select('settings')
          .eq('setting_type', 'review_requests')
          .single();
        
        const currentSettingsObj = currentSettings?.settings || {};
        settingsUpdate = {
          ...currentSettingsObj,
          [key === 'review_requests_enabled' ? 'enabled' : 'message_template']: value
        };
      }

      // Save to database
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          settings: settingsUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('setting_type', settingType);

      if (error) throw error;

      toast.success(`${key.replace(/_/g, ' ')} updated successfully`);
    } catch (error) {
      // Revert on error
      setState(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [key]: !value
        }
      }));
      toast.error(`Failed to update ${key}`);
      console.error('Failed to update notification setting:', error);
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

  const testReminderSystem = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/.netlify/functions/test-reminder');
      const result = await response.json();
      
      if (result.success) {
        const status = result.status;
        toast.success('Reminder system test completed!', {
          description: `WhatsApp: ${status.whatsapp_enabled ? '✅' : '❌'}, Reminders: ${status.send_reminders ? '✅' : '❌'}, Twilio: ${status.twilio_configured ? '✅' : '❌'}`
        });
        console.log('📊 Test Results:', result);
      } else {
        toast.error('Reminder test failed', {
          description: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      toast.error('Failed to test reminder system', {
        description: 'Check console for details'
      });
      console.error('Reminder test error:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const checkReminderStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // For now, just check if the reminder system is configured
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('setting_type', 'whatsapp_notifications')
        .single();

      if (error) throw error;

      const whatsappSettings = settings?.settings || {};
      
      toast.success('Reminder system status checked!', {
        description: `WhatsApp: ${whatsappSettings.enabled ? 'Enabled' : 'Disabled'}, Reminders: ${whatsappSettings.send_reminders ? 'Enabled' : 'Disabled'}`
      });

      console.log('📊 Reminder System Status:', whatsappSettings);
      
    } catch (error) {
      toast.error('Failed to check reminder status', {
        description: 'Check console for details'
      });
      console.error('Status check error:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
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

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure WhatsApp and review notification settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* WhatsApp Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">WhatsApp Notifications</h3>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      WhatsApp Enabled
                    </h4>
                    <p className="text-sm text-gray-600">
                      {state.notificationSettings.whatsapp_enabled ? 
                        'WhatsApp appointment confirmations are active' : 
                        'WhatsApp notifications are disabled'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={state.notificationSettings.whatsapp_enabled}
                    onCheckedChange={(enabled) => updateNotificationSetting('whatsapp_enabled', enabled)}
                  />
                </div>

                {state.notificationSettings.whatsapp_enabled && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_phone_number">WhatsApp Phone Number</Label>
                      <Input
                        id="whatsapp_phone_number"
                        placeholder="+1234567890"
                        value={state.notificationSettings.whatsapp_phone_number}
                        onChange={(e) => updateNotificationSetting('whatsapp_phone_number', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        API credentials are configured in environment variables
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Message Types</h4>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium">Appointment Confirmations</h5>
                          <p className="text-sm text-gray-600">
                            Send confirmation when appointments are booked
                          </p>
                        </div>
                        <Switch
                          checked={state.notificationSettings.send_confirmation}
                          onCheckedChange={(enabled) => updateNotificationSetting('send_confirmation', enabled)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium">Appointment Reminders</h5>
                          <p className="text-sm text-gray-600">
                            Send reminders before appointments
                          </p>
                        </div>
                        <Switch
                          checked={state.notificationSettings.send_reminders}
                          onCheckedChange={(enabled) => updateNotificationSetting('send_reminders', enabled)}
                        />
                      </div>

                      {state.notificationSettings.send_reminders && (
                        <div className="space-y-2">
                          <Label htmlFor="reminder_hours">Reminder Hours Before Appointment</Label>
                          <Input
                            id="reminder_hours"
                            type="number"
                            min="1"
                            max="72"
                            placeholder="24"
                            value={state.notificationSettings.reminder_hours}
                            onChange={(e) => updateNotificationSetting('reminder_hours', (parseInt(e.target.value) || 24).toString())}
                          />
                          <p className="text-xs text-gray-500">
                            How many hours before the appointment to send the reminder
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium">Review Requests</h5>
                          <p className="text-sm text-gray-600">
                            Send review requests when appointments are completed
                          </p>
                        </div>
                        <Switch
                          checked={state.notificationSettings.send_reviews}
                          onCheckedChange={(enabled) => updateNotificationSetting('send_reviews', enabled)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Testing & Monitoring</h4>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <h5 className="font-medium text-blue-900">Test Reminder System</h5>
                        <p className="text-sm text-blue-700 mb-3">
                          Manually trigger reminders for testing
                        </p>
                        <Button 
                          onClick={testReminderSystem}
                          disabled={state.isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {state.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            'Test Reminder System'
                          )}
                        </Button>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border">
                        <h5 className="font-medium text-green-900">Check Reminder Status</h5>
                        <p className="text-sm text-green-700 mb-3">
                          View upcoming appointments and reminder status
                        </p>
                        <Button 
                          onClick={checkReminderStatus}
                          disabled={state.isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Check Status
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Review Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Review Requests</h3>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Review Requests Enabled
                    </h4>
                    <p className="text-sm text-gray-600">
                      {state.notificationSettings.review_requests_enabled ? 
                        'Review requests will be sent after appointment completion' : 
                        'Review requests are disabled'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={state.notificationSettings.review_requests_enabled}
                    onCheckedChange={(enabled) => updateNotificationSetting('review_requests_enabled', enabled)}
                  />
                </div>

                {state.notificationSettings.review_requests_enabled && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="review_template">Review Message Template</Label>
                      <textarea
                        id="review_template"
                        className="w-full p-3 border rounded-md resize-none"
                        rows={3}
                        placeholder="Enter your review request message template"
                        value={state.notificationSettings.review_message_template}
                        onChange={(e) => updateNotificationSetting('review_message_template', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Use {'{review_link}'} for the review link and {'{patient_name}'} for patient name
                      </p>
                    </div>
                  </div>
                )}
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
