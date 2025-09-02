// Firebase Cloud Messaging for Cross-Platform Push Notifications
// This works on both iPhone and Android

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

interface NotificationData {
  title: string;
  body: string;
  url?: string;
  appointmentId?: string;
}

// Request notification permission and get FCM token
export const setupFirebaseNotifications = async (clinicId: string) => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
    });

    if (token) {
      
      // Save token to database
      await saveFCMToken(token, clinicId);
      
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error setting up Firebase notifications:', error);
    return null;
  }
};

// Save FCM token to database
const saveFCMToken = async (token: string, clinicId: string) => {
  try {
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        token: token,
        clinic_id: clinicId,
        platform: getPlatform(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving FCM token:', error);
    } else {
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Get platform information
const getPlatform = () => {
  const userAgent = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'ios';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  } else {
    return 'web';
  }
};

// Handle foreground messages (when app is open)
export const setupForegroundHandler = () => {
  onMessage(messaging, (payload) => {
    
    const notificationData = payload.data;
    
    // Show local notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(notificationData.title || 'New Notification', {
        body: notificationData.body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: {
          url: notificationData.url,
          appointmentId: notificationData.appointmentId
        }
      });

      notification.onclick = () => {
        if (notificationData.url) {
          window.open(notificationData.url, '_blank');
        }
        notification.close();
      };
    }
  });
};

// Send notification to all FCM tokens
export const sendFirebaseNotification = async (data: NotificationData) => {
  try {
    // Get all FCM tokens from database
    const { data: tokens, error } = await supabase
      .from('fcm_tokens')
      .select('*');

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return;
    }

    if (!tokens || tokens.length === 0) {
      return;
    }

    // Send notification to each token
    const promises = tokens.map(async (tokenData) => {
      try {
        const response = await fetch('/api/send-firebase-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: tokenData.token,
            data: data,
            platform: tokenData.platform
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

      } catch (error) {
        console.error('Error sending Firebase notification:', error);
        
        // Remove invalid token
        await supabase
          .from('fcm_tokens')
          .delete()
          .eq('token', tokenData.token);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendFirebaseNotification:', error);
  }
};

// Send notification for new appointment
export const sendNewAppointmentFirebaseNotification = async (appointment: any) => {
  const notificationData: NotificationData = {
    title: '🆕 New Appointment Booked!',
    body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
    url: '/admin',
    appointmentId: appointment.id
  };

  await sendFirebaseNotification(notificationData);
};

// Send notification for appointment status change
export const sendAppointmentStatusFirebaseNotification = async (appointment: any, status: string) => {
  const statusEmoji = {
    'Confirmed': '✅',
    'Cancelled': '❌',
    'Rescheduled': '🔄'
  };

  const notificationData: NotificationData = {
    title: `${statusEmoji[status as keyof typeof statusEmoji] || '📋'} Appointment ${status}`,
    body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
    url: '/admin',
    appointmentId: appointment.id
  };

  await sendFirebaseNotification(notificationData);
};
