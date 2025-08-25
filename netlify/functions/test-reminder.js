const { createClient } = require('@supabase/supabase-js');

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

    // Get current time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('🔍 Testing reminder system...');
    console.log('📅 Today:', today, 'Tomorrow:', tomorrow);

    // Check WhatsApp settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('settings')
      .eq('setting_type', 'whatsapp_notifications')
      .single();

    if (settingsError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch WhatsApp settings',
          details: settingsError.message
        })
      };
    }

    // Get appointments for tomorrow
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        phone,
        date,
        time,
        clinic_name,
        clinic_phone,
        reminder_sent,
        status
      `)
      .eq('status', 'Confirmed')
      .eq('date', tomorrow);

    if (appointmentsError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch appointments',
          details: appointmentsError.message
        })
      };
    }

    // Check Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    const systemStatus = {
      whatsapp_enabled: settings?.settings?.enabled || false,
      send_reminders: settings?.settings?.send_reminders || false,
      reminder_hours: settings?.settings?.reminder_hours || 24,
      twilio_configured: !!(accountSid && authToken && fromNumber),
      appointments_tomorrow: appointments?.length || 0,
      reminders_pending: appointments?.filter(a => !a.reminder_sent).length || 0,
      reminders_sent: appointments?.filter(a => a.reminder_sent).length || 0,
      database_connected: true,
      function_working: true
    };

    console.log('📊 System Status:', systemStatus);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Reminder system test completed',
        status: systemStatus,
        appointments: appointments || []
      })
    };

  } catch (error) {
    console.error('❌ Error in test-reminder function:', error);
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
