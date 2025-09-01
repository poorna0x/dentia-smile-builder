const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:admin@dentia.app',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VITE_VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { clinicId, payload } = JSON.parse(event.body);

    if (!clinicId || !payload) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing clinicId or payload' })
      };
    }

    console.log('Sending push notification for clinic:', clinicId);
    console.log('Payload:', payload);

    // Get all push subscriptions for this clinic
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch subscriptions' })
      };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for clinic:', clinicId);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No subscriptions found', sent: 0 })
      };
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          badge: payload.badge || '/favicon.png',
          data: payload.data || {},
          tag: payload.tag || 'appointment'
        });

        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log('Push notification sent successfully to:', subscription.endpoint.substring(0, 50) + '...');
        return { success: true, endpoint: subscription.endpoint };

      } catch (error) {
        console.error('Error sending to subscription:', error);
        
        // If subscription is invalid, remove it from database
        if (error.statusCode === 410) {
          console.log('Removing invalid subscription:', subscription.endpoint);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Push notifications sent',
        sent: successful,
        failed: failed,
        total: subscriptions.length
      })
    };

  } catch (error) {
    console.error('Error in push notification function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
