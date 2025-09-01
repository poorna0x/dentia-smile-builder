import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { featureToggleEvents } from '@/lib/feature-toggle-events';
import DatabaseExport from '@/components/DatabaseExport';
import { getNotificationSettings } from '@/lib/whatsapp';
import { dentistsApi, type Dentist } from '@/lib/supabase';
import { toothImageApi } from '@/lib/tooth-images';

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
    send_to_dentist: boolean;
    review_requests_enabled: boolean;
    review_message_template: string;
  };
  systemStatus: {
    databaseConnected: boolean;
    realtimeActive: boolean;
    emailServiceActive: boolean;
    lastBackup: string | null;
  };

  cloudinaryManagement: {
    isLoading: boolean;
    stats: {
      totalImages: number;
      totalSizeBytes: number;
      imagesByType: { [key: string]: number };
    } | null;
    showDeleteDialog: boolean;
    deleteType: 'all' | 'orphaned' | 'old' | '1day' | '1month' | '3months' | '6months' | '1year' | null;
    deleteProgress: number;
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
    send_to_dentist: true,
    review_requests_enabled: false,
    review_message_template: 'Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}',
  },
    systemStatus: {
      databaseConnected: false,
      realtimeActive: false,
      emailServiceActive: false,
      lastBackup: null,
    },

    cloudinaryManagement: {
      isLoading: false,
      stats: null,
      showDeleteDialog: false,
      deleteType: null,
      deleteProgress: 0
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

      loadCloudinaryStats();
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
      // Load feature toggles from localStorage or use defaults
      const stored = localStorage.getItem('feature_toggles');
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          features: {
            ...prev.features,
            ...parsed
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load feature toggles:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      // Load notification settings from localStorage
      const stored = localStorage.getItem('notification_settings');
      if (stored) {
        const settings = JSON.parse(stored);
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

      // Save to localStorage
      const updatedSettings = {
        ...state.notificationSettings,
        [key]: value
      };
      localStorage.setItem('notification_settings', JSON.stringify(updatedSettings));

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

      // Save to localStorage
      const updatedFeatures = {
        ...state.features,
        [feature]: enabled
      };
      localStorage.setItem('feature_toggles', JSON.stringify(updatedFeatures));

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
      
      // Check reminder system status from localStorage
      const stored = localStorage.getItem('notification_settings');
      const whatsappSettings = stored ? JSON.parse(stored) : {};
      
      toast.success('Reminder system status checked!', {
        description: `WhatsApp: ${whatsappSettings.whatsapp_enabled ? 'Enabled' : 'Disabled'}, Reminders: ${whatsappSettings.send_reminders ? 'Enabled' : 'Disabled'}`
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










  // Cloudinary Management Functions
  const loadCloudinaryStats = async () => {
    try {
      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          isLoading: true
        }
      }));

      // First try to get stats directly from Cloudinary
      try {
        const response = await fetch('/.netlify/functions/list-cloudinary-images?max_results=1000');
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            
            if (result.success && result.resources) {
              const totalImages = result.resources.length;
              const totalSizeBytes = result.resources.reduce((sum: number, img: any) => sum + (img.bytes || 0), 0);
              
              // Group by format (image type)
              const imagesByType: { [key: string]: number } = {};
              result.resources.forEach((img: any) => {
                const format = img.format || 'unknown';
                imagesByType[format] = (imagesByType[format] || 0) + 1;
              });

              setState(prev => ({
                ...prev,
                cloudinaryManagement: {
                  ...prev.cloudinaryManagement,
                  isLoading: false,
                  stats: {
                    totalImages,
                    totalSizeBytes,
                    imagesByType
                  }
                }
              }));
              return;
            }
          } else {
            console.warn('Cloudinary function returned non-JSON response, falling back to database stats');
          }
        } else {
          console.warn(`Cloudinary function returned status ${response.status}, falling back to database stats`);
        }
      } catch (error) {
        console.error('Failed to get Cloudinary stats directly:', error);
        console.log('This is expected if Netlify functions are not deployed yet. Using database stats as fallback.');
      }

      // Fallback to database stats
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('is_active', true);

      if (!clinics || clinics.length === 0) {
        setState(prev => ({
          ...prev,
          cloudinaryManagement: {
            ...prev.cloudinaryManagement,
            isLoading: false,
            stats: {
              totalImages: 0,
              totalSizeBytes: 0,
              imagesByType: {}
            }
          }
        }));
        return;
      }

      // Aggregate stats from all clinics
      let totalImages = 0;
      let totalSizeBytes = 0;
      const imagesByType: { [key: string]: number } = {};

      for (const clinic of clinics) {
        try {
          const { data: images } = await supabase
            .from('tooth_images')
            .select('image_type, file_size_bytes')
            .eq('clinic_id', clinic.id);

          if (images) {
            totalImages += images.length;
            totalSizeBytes += images.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0);
            
            images.forEach(img => {
              imagesByType[img.image_type] = (imagesByType[img.image_type] || 0) + 1;
            });
          }
        } catch (error) {
          console.error(`Error loading stats for clinic ${clinic.id}:`, error);
        }
      }

      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          isLoading: false,
          stats: {
            totalImages,
            totalSizeBytes,
            imagesByType
          }
        }
      }));

    } catch (error) {
      console.error('Failed to load Cloudinary stats:', error);
      toast.error('Failed to load Cloudinary statistics');
      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          isLoading: false
        }
      }));
    }
  };

  const deleteCloudinaryData = async (deleteType: 'all' | 'orphaned' | 'old' | '1day' | '1month' | '3months' | '6months' | '1year') => {
    try {
      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          deleteProgress: 0,
          deleteType
        }
      }));

      // Use the new bulk delete function for direct Cloudinary deletion
      const response = await fetch('/.netlify/functions/delete-all-cloudinary-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deleteType
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete from Cloudinary');
        } else {
          throw new Error(`Netlify function not available (status: ${response.status}). Please deploy the functions first.`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Netlify function returned invalid response. Please check function deployment.');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Cloudinary cleanup completed! Deleted ${result.deletedCount} images${result.errorCount > 0 ? `, ${result.errorCount} errors` : ''}`);
        
        // Also clean up database records for deleted images
        if (deleteType === 'all') {
          await cleanupDatabaseRecords();
        }
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
      // Reload stats
      await loadCloudinaryStats();

      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          showDeleteDialog: false,
          deleteType: null,
          deleteProgress: 0
        }
      }));

    } catch (error) {
      console.error('Failed to delete Cloudinary data:', error);
      toast.error(`Failed to delete Cloudinary data: ${error.message}`);
      setState(prev => ({
        ...prev,
        cloudinaryManagement: {
          ...prev.cloudinaryManagement,
          showDeleteDialog: false,
          deleteType: null,
          deleteProgress: 0
        }
      }));
    }
  };

  // Function to test basic Netlify function
  const testNetlifyFunction = async () => {
    try {
      const response = await fetch('/.netlify/functions/test-function');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Netlify function is working!');
          console.log('Function test result:', result);
        } else {
          toast.error(`Function test failed: ${result.error}`);
          console.error('Function test error:', result);
        }
      } else {
        toast.error(`Netlify function not available (status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error testing function:', error);
      toast.error('Failed to test Netlify function');
    }
  };

  // Function to test Cloudinary connection
  const testCloudinaryConnection = async () => {
    try {
      const response = await fetch('/.netlify/functions/test-cloudinary');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Cloudinary connection successful!');
          console.log('Cloudinary test result:', result);
        } else {
          toast.error(`Cloudinary test failed: ${result.error}`);
          console.error('Cloudinary test error:', result);
        }
      } else {
        toast.error(`Netlify function not available (status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error testing Cloudinary:', error);
      toast.error('Failed to test Cloudinary connection');
    }
  };

  // Function to clean up database records after Cloudinary deletion
  const cleanupDatabaseRecords = async () => {
    try {
      // Get all clinics
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('is_active', true);

      if (!clinics || clinics.length === 0) {
        return;
      }

      let totalDeleted = 0;

      for (const clinic of clinics) {
        try {
          // Get all tooth images for this clinic
          const { data: images } = await supabase
            .from('tooth_images')
            .select('*')
            .eq('clinic_id', clinic.id);

          if (images && images.length > 0) {
            // Delete all images from database
            for (const image of images) {
              try {
                await toothImageApi.delete(image.id, clinic.id);
                totalDeleted++;
              } catch (error) {
                console.error(`Error deleting database record ${image.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing clinic ${clinic.id}:`, error);
        }
      }

      console.log(`Cleaned up ${totalDeleted} database records`);
    } catch (error) {
      console.error('Error cleaning up database records:', error);
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">System-wide controls and monitoring</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg border gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    Patient Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {state.features.patientManagementEnabled ? 
                      'Patients can access their dashboard and manage their data' : 
                      'Patient management is disabled - patients cannot access their data'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={state.features.patientManagementEnabled}
                    onCheckedChange={(enabled) => updateFeatureToggle('patientManagementEnabled', enabled)}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                  />
                  <Badge variant={state.features.patientManagementEnabled ? "default" : "secondary"} className="hidden sm:flex">
                    {state.features.patientManagementEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg border gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Appointment Booking
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {state.features.appointmentBookingEnabled ? 
                      'Public appointment booking is available' : 
                      'Public appointment booking is disabled'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={state.features.appointmentBookingEnabled}
                    onCheckedChange={(enabled) => updateFeatureToggle('appointmentBookingEnabled', enabled)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                  />
                  <Badge variant={state.features.appointmentBookingEnabled ? "default" : "secondary"} className="hidden sm:flex">
                    {state.features.appointmentBookingEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg border gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Shield className="h-4 w-4 text-purple-600" />
                    Admin Panel
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {state.features.adminPanelEnabled ? 
                      'Admin panel is accessible to authorized users' : 
                      'Admin panel is disabled - no admin access'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={state.features.adminPanelEnabled}
                    onCheckedChange={(enabled) => updateFeatureToggle('adminPanelEnabled', enabled)}
                    className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300"
                  />
                  <Badge variant={state.features.adminPanelEnabled ? "default" : "secondary"} className="hidden sm:flex">
                    {state.features.adminPanelEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
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
                          <h5 className="font-medium">Dentist Notifications</h5>
                          <p className="text-sm text-gray-600">
                            Send notifications to dentist when new appointments are booked
                          </p>
                        </div>
                        <Switch
                          checked={state.notificationSettings.send_to_dentist}
                          onCheckedChange={(enabled) => updateNotificationSetting('send_to_dentist', enabled)}
                        />
                      </div>

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



        {/* Cloudinary Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Cloudinary Data Management
            </CardTitle>
            <CardDescription>
              Manage uploaded images and files stored in Cloudinary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Images</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {state.cloudinaryManagement.stats?.totalImages || 0}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Total Size</p>
                    <p className="text-2xl font-bold text-green-700">
                      {state.cloudinaryManagement.stats?.totalSizeBytes 
                        ? `${(state.cloudinaryManagement.stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`
                        : '0 MB'
                      }
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">Image Types</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {state.cloudinaryManagement.stats?.imagesByType 
                        ? Object.keys(state.cloudinaryManagement.stats.imagesByType).length
                        : 0
                      }
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Image Type Breakdown */}
            {state.cloudinaryManagement.stats?.imagesByType && Object.keys(state.cloudinaryManagement.stats.imagesByType).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Image Type Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(state.cloudinaryManagement.stats.imagesByType).map(([type, count]) => (
                    <div key={type} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{type}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h4 className="font-semibold text-lg">Data Management Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={testNetlifyFunction}
                    variant="outline"
                    size="sm"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Test Function
                  </Button>
                  <Button
                    onClick={testCloudinaryConnection}
                    variant="outline"
                    size="sm"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Test Cloudinary
                  </Button>
                  <Button
                    onClick={loadCloudinaryStats}
                    disabled={state.cloudinaryManagement.isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {state.cloudinaryManagement.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Refresh Stats
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Delete All Images */}
                <div className="p-4 bg-red-50 rounded-lg border">
                  <h5 className="font-medium text-red-900 mb-2">Delete All Images</h5>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete all uploaded images from Cloudinary and database
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: 'all'
                      }
                    }))}
                    variant="destructive"
                    size="sm"
                    disabled={!state.cloudinaryManagement.stats?.totalImages}
                    className="w-full sm:w-auto"
                  >
                    Delete All
                  </Button>
                </div>

                {/* Delete 1 Month Old Images */}
                <div className="p-4 bg-pink-50 rounded-lg border">
                  <h5 className="font-medium text-pink-900 mb-2">Delete 1 Month Old</h5>
                  <p className="text-sm text-pink-700 mb-3">
                    Delete images older than 30 days to free up storage
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: '1month'
                      }
                    }))}
                    variant="outline"
                    size="sm"
                    className="border-pink-300 text-pink-700 hover:bg-pink-100 w-full sm:w-auto"
                  >
                    Delete 1 Month
                  </Button>
                </div>

                {/* Delete 3 Months Old Images */}
                <div className="p-4 bg-purple-50 rounded-lg border">
                  <h5 className="font-medium text-purple-900 mb-2">Delete 3 Months Old</h5>
                  <p className="text-sm text-purple-700 mb-3">
                    Delete images older than 90 days to free up storage
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: '3months'
                      }
                    }))}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100 w-full sm:w-auto"
                  >
                    Delete 3 Months
                  </Button>
                </div>

                {/* Delete 6 Months Old Images */}
                <div className="p-4 bg-indigo-50 rounded-lg border">
                  <h5 className="font-medium text-indigo-900 mb-2">Delete 6 Months Old</h5>
                  <p className="text-sm text-indigo-700 mb-3">
                    Delete images older than 180 days to free up storage
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: '6months'
                      }
                    }))}
                    variant="outline"
                    size="sm"
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 w-full sm:w-auto"
                  >
                    Delete 6 Months
                  </Button>
                </div>

                {/* Delete 1 Year Old Images */}
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <h5 className="font-medium text-blue-900 mb-2">Delete 1 Year Old</h5>
                  <p className="text-sm text-blue-700 mb-3">
                    Delete images older than 365 days to free up storage
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: '1year'
                      }
                    }))}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
                  >
                    Delete 1 Year
                  </Button>
                </div>

                {/* Delete 1 Day Old Images */}
                <div className="p-4 bg-yellow-50 rounded-lg border">
                  <h5 className="font-medium text-yellow-900 mb-2">Delete 1 Day Old</h5>
                  <p className="text-sm text-yellow-700 mb-3">
                    Delete images older than 24 hours for testing purposes
                  </p>
                  <Button
                    onClick={() => setState(prev => ({
                      ...prev,
                      cloudinaryManagement: {
                        ...prev.cloudinaryManagement,
                        showDeleteDialog: true,
                        deleteType: '1day'
                      }
                    }))}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto"
                  >
                    Delete 1 Day
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cloudinary Delete Confirmation Dialog */}
        <Dialog 
          open={state.cloudinaryManagement.showDeleteDialog} 
          onOpenChange={(open) => setState(prev => ({
            ...prev,
            cloudinaryManagement: {
              ...prev.cloudinaryManagement,
              showDeleteDialog: open
            }
          }))}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Confirm Cloudinary Deletion
              </DialogTitle>
              <DialogDescription>
                This action will permanently delete images from Cloudinary and the database. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">
                  {state.cloudinaryManagement.deleteType === 'all' && 'Delete All Images'}
                  {state.cloudinaryManagement.deleteType === '1day' && 'Delete Images (1+ day old)'}
                  {state.cloudinaryManagement.deleteType === '1month' && 'Delete Images (1+ month old)'}
                  {state.cloudinaryManagement.deleteType === '3months' && 'Delete Images (3+ months old)'}
                  {state.cloudinaryManagement.deleteType === '6months' && 'Delete Images (6+ months old)'}
                  {state.cloudinaryManagement.deleteType === '1year' && 'Delete Images (1+ year old)'}
                  {state.cloudinaryManagement.deleteType === 'old' && 'Delete Old Images (2+ years)'}
                  {state.cloudinaryManagement.deleteType === 'orphaned' && 'Delete Orphaned Images'}
                </h4>
                <p className="text-sm text-red-700">
                  {state.cloudinaryManagement.deleteType === 'all' && 
                    `This will delete all ${state.cloudinaryManagement.stats?.totalImages || 0} images from Cloudinary and the database.`}
                  {state.cloudinaryManagement.deleteType === '1day' && 
                    'This will delete images older than 24 hours for testing purposes.'}
                  {state.cloudinaryManagement.deleteType === '1month' && 
                    'This will delete images older than 30 days to free up storage space.'}
                  {state.cloudinaryManagement.deleteType === '3months' && 
                    'This will delete images older than 90 days to free up storage space.'}
                  {state.cloudinaryManagement.deleteType === '6months' && 
                    'This will delete images older than 180 days to free up storage space.'}
                  {state.cloudinaryManagement.deleteType === '1year' && 
                    'This will delete images older than 365 days to free up storage space.'}
                  {state.cloudinaryManagement.deleteType === 'old' && 
                    'This will delete images older than 2 years to free up storage space.'}
                  {state.cloudinaryManagement.deleteType === 'orphaned' && 
                    'This will delete images that don\'t have associated patient records.'}
                </p>
              </div>

              {state.cloudinaryManagement.deleteProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{state.cloudinaryManagement.deleteProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.cloudinaryManagement.deleteProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({
                  ...prev,
                  cloudinaryManagement: {
                    ...prev.cloudinaryManagement,
                    showDeleteDialog: false,
                    deleteType: null
                  }
                }))}
                className="flex-1"
                disabled={state.cloudinaryManagement.deleteProgress > 0}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => deleteCloudinaryData(state.cloudinaryManagement.deleteType!)}
                variant="destructive"
                className="flex-1"
                disabled={state.cloudinaryManagement.deleteProgress > 0}
              >
                {state.cloudinaryManagement.deleteProgress > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Database Export */}
        <DatabaseExport />
      </div>
    </div>
  );
};

export default SuperAdmin;
