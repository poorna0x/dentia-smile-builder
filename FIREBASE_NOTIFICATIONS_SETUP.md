# Firebase Cloud Messaging Setup Guide

This guide explains how to set up **cross-platform push notifications** that work on both **iPhone and Android** using Firebase Cloud Messaging (FCM).

## 🎯 **Why Firebase is Better for Cross-Platform**

### **iPhone (iOS) Support:**
- ✅ **Background notifications** - Works even when app is closed
- ✅ **System notifications** - Appears in iOS notification center
- ✅ **Safari support** - Works in Safari browser
- ✅ **Native-like experience** - Similar to native iOS apps

### **Android Support:**
- ✅ **Full background support** - Complete Android notification support
- ✅ **System integration** - Integrates with Android notification system
- ✅ **Reliable delivery** - Google's infrastructure ensures delivery
- ✅ **Rich notifications** - Support for actions, images, etc.

## 📋 **Prerequisites**

1. **Firebase Project** - Create a Firebase project
2. **Firebase SDK** - Install Firebase dependencies
3. **Service Account** - Get Firebase service account key
4. **Web App Configuration** - Configure Firebase for web

## 🚀 **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `dentia-appointments`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

## 🔧 **Step 2: Add Web App to Firebase**

1. In Firebase Console, click **"Add app"** → **"Web"**
2. Enter app nickname: `Dentia Web App`
3. Click **"Register app"**
4. Copy the Firebase config object

## 📦 **Step 3: Install Firebase Dependencies**

```bash
npm install firebase
```

## 🔑 **Step 4: Configure Environment Variables**

Add to your `.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase VAPID Key (for web push)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

## 🔐 **Step 5: Get Firebase VAPID Key**

1. In Firebase Console, go to **Project Settings**
2. Click **"Cloud Messaging"** tab
3. Scroll to **"Web configuration"**
4. Click **"Generate key pair"**
5. Copy the **Web Push certificates** key

## 🗄️ **Step 6: Create Database Table**

Run the SQL in `supabase/fcm-tokens.sql` in your Supabase dashboard:

```sql
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 **Step 7: Update Firebase Service Worker**

Update `public/firebase-messaging-sw.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 🚀 **Step 8: Server-Side Implementation**

### **Option A: Netlify Functions**

Create `netlify/functions/send-firebase-notification.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, data, platform } = JSON.parse(event.body);
    
    const message = {
      token: token,
      notification: {
        title: data.title,
        body: data.body
      },
      data: {
        url: data.url || '/admin',
        appointmentId: data.appointmentId || ''
      },
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          actions: [
            {
              action: 'view',
              title: 'View Appointment'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      }
    };

    const response = await admin.messaging().send(message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response })
    };
  } catch (error) {
    console.error('Error sending Firebase notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notification' })
    };
  }
};
```

### **Option B: Supabase Edge Functions**

Create `supabase/functions/send-firebase-notification/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import admin from 'https://esm.sh/firebase-admin@11.5.0'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { token, data, platform } = await req.json()
    
    const message = {
      token: token,
      notification: {
        title: data.title,
        body: data.body
      },
      data: {
        url: data.url || '/admin',
        appointmentId: data.appointmentId || ''
      },
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          actions: [
            {
              action: 'view',
              title: 'View Appointment'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      }
    }

    const response = await admin.messaging().send(message)
    
    return new Response(JSON.stringify({ success: true, messageId: response }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error sending Firebase notification:', error)
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## 🔑 **Step 9: Get Firebase Service Account**

1. In Firebase Console, go to **Project Settings**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. Add the JSON content to environment variables as `FIREBASE_SERVICE_ACCOUNT`

## 📱 **Step 10: Test on Both Platforms**

### **iPhone Testing:**
1. **Open Safari** on iPhone
2. **Visit your app** and enable notifications
3. **Book an appointment** from another device
4. **Check notification** appears on iPhone

### **Android Testing:**
1. **Open Chrome** on Android
2. **Visit your app** and enable notifications
3. **Book an appointment** from another device
4. **Check notification** appears in Android notification tray

## 🔍 **Step 11: Troubleshooting**

### **Common Issues:**

1. **"Firebase not initialized"**
   - Check Firebase config in service worker
   - Verify environment variables are set

2. **"Permission denied"**
   - User must manually enable notifications
   - Check browser settings

3. **"Token not generated"**
   - Verify VAPID key is correct
   - Check Firebase project configuration

4. **"Notifications not appearing"**
   - Check service worker is registered
   - Verify Firebase messaging is initialized

### **Debug Steps:**

1. **Check browser console** for Firebase errors
2. **Verify FCM tokens** are saved to database
3. **Test with Firebase console** - send test message
4. **Check network requests** for notification calls

## 📊 **Step 12: Monitor & Analytics**

### **Firebase Console:**
- **Analytics** - Track notification engagement
- **Crashlytics** - Monitor app crashes
- **Performance** - Monitor notification delivery

### **Custom Analytics:**
- Track notification open rates
- Monitor user engagement
- Analyze notification effectiveness

## 🎯 **Expected Results**

### **iPhone:**
- ✅ **Background notifications** when app is closed
- ✅ **System notifications** in iOS notification center
- ✅ **Safari integration** for web app
- ✅ **Native-like experience**

### **Android:**
- ✅ **Full background support** when app is closed
- ✅ **System integration** with Android notifications
- ✅ **Rich notifications** with actions
- ✅ **Reliable delivery** via Google infrastructure

## 📁 **Files Created/Modified**

- ✅ `src/lib/firebase-notifications.ts` - Firebase notification utilities
- ✅ `public/firebase-messaging-sw.js` - Firebase service worker
- ✅ `supabase/fcm-tokens.sql` - Database schema for FCM tokens
- ✅ `FIREBASE_NOTIFICATIONS_SETUP.md` - This setup guide

## 🚀 **Next Steps**

1. **Deploy the changes**
2. **Test on real devices** (iPhone and Android)
3. **Monitor notification delivery**
4. **Add notification preferences**
5. **Implement notification analytics**

## 💡 **Pro Tips**

1. **Test on real devices** - Simulators may not work properly
2. **Use HTTPS** - Required for service workers
3. **Handle errors gracefully** - Notifications may fail
4. **Respect user preferences** - Allow opt-out
5. **Monitor performance** - Track delivery rates

## 🆘 **Support**

For issues:
1. Check Firebase Console for errors
2. Verify all environment variables
3. Test on different browsers/devices
4. Check service worker registration
5. Review Firebase documentation

---

**This Firebase implementation will provide true cross-platform push notifications that work reliably on both iPhone and Android!** 🎉📱
