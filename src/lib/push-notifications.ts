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
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasPushSubscription = 'PushSubscription' in window;
  
  console.log('🔍 Push support check:', {
    hasServiceWorker,
    hasPushManager,
    hasPushSubscription
  });
  
  return hasServiceWorker && hasPushManager && hasPushSubscription;
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
  let registration: ServiceWorkerRegistration | null = null;
  
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

    // Simple service worker registration
    console.log('🔧 Registering service worker...');
    
    try {
      registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('✅ Service worker registered:', registration);
      
      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker is ready');
    } catch (swError) {
      console.error('❌ Service worker registration failed:', swError);
      return false;
    }

    // Verify service worker registration exists
    if (!registration) {
      console.error('❌ Service worker registration is null');
      return false;
    }
    
    console.log('✅ Service worker registration verified:', registration);
    
    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log('🔍 Checking VAPID key from environment...');
    console.log('Environment keys available:', Object.keys(import.meta.env).filter(key => key.includes('VAPID')));
    
    if (!vapidPublicKey) {
      console.error('❌ VAPID public key not found in environment variables');
      console.log('Available env vars:', import.meta.env);
      return false;
    }
    
    console.log('✅ VAPID key found, length:', vapidPublicKey.length);

    // Verify push manager is available
    if (!registration.pushManager) {
      console.error('❌ Push manager not available on service worker registration');
      return false;
    }
    
    console.log('✅ Push manager available:', registration.pushManager);
    
    // Check if push subscription is supported
    if (!('PushSubscription' in window)) {
      console.error('❌ PushSubscription not supported in this browser');
      return false;
    }
    
    console.log('✅ PushSubscription supported');
    
    // Check if we can create a test subscription
    try {
      const testSubscription = await registration.pushManager.getSubscription();
      console.log('📱 Current subscription status:', testSubscription ? 'Has subscription' : 'No subscription');
    } catch (error) {
      console.log('📱 Error checking current subscription:', error);
    }
    
    // Subscribe to push manager
    console.log('Attempting to subscribe with VAPID key:', vapidPublicKey.substring(0, 20) + '...');
    
    try {
      console.log('🔐 About to call pushManager.subscribe...');
      console.log('🔑 Application server key length:', urlBase64ToUint8Array(vapidPublicKey).length);
      
      // Try to subscribe with a timeout to catch any hanging requests
      const subscriptionPromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Push subscription timeout')), 10000);
      });
      
      const subscription = await Promise.race([subscriptionPromise, timeoutPromise]);
      
      console.log('✅ Push subscription created:', subscription);
      console.log('📱 Subscription endpoint:', subscription.endpoint);
      console.log('🔑 Subscription keys:', {
        p256dh: subscription.keys.p256dh ? 'Present' : 'Missing',
        auth: subscription.keys.auth ? 'Present' : 'Missing'
      });
    } catch (subscribeError) {
      console.error('❌ Push subscription failed:', subscribeError);
      console.error('❌ Error name:', subscribeError.name);
      console.error('❌ Error message:', subscribeError.message);
      console.error('❌ Error stack:', subscribeError.stack);
      
      // Check if there's an existing subscription
      try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('📱 Found existing subscription, using that:', existingSubscription);
          return true;
        }
      } catch (checkError) {
        console.error('❌ Error checking existing subscription:', checkError);
      }
      
      // Provide specific guidance based on error type
      if (subscribeError.name === 'AbortError') {
        console.error('🚨 AbortError detected - this usually means:');
        console.error('   - Browser blocked the push subscription');
        console.error('   - Push service unavailable');
        console.error('   - Network connectivity issues');
        console.error('   - Browser security restrictions');
      } else if (subscribeError.name === 'NotAllowedError') {
        console.error('🚨 NotAllowedError detected - this usually means:');
        console.error('   - User denied permission');
        console.error('   - Browser blocked the request');
      } else if (subscribeError.name === 'NotSupportedError') {
        console.error('🚨 NotSupportedError detected - this usually means:');
        console.error('   - Push notifications not supported');
        console.error('   - Service worker not ready');
      }
      
      // Try fallback approach - subscribe without VAPID key
      console.log('🔄 Trying fallback subscription without VAPID key...');
      try {
        const fallbackSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        });
        console.log('✅ Fallback subscription successful:', fallbackSubscription);
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback subscription also failed:', fallbackError);
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
  try {
    console.log('🔑 Converting VAPID key:', base64String.substring(0, 20) + '...');
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('✅ VAPID key converted successfully, length:', outputArray.length);
    return outputArray;
  } catch (error) {
    console.error('❌ Error converting VAPID key:', error);
    throw new Error('Invalid VAPID key format');
  }
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