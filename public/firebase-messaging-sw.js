// Firebase Messaging Service Worker for Admin PWA
// This works on both iPhone and Android - Admin Only

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.data.title || 'Admin Notification';
  const notificationOptions = {
      body: payload.data.body || 'You have a new admin notification',
      icon: '/logo.png',
      badge: '/logo.png',
      data: {
        url: '/admin',
        appointmentId: payload.data.appointmentId
      },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/logo.png'
      }
    ],
    requireInteraction: true,
    tag: 'appointment-notification'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the admin page
    event.waitUntil(
      clients.openWindow('/admin')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open admin page
    event.waitUntil(
      clients.openWindow('/admin')
    );
  }
});
