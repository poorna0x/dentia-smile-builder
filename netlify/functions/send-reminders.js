const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Missing Twilio credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'WhatsApp service not configured' 
        })
      };
    }

    const client = twilio(accountSid, authToken);

    // Get current time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('🔍 Checking for appointments that need reminders...');
    console.log('📅 Today:', today, 'Tomorrow:', tomorrow);

    // Get appointments for tomorrow that haven't had reminders sent
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
      .eq('date', tomorrow);

    if (error) {
      console.error('❌ Error fetching appointments for reminders:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch appointments' 
        })
      };
    }

    console.log(`📅 Found ${appointments?.length || 0} appointments for tomorrow`);

    if (!appointments || appointments.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'No appointments need reminders',
          count: 0
        })
      };
    }

    // For Netlify functions, we can't access localStorage directly
    // So we'll use environment variables or default settings
    const whatsappSettings = {
      enabled: process.env.WHATSAPP_ENABLED === 'true',
      send_reminders: process.env.SEND_REMINDERS === 'true',
      reminder_hours: parseInt(process.env.REMINDER_HOURS) || 24,
      whatsapp_phone_number: process.env.WHATSAPP_PHONE_NUMBER || '',
      send_to_dentist: process.env.SEND_TO_DENTIST === 'true',
      dentist_phone_number: process.env.DENTIST_PHONE_NUMBER || ''
    };

    console.log('📱 WhatsApp settings:', whatsappSettings);

    // Check if reminders are enabled
    if (!whatsappSettings.enabled || !whatsappSettings.send_reminders) {
      console.log('📱 Reminders disabled');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Reminders disabled',
          count: 0
        })
      };
    }

    let sentCount = 0;
    let errorCount = 0;

    // Process each appointment
    for (const appointment of appointments) {
      try {
        console.log(`📱 Sending reminder for appointment ${appointment.id}`);

        // Format phone number
        const phone = appointment.phone;
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const formattedTo = `whatsapp:${formattedPhone}`;
        const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

        // Create reminder message
        const message = `Hi ${appointment.patient_name}! This is a friendly reminder for your appointment at ${appointment.clinic_name} tomorrow at ${appointment.time}. Please arrive 10 minutes early. For any changes, call ${appointment.clinic_phone}. Thank you!`;

        // Send WhatsApp message
        const result = await client.messages.create({
          body: message,
          from: formattedFrom,
          to: formattedTo
        });

        console.log(`✅ Reminder sent successfully for appointment ${appointment.id}:`, result.sid);

        // Mark reminder as sent
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id);

        sentCount++;

      } catch (error) {
        console.error(`❌ Error sending reminder for appointment ${appointment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`📊 Reminder summary: ${sentCount} sent, ${errorCount} failed`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `Reminders processed: ${sentCount} sent, ${errorCount} failed`,
        sent: sentCount,
        failed: errorCount,
        total: appointments.length
      })
    };

  } catch (error) {
    console.error('❌ Error in send-reminders function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
