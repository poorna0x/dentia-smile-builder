// Appointment Push Notifications
import { sendPushNotification } from './push-notifications';

interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: string;
  clinic_id: string;
}

// Send push notification when new appointment is created
export const sendNewAppointmentNotification = async (appointment: Appointment): Promise<void> => {
  try {
    const payload = {
      title: '🔔 New Appointment Booked!',
      body: `${appointment.name} booked for ${appointment.date} at ${appointment.time}`,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        appointmentId: appointment.id,
        action: 'new_appointment',
        url: '/admin'
      },
      tag: 'new-appointment'
    };

    await sendPushNotification(appointment.clinic_id, payload);
    console.log('Push notification sent for new appointment:', appointment.id);

  } catch (error) {
    console.error('Failed to send new appointment notification:', error);
  }
};

// Send push notification when appointment is updated
export const sendAppointmentUpdateNotification = async (
  appointment: Appointment, 
  action: 'completed' | 'cancelled' | 'rescheduled'
): Promise<void> => {
  try {
    const actionEmojis = {
      completed: '✅',
      cancelled: '❌', 
      rescheduled: '📅'
    };

    const actionTexts = {
      completed: 'completed',
      cancelled: 'cancelled',
      rescheduled: 'rescheduled'
    };

    const payload = {
      title: `${actionEmojis[action]} Appointment ${actionTexts[action]}`,
      body: `${appointment.name}'s appointment has been ${actionTexts[action]}`,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        appointmentId: appointment.id,
        action: `appointment_${action}`,
        url: '/admin'
      },
      tag: `appointment-${action}`
    };

    await sendPushNotification(appointment.clinic_id, payload);
    console.log(`Push notification sent for ${action} appointment:`, appointment.id);

  } catch (error) {
    console.error(`Failed to send ${action} appointment notification:`, error);
  }
};

// Send reminder notification
export const sendAppointmentReminderNotification = async (appointment: Appointment): Promise<void> => {
  try {
    const payload = {
      title: '⏰ Appointment Reminder',
      body: `Don't forget: ${appointment.name} has an appointment today at ${appointment.time}`,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        appointmentId: appointment.id,
        action: 'reminder',
        url: '/admin'
      },
      tag: 'appointment-reminder'
    };

    await sendPushNotification(appointment.clinic_id, payload);
    console.log('Push notification sent for appointment reminder:', appointment.id);

  } catch (error) {
    console.error('Failed to send appointment reminder notification:', error);
  }
};
