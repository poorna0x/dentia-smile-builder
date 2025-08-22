// Push Notification Utilities
import { supabase } from './supabase';

interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  appointmentId?: string;
}

// Send push notification to all subscribers
export const sendPushNotification = async (data: PushNotificationData) => {
  try {
    // Get all push subscriptions from database
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return;
    }

    // Send notification to each subscription
    const promises = subscriptions.map(async (subscription) => {
      try {
        const response = await fetch('/api/send-push-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            data: data
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Push notification sent successfully');
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // Remove invalid subscription
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};

// Send notification for new appointment
export const sendNewAppointmentNotification = async (appointment: any) => {
  const notificationData: PushNotificationData = {
    title: '🆕 New Appointment Booked!',
    body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
    url: '/admin',
    appointmentId: appointment.id
  };

  await sendPushNotification(notificationData);
};

// Send notification for appointment status change
export const sendAppointmentStatusNotification = async (appointment: any, status: string) => {
  const statusEmoji = {
    'Confirmed': '✅',
    'Cancelled': '❌',
    'Rescheduled': '🔄'
  };

  const notificationData: PushNotificationData = {
    title: `${statusEmoji[status as keyof typeof statusEmoji] || '📋'} Appointment ${status}`,
    body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
    url: '/admin',
    appointmentId: appointment.id
  };

  await sendPushNotification(notificationData);
};

// Send notification for disabled time slot
export const sendDisabledSlotNotification = async (slot: any) => {
  const notificationData: PushNotificationData = {
    title: '🚫 Time Slot Disabled',
    body: `${slot.date} from ${slot.start_time} to ${slot.end_time}`,
    url: '/admin'
  };

  await sendPushNotification(notificationData);
};
