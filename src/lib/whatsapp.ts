import { supabase } from './supabase';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'appointment_confirmation' | 'review_request';
}

export interface NotificationSettings {
  whatsapp_enabled: boolean;
  whatsapp_phone_number: string;
  send_confirmation: boolean;
  send_reminders: boolean;
  send_reviews: boolean;
  reminder_hours: number;
  send_to_dentist: boolean;
  review_requests_enabled: boolean;
  review_message_template: string;
}

// Get notification settings from localStorage
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    const stored = localStorage.getItem('notification_settings');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('❌ Error in getNotificationSettings:', error);
    return null;
  }
};

// Send WhatsApp message via Netlify function
export const sendWhatsAppMessage = async (messageData: WhatsAppMessage): Promise<boolean> => {
  try {
    console.log('📱 Sending WhatsApp message:', messageData);
    
    const response = await fetch('/.netlify/functions/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ WhatsApp message sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send WhatsApp message:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return false;
  }
};

// Format phone number to include country code if missing
const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with country code (91 for India), return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: assume Indian number and add +91
  return `+91${cleaned}`;
};

// Send appointment confirmation via WhatsApp
export const sendWhatsAppAppointmentConfirmation = async (
  phone: string,
  appointmentData: {
    name: string;
    date: string;
    time: string;
    clinicName: string;
    clinicPhone: string;
  }
): Promise<boolean> => {
  try {
    // Check if WhatsApp is enabled and confirmations are enabled
    const settings = await getNotificationSettings();
    if (!settings?.whatsapp_enabled || !settings?.send_confirmation) {
      console.log('📱 WhatsApp confirmations disabled');
      return false;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📱 Original phone:', phone, 'Formatted phone:', formattedPhone);

    const message = `Hi ${appointmentData.name}! Your appointment at ${appointmentData.clinicName} is confirmed for ${appointmentData.date} at ${appointmentData.time}. For any changes, call ${appointmentData.clinicPhone}. Thank you!`;

    return await sendWhatsAppMessage({
      to: formattedPhone,
      message,
      type: 'appointment_confirmation'
    });
  } catch (error) {
    console.error('❌ Error in sendWhatsAppAppointmentConfirmation:', error);
    return false;
  }
};

// Send appointment reminder via WhatsApp
export const sendWhatsAppAppointmentReminder = async (
  phone: string,
  appointmentData: {
    name: string;
    date: string;
    time: string;
    clinicName: string;
    clinicPhone: string;
  }
): Promise<boolean> => {
  try {
    // Check if reminders are enabled
    const settings = await getNotificationSettings();
    if (!settings?.whatsapp_enabled || !settings?.send_reminders) {
      console.log('📱 Reminders disabled');
      return false;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📱 Reminder - Original phone:', phone, 'Formatted phone:', formattedPhone);

    const message = `Hi ${appointmentData.name}! This is a friendly reminder for your appointment at ${appointmentData.clinicName} tomorrow at ${appointmentData.time}. Please arrive 10 minutes early. For any changes, call ${appointmentData.clinicPhone}. Thank you!`;

    return await sendWhatsAppMessage({
      to: formattedPhone,
      message,
      type: 'appointment_reminder'
    });
  } catch (error) {
    console.error('❌ Error in sendWhatsAppAppointmentReminder:', error);
    return false;
  }
};

// Send notification to dentist about new appointment
export const sendWhatsAppDentistNotification = async (
  clinicId: string,
  appointmentData: {
    name: string;
    date: string;
    time: string;
    phone: string;
    email: string;
  }
): Promise<boolean> => {
  try {
    console.log('🦷 Starting dentist notification process...');
    console.log('🦷 Clinic ID:', clinicId);
    console.log('🦷 Appointment data:', appointmentData);
    
    // Check if dentist notifications are enabled
    const settings = await getNotificationSettings();
    console.log('🦷 Notification settings:', settings);
    
    if (!settings?.whatsapp_enabled || !settings?.send_to_dentist) {
      console.log('📱 Dentist notifications disabled');
      console.log('🦷 WhatsApp enabled:', settings?.whatsapp_enabled);
      console.log('🦷 Send to dentist:', settings?.send_to_dentist);
      return false;
    }

    // Get dentist phone number from settings
    if (!settings.dentist_phone_number) {
      console.log('❌ No dentist phone number configured in SuperAdmin');
      return false;
    }

    // Get clinic name
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('name')
      .eq('id', clinicId)
      .single();

    if (error || !clinic?.name) {
      console.log('❌ No clinic found:', clinicId);
      return false;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(settings.dentist_phone_number);
    console.log('📱 Dentist notification - Original phone:', settings.dentist_phone_number, 'Formatted phone:', formattedPhone);

    const message = `🦷 New Appointment Alert!

Patient: ${appointmentData.name}
Date: ${appointmentData.date}
Time: ${appointmentData.time}
Phone: ${appointmentData.phone}
Email: ${appointmentData.email}

Clinic: ${clinic.name}

Please check your appointment schedule.`;

    return await sendWhatsAppMessage({
      to: formattedPhone,
      message,
      type: 'dentist_notification'
    });
  } catch (error) {
    console.error('❌ Error in sendWhatsAppDentistNotification:', error);
    return false;
  }
};

// Send review request via WhatsApp
export const sendWhatsAppReviewRequest = async (
  phone: string,
  patientName: string,
  reviewLink: string
): Promise<boolean> => {
  try {
    // Check if review requests are enabled
    const settings = await getNotificationSettings();
    if (!settings?.whatsapp_enabled || !settings?.send_reviews) {
      console.log('📱 Review requests disabled');
      return false;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📱 Review request - Original phone:', phone, 'Formatted phone:', formattedPhone);

    const message = settings.review_message_template
      .replace('{review_link}', reviewLink)
      .replace('{patient_name}', patientName);

    return await sendWhatsAppMessage({
      to: formattedPhone,
      message,
      type: 'review_request'
    });
  } catch (error) {
    console.error('❌ Error in sendWhatsAppReviewRequest:', error);
    return false;
  }
};
