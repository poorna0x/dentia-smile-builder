// Service Worker for caching and performance optimization
const CACHE_NAME = 'jeshna-dental-v1';
const STATIC_CACHE_NAME = 'jeshna-dental-static-v1';
const DYNAMIC_CACHE_NAME = 'jeshna-dental-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/logo.png'
];

// Assets to cache on demand
const CACHE_PATTERNS = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp)$/,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Cache strategy for different types of assets
  if (isStaticAsset(request.url)) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // API requests - Network First strategy
    event.respondWith(networkFirst(request));
  } else if (isHTMLRequest(request)) {
    // HTML requests - Network First with fallback
    event.respondWith(networkFirstWithFallback(request));
  } else {
    // Other requests - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache First strategy - for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a fallback response for critical assets
    if (request.url.includes('.js') || request.url.includes('.css')) {
      return new Response('/* Fallback content */', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    throw error;
  }
}

// Network First strategy - for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First with fallback - for HTML requests
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return the main page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw error;
  }
}

// Stale While Revalidate - for other requests
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticAsset(url) {
  return CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isAPIRequest(url) {
  return url.includes('/api/') || url.includes('supabase') || url.includes('netlify');
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('Background sync triggered');
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
