const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    // Check if Cloudinary credentials are configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Cloudinary not configured',
          missing: {
            cloud_name: !process.env.CLOUDINARY_CLOUD_NAME,
            api_key: !process.env.CLOUDINARY_API_KEY,
            api_secret: !process.env.CLOUDINARY_API_SECRET
          }
        })
      };
    }

    // Test Cloudinary connection by getting account info
    const accountInfo = await cloudinary.api.ping();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Cloudinary connection successful',
        accountInfo,
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY ? '***configured***' : 'missing',
          api_secret: process.env.CLOUDINARY_API_SECRET ? '***configured***' : 'missing'
        }
      })
    };

  } catch (error) {
    console.error('Error testing Cloudinary:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Cloudinary test failed',
        message: error.message,
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'missing',
          api_key: process.env.CLOUDINARY_API_KEY ? '***configured***' : 'missing',
          api_secret: process.env.CLOUDINARY_API_SECRET ? '***configured***' : 'missing'
        }
      })
    };
  }
};
