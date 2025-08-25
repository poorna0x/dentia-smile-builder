import { supabase } from './supabase';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'appointment_confirmation' | 'review_request';
}

export interface NotificationSettings {
  whatsapp_enabled: boolean;
  whatsapp_phone_number: string;
  review_requests_enabled: boolean;
  review_message_template: string;
}

// Get notification settings from database
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    const { data, error } = await supabase.rpc('get_notification_settings');
    
    if (error) {
      console.error('❌ Error fetching notification settings:', error);
      return null;
    }
    
    return data?.[0] || null;
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
    // Check if WhatsApp is enabled
    const settings = await getNotificationSettings();
    if (!settings?.whatsapp_enabled) {
      console.log('📱 WhatsApp notifications disabled');
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

// Send review request via WhatsApp
export const sendWhatsAppReviewRequest = async (
  phone: string,
  patientName: string,
  reviewLink: string
): Promise<boolean> => {
  try {
    // Check if review requests are enabled
    const settings = await getNotificationSettings();
    if (!settings?.review_requests_enabled) {
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
