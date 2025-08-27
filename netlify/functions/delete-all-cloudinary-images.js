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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Cloudinary not configured' })
      };
    }

    // Parse the request body
    const { deleteType = 'all' } = JSON.parse(event.body);

    // Calculate days based on delete type
    let daysToDelete = null;
    switch (deleteType) {
      case '1month':
        daysToDelete = 30;
        break;
      case '3months':
        daysToDelete = 90;
        break;
      case '6months':
        daysToDelete = 180;
        break;
      case '1year':
        daysToDelete = 365;
        break;
      case 'old':
        daysToDelete = 730; // 2 years
        break;
      default:
        daysToDelete = null; // 'all' or 'orphaned'
    }

    let deletedCount = 0;
    let errorCount = 0;
    let nextCursor = null;

    do {
      // Get a batch of images from Cloudinary
      const listResult = await cloudinary.api.resources({
        type: 'upload',
        max_results: 100,
        next_cursor: nextCursor,
        fields: 'public_id,url,format,bytes,created_at,resource_type'
      });

      if (!listResult.resources || listResult.resources.length === 0) {
        break;
      }

      // Filter images based on delete type
      let imagesToDelete = listResult.resources;

      if (daysToDelete) {
        // Delete images older than specified days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToDelete);
        
        imagesToDelete = listResult.resources.filter(image => {
          const createdAt = new Date(image.created_at);
          return createdAt < cutoffDate;
        });
      }

      // Delete each image
      for (const image of imagesToDelete) {
        try {
          const deleteResult = await cloudinary.uploader.destroy(image.public_id);
          
          if (deleteResult.result === 'ok' || deleteResult.result === 'not found') {
            deletedCount++;
            console.log(`Deleted image: ${image.public_id}`);
          } else {
            errorCount++;
            console.error(`Failed to delete image: ${image.public_id}`, deleteResult);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting image ${image.public_id}:`, error);
        }
      }

      nextCursor = listResult.next_cursor;

    } while (nextCursor);

    console.log('Cloudinary bulk delete completed:', {
      deletedCount,
      errorCount
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Cloudinary cleanup completed',
        deletedCount,
        errorCount
      })
    };

  } catch (error) {
    console.error('Error deleting Cloudinary images:', error);
    
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
