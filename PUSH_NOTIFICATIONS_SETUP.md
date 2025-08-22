# Push Notifications Setup Guide

This guide explains how to set up real-time push notifications for the appointment booking system.

## Overview

The push notification system will send real-time notifications to admin users when:
- New appointments are booked
- Appointment status changes
- Time slots are disabled/enabled

## Prerequisites

1. **VAPID Keys**: You need to generate VAPID (Voluntary Application Server Identification) keys
2. **Service Worker**: Already implemented in `/public/sw.js`
3. **Database Table**: Push subscriptions table (see `supabase/push-subscriptions.sql`)

## Step 1: Generate VAPID Keys

### Option A: Using web-push library (Recommended)

```bash
npm install web-push
npx web-push generate-vapid-keys
```

This will output:
```
=======================================
Public Key:
BPHh...

Private Key:
...
=======================================
```

### Option B: Online VAPID Key Generator

Visit: https://web-push-codelab.glitch.me/

## Step 2: Add VAPID Keys to Environment Variables

Add to your `.env.local` file:

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VITE_VAPID_PRIVATE_KEY=your_private_key_here
```

## Step 3: Create Database Table

Run the SQL in `supabase/push-subscriptions.sql` in your Supabase dashboard:

```sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Server-Side Implementation

### Option A: Netlify Functions (Recommended for Netlify)

Create `netlify/functions/send-push.js`:

```javascript
const webpush = require('web-push');

const vapidKeys = {
  publicKey: process.env.VITE_VAPID_PUBLIC_KEY,
  privateKey: process.env.VITE_VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { subscription, data } = JSON.parse(event.body);
    
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url,
      appointmentId: data.appointmentId
    });

    await webpush.sendNotification(subscription, payload);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notification' })
    };
  }
};
```

### Option B: Supabase Edge Functions

Create `supabase/functions/send-push/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import webpush from 'https://esm.sh/web-push@3.6.6'

const vapidKeys = {
  publicKey: Deno.env.get('VITE_VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VITE_VAPID_PRIVATE_KEY')!
}

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { subscription, data } = await req.json()
    
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url,
      appointmentId: data.appointmentId
    })

    await webpush.sendNotification(subscription, payload)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## Step 5: Update Environment Variables

### For Netlify:

Add to Netlify environment variables:
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_VAPID_PRIVATE_KEY`

### For Supabase:

Add to Supabase secrets:
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_VAPID_PRIVATE_KEY`

## Step 6: Test Push Notifications

1. **Enable notifications** in your browser
2. **Visit the appointment page** - this will register for push notifications
3. **Book a test appointment** - this should trigger a push notification
4. **Check the notification** appears on your device

## Step 7: Troubleshooting

### Common Issues:

1. **"Push notifications not supported"**
   - Ensure HTTPS is enabled
   - Check if service worker is registered

2. **"Notification permission denied"**
   - User must manually enable notifications
   - Check browser settings

3. **"VAPID keys not found"**
   - Verify environment variables are set
   - Check key format (no extra spaces)

4. **"Service worker not found"**
   - Ensure `/public/sw.js` exists
   - Check service worker registration

### Debug Steps:

1. **Check browser console** for errors
2. **Verify service worker** is active in DevTools
3. **Test VAPID keys** using web-push test tools
4. **Check network requests** for push notification calls

## Step 8: Production Considerations

1. **Rate Limiting**: Implement rate limiting for push notifications
2. **Error Handling**: Handle failed notifications gracefully
3. **Subscription Management**: Clean up invalid subscriptions
4. **Monitoring**: Monitor notification delivery rates
5. **User Preferences**: Allow users to opt out of notifications

## Alternative: Firebase Cloud Messaging

For easier implementation, consider using Firebase Cloud Messaging:

1. **Create Firebase project**
2. **Add Firebase SDK** to your app
3. **Use Firebase messaging** instead of web-push
4. **Simpler setup** but requires Firebase account

## Files Modified

- `src/pages/Appointment.tsx` - Added push notification setup
- `public/sw.js` - Service worker for handling notifications
- `src/lib/push-notifications.ts` - Push notification utilities
- `src/lib/web-push.ts` - Web push implementation
- `supabase/push-subscriptions.sql` - Database schema

## Next Steps

1. **Deploy the changes**
2. **Test on mobile devices**
3. **Monitor notification delivery**
4. **Add user notification preferences**
5. **Implement notification history**

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test with different browsers/devices
4. Check service worker registration status
