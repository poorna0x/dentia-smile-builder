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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check if Cloudinary credentials are configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary credentials not configured');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Cloudinary not configured',
          message: 'Please set Cloudinary environment variables in Netlify',
          resources: [],
          total_count: 0
        })
      };
    }

    // Get query parameters
    const { max_results = 500, next_cursor } = event.queryStringParameters || {};

    // List all images from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: parseInt(max_results),
      next_cursor: next_cursor || undefined,
      fields: 'public_id,url,format,bytes,created_at,resource_type'
    });

    console.log('Cloudinary list result:', {
      resources: result.resources?.length || 0,
      next_cursor: result.next_cursor
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        resources: result.resources || [],
        next_cursor: result.next_cursor,
        total_count: result.resources?.length || 0
      })
    };

  } catch (error) {
    console.error('Error listing Cloudinary images:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
