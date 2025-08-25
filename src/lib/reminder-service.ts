import { supabase } from './supabase';
import { sendWhatsAppAppointmentReminder } from './whatsapp';
import { format, addHours, isBefore } from 'date-fns';

export interface AppointmentForReminder {
  id: string;
  patient_name: string;
  phone: string;
  date: string;
  time: string;
  clinic_name: string;
  clinic_phone: string;
  reminder_sent: boolean;
}

// Check for appointments that need reminders
export const checkAndSendReminders = async (): Promise<void> => {
  try {
    console.log('🔍 Checking for appointments that need reminders...');

    // Get current time
    const now = new Date();
    
    // Get appointments for the next 24 hours that haven't had reminders sent
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        phone,
        date,
        time,
        clinic_name,
        clinic_phone,
        reminder_sent
      `)
      .eq('status', 'Confirmed')
      .eq('reminder_sent', false)
      .gte('date', format(now, 'yyyy-MM-dd'))
      .lte('date', format(addHours(now, 24), 'yyyy-MM-dd'));

    if (error) {
      console.error('❌ Error fetching appointments for reminders:', error);
      return;
    }

    console.log(`📅 Found ${appointments?.length || 0} appointments that might need reminders`);

    if (!appointments || appointments.length === 0) {
      return;
    }

    // Process each appointment
    for (const appointment of appointments) {
      await processAppointmentReminder(appointment);
    }

  } catch (error) {
    console.error('❌ Error in checkAndSendReminders:', error);
  }
};

// Process reminder for a single appointment
const processAppointmentReminder = async (appointment: AppointmentForReminder): Promise<void> => {
  try {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    
    // Get reminder settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('settings')
      .eq('setting_type', 'whatsapp_notifications')
      .single();

    if (!settings?.settings) {
      console.log('❌ No WhatsApp settings found');
      return;
    }

    const whatsappSettings = settings.settings;
    const reminderHours = whatsappSettings.reminder_hours || 24;
    const reminderTime = addHours(appointmentDateTime, -reminderHours);

    // Check if it's time to send the reminder
    if (isBefore(now, reminderTime)) {
      console.log(`⏰ Appointment ${appointment.id} reminder not due yet`);
      return;
    }

    // Check if reminders are enabled
    if (!whatsappSettings.enabled || !whatsappSettings.send_reminders) {
      console.log('📱 Reminders disabled, marking as sent to avoid re-checking');
      await markReminderAsSent(appointment.id);
      return;
    }

    console.log(`📱 Sending reminder for appointment ${appointment.id}`);

    // Send WhatsApp reminder
    const reminderSent = await sendWhatsAppAppointmentReminder(
      appointment.phone,
      {
        name: appointment.patient_name,
        date: format(appointmentDateTime, 'MMM dd, yyyy'),
        time: appointment.time,
        clinicName: appointment.clinic_name,
        clinicPhone: appointment.clinic_phone
      }
    );

    if (reminderSent) {
      console.log(`✅ Reminder sent successfully for appointment ${appointment.id}`);
      await markReminderAsSent(appointment.id);
    } else {
      console.log(`❌ Failed to send reminder for appointment ${appointment.id}`);
    }

  } catch (error) {
    console.error(`❌ Error processing reminder for appointment ${appointment.id}:`, error);
  }
};

// Mark reminder as sent
const markReminderAsSent = async (appointmentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', appointmentId);

    if (error) {
      console.error('❌ Error marking reminder as sent:', error);
    }
  } catch (error) {
    console.error('❌ Error in markReminderAsSent:', error);
  }
};

// Manual reminder trigger (for testing)
export const sendManualReminder = async (appointmentId: string): Promise<boolean> => {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        phone,
        date,
        time,
        clinic_name,
        clinic_phone
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      console.error('❌ Error fetching appointment for manual reminder:', error);
      return false;
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    
    const reminderSent = await sendWhatsAppAppointmentReminder(
      appointment.phone,
      {
        name: appointment.patient_name,
        date: format(appointmentDateTime, 'MMM dd, yyyy'),
        time: appointment.time,
        clinicName: appointment.clinic_name,
        clinicPhone: appointment.clinic_phone
      }
    );

    if (reminderSent) {
      await markReminderAsSent(appointmentId);
    }

    return reminderSent;
  } catch (error) {
    console.error('❌ Error in sendManualReminder:', error);
    return false;
  }
};
