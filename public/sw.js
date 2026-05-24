const CACHE_NAME = 'passeport-v1';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
];

// ---------- Install ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ---------- Activate — clean old caches ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ---------- Fetch strategies ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // 1. Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2. Cache-first for static assets (CSS, JS, images, fonts)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3. Stale-while-revalidate for pages (navigation requests)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request));
});

// ---------- Strategy helpers ----------

/**
 * Cache-first: serve from cache, fall back to network and cache the response.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

/**
 * Network-first: try the network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

/**
 * Stale-while-revalidate: return cache immediately, fetch fresh copy in background.
 * If nothing is cached, fetch from network; if that also fails, show offline page.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // If we have a cached version, return it and revalidate in background
  if (cached) {
    fetchPromise; // fire-and-forget revalidation
    return cached;
  }

  // Nothing cached — wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Completely offline with no cache — show offline page
  return caches.match(OFFLINE_URL);
}

// ---------- Push Notifications ----------

self.addEventListener('push', (event) => {
  let data = { title: 'PASSEPORT', body: '你有新的通知', url: '/notifications' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // Use defaults if payload parse fails
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    tag: data.url || 'default',
    data: { url: data.url },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: '查看' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// ---------- Utility ----------

function isStaticAsset(pathname) {
  return /\.(?:css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico)$/i.test(pathname)
    || pathname.startsWith('/_next/static/');
}
