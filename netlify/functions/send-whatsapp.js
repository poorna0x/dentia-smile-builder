const twilio = require('twilio');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    // Parse the request body
    const { to, message, type } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, message' 
        })
      };
    }

    // Get Twilio credentials from environment variables
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

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Format phone number for WhatsApp (add whatsapp: prefix)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

    console.log('📱 Sending WhatsApp message:', {
      to: formattedTo,
      from: formattedFrom,
      type,
      messageLength: message.length
    });

    // Send WhatsApp message
    const result = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo
    });

    console.log('✅ WhatsApp message sent successfully:', result.sid);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        messageId: result.sid,
        type: type 
      })
    };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid phone number format' 
        })
      };
    }
    
    if (error.code === 21608) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'WhatsApp number not verified. Please verify your number in Twilio console.' 
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send WhatsApp message',
        details: error.message 
      })
    };
  }
};
