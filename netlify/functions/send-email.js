const { Resend } = require('resend');

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
    const { to, subject, html, text, type } = JSON.parse(event.body);

    console.log('📧 Email request received:', { to, subject, type });
    console.log('🔑 API Key available:', !!process.env.VITE_RESEND_API_KEY);

    // Initialize Resend
    const resend = new Resend(process.env.VITE_RESEND_API_KEY);

    // Send email
          const { data, error } = await resend.emails.send({
        from: 'Jeshna Dental Clinic <appointments@resend.dev>',
        to: [to],
        reply_to: 'poorn8105@gmail.com',
        subject: subject,
        html: html,
        text: text,
        headers: {
          'X-Entity-Ref-ID': 'jeshna-dental-clinic'
        }
      });

    if (error) {
      console.error('❌ Resend API Error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to send email',
          details: error
        })
      };
    }

    console.log('Email sent successfully:', data);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data,
        type: type 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      })
    };
  }
};
