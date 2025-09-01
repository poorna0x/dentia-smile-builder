// Service Worker for Push Notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);

  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push notification data:', data);

    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/favicon.png',
      badge: data.badge || '/favicon.png',
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open Admin',
          icon: '/favicon.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/favicon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Appointment', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('New Appointment', {
        body: 'A new appointment has been booked',
        icon: '/favicon.png',
        badge: '/favicon.png'
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open admin page when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if admin page is already open
        for (let client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new admin page
        if (clients.openWindow) {
          return clients.openWindow('/admin');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
});
