// Push Notifications Service
import { supabase } from './supabase';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

// Check if push notifications are supported
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
};

// Subscribe to push notifications
export const subscribeToPush = async (clinicId: string): Promise<boolean> => {
  try {
    console.log('🔔 Starting push notification subscription process...');
    
    if (!isPushSupported()) {
      console.log('❌ Push notifications not supported');
      return false;
    }

    console.log('✅ Push notifications supported');

    // Request permission first
    const permission = await requestNotificationPermission();
    console.log('📱 Notification permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }

    console.log('✅ Notification permission granted');

    // Register service worker for push notifications
    console.log('🔧 Registering service worker...');
    
    // Check if service worker is already registered
    let registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
    
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
      console.log('✅ New service worker registered:', registration);
    } else {
      console.log('✅ Existing service worker found:', registration);
    }
    
    console.log('⏳ Waiting for service worker to be ready...');
    await navigator.serviceWorker.ready;
    console.log('✅ Service worker is ready');

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VAPID public key not found in environment variables');
      return false;
    }

    // Subscribe to push manager
    console.log('Attempting to subscribe with VAPID key:', vapidPublicKey.substring(0, 20) + '...');
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('✅ Push subscription created:', subscription);
    } catch (subscribeError) {
      console.error('❌ Push subscription failed:', subscribeError);
      
      // Check if there's an existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('📱 Found existing subscription, using that:', existingSubscription);
        return true;
      }
      
      throw subscribeError;
    }

    // Save subscription to database
    const subscriptionData = {
      clinic_id: clinicId,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'endpoint'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    console.log('Successfully subscribed to push notifications');
    return true;

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
    if (!registration) {
      console.log('No service worker registration found');
      return true;
    }
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Error removing push subscription:', error);
        return false;
      }
    }

    console.log('Successfully unsubscribed from push notifications');
    return true;

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Check if user is subscribed
export const isPushSubscribed = async (): Promise<boolean> => {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();

    return !!subscription;
  } catch (error) {
    console.error('Error checking push subscription status:', error);
    return false;
  }
};

// Send push notification (called from server)
export const sendPushNotification = async (
  clinicId: string,
  payload: NotificationPayload
): Promise<boolean> => {
  try {
    // This will be called from a Netlify function
    const response = await fetch('/.netlify/functions/send-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clinicId,
        payload
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Show local notification (for testing)
export const showLocalNotification = (payload: NotificationPayload): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.png',
      badge: payload.badge || '/favicon.png',
      data: payload.data
    });
  }
};