import { useState, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { 
  isPushSupported, 
  subscribeToPush, 
  unsubscribeFromPush, 
  isPushSubscribed,
  requestNotificationPermission 
} from '@/lib/push-notifications';

export const usePushNotifications = () => {
  const { clinic } = useClinic();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  // Check support and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);
        
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      }
    };

    checkStatus();
  }, []);

  // Subscribe to push notifications
  const subscribe = async (): Promise<boolean> => {
    if (!clinic?.id) {
      console.error('No clinic ID available');
      return false;
    }

    setLoading(true);
    try {
      const success = await subscribeToPush(clinic.id);
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
      }
      return success;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request permission only
  const requestPermission = async (): Promise<boolean> => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission === 'granted';
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    requestPermission
  };
};
