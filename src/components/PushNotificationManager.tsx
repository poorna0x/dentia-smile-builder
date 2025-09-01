import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Shield, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

const PushNotificationManager: React.FC = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('🔔 Push notifications enabled! You\'ll get alerts for new appointments.');
    } else {
      toast.error('Failed to enable push notifications. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Push notifications disabled.');
    } else {
      toast.error('Failed to disable push notifications.');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notification permission granted!');
    } else {
      toast.error('Notification permission denied.');
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your browser doesn't support push notifications. Consider using Chrome, Firefox, or Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription className="text-blue-700">
          Get instant notifications when new appointments are booked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <>
                <Bell className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Notifications Enabled</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Notifications Disabled</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-600">
              Permission: {permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Not Requested'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {permission === 'default' && (
            <Button
              onClick={handleRequestPermission}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Request Permission
            </Button>
          )}
          
          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          )}
          
          {isSubscribed && (
            <Button
              onClick={handleUnsubscribe}
              disabled={loading}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <BellOff className="h-4 w-4 mr-2" />
              {loading ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded-lg">
          <strong>How it works:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Enable notifications to get instant alerts</li>
            <li>Works even when the app is closed</li>
            <li>Click notifications to open admin dashboard</li>
            <li>You'll be notified for new appointments and updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;
