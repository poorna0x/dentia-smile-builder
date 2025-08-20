// Notification Management System for Jeshna Dental Clinic

// VAPID keys for push notifications (replace with your actual keys)
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key
const VAPID_PRIVATE_KEY = 'YOUR_VAPID_PRIVATE_KEY'; // Replace with actual key

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return true;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });

    console.log('Push notification subscription:', subscription);
    
    // Save subscription to database (implement this)
    await saveSubscriptionToDatabase(subscription);
    
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
};

// Show local notification
export const showLocalNotification = async (data: NotificationData): Promise<boolean> => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    const notification = new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      data: data.data,
      actions: data.actions,
      requireInteraction: true,
      tag: 'appointment-notification'
    });

    notification.onclick = () => {
      window.focus();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Failed to show local notification:', error);
    return false;
  }
};

// Show appointment notification
export const showAppointmentNotification = async (appointment: any): Promise<boolean> => {
  const notificationData: NotificationData = {
    title: 'New Appointment Booked! 🦷',
    body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: '/admin',
      appointment: appointment
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/logo.png'
      },
      {
        action: 'call',
        title: 'Call Patient',
        icon: '/logo.png'
      }
    ]
  };

  return await showLocalNotification(notificationData);
};

// Send push notification to all subscribers
export const sendPushNotification = async (data: NotificationData): Promise<boolean> => {
  try {
    // This would typically be done from your backend
    // For now, we'll simulate it
    console.log('Sending push notification:', data);
    
    // In a real implementation, you would:
    // 1. Get all subscriptions from database
    // 2. Send to each subscription via your backend
    // 3. Handle delivery status
    
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
};

// Save subscription to database
const saveSubscriptionToDatabase = async (subscription: PushSubscription): Promise<void> => {
  try {
    const { supabase } = await import('./supabase');
    
    // Get clinic ID from URL or context
    const urlParams = new URLSearchParams(window.location.search);
    const clinicId = urlParams.get('clinic') || 'default-clinic-id';
    
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        clinic_id: clinicId,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      });

    if (error) {
      console.error('Failed to save subscription to database:', error);
    } else {
      console.log('Subscription saved to database successfully');
    }
  } catch (error) {
    console.error('Failed to save subscription:', error);
  }
};

// Check if PWA is installed
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Install PWA
export const installPWA = async (): Promise<boolean> => {
  try {
    if (!('BeforeInstallPromptEvent' in window)) {
      console.log('PWA install not supported');
      return false;
    }

    // This would trigger the install prompt
    // The actual implementation depends on the browser's install prompt
    console.log('PWA install requested');
    return true;
  } catch (error) {
    console.error('Failed to install PWA:', error);
    return false;
  }
};

// Initialize notifications
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Register service worker
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
    }

    // Request notification permission
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      // Subscribe to push notifications
      await subscribeToPushNotifications();
    }
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
};
