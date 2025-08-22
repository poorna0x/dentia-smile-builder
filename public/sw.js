// Service Worker for Admin PWA
const CACHE_NAME = 'dentia-admin-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.webmanifest',
          '/logo.png'
        ]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.body || 'New appointment booked!',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/admin',
        appointmentId: data.appointmentId
      },
      actions: [
        {
          action: 'view',
          title: 'View Appointment',
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

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Appointment', options)
    );
  }
});

// Notification click event
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

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'appointment-sync') {
    event.waitUntil(
      // Handle offline appointment bookings
      console.log('Syncing offline appointments...')
    );
  }
});

// Fetch event - serve cached content when offline and redirect to admin
self.addEventListener('fetch', (event) => {
  // Redirect root URL to admin page for PWA
  if (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html')) {
    const adminUrl = new URL('/admin', event.request.url);
    event.respondWith(
      Response.redirect(adminUrl, 302)
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
