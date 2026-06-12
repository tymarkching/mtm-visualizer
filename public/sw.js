/**
 * Tymark Visualizer Studio Service Worker
 * Offline-capable Progressive Web App caching strategy.
 * Uses a Stale-While-Revalidate strategy to allow offline boots
 * while updating cache assets automatically in the background.
 */

const CACHE_NAME = 'tymark-visualizer-v1';

// Direct cache entry points for the root and manifest
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// On Service Worker installation, preload static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching static skeleton app assets...');
      return cache.addAll(STATIC_RESOURCES);
    }).then(() => self.skipWaiting())
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleared obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Dynamic Intercept Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Focus only on caching local assets (same origin) and exclude external dev hot-reloads
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // Guard responses before storing (only standard success states and GET requests)
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('[Service Worker] Resource offline fetch failed:', err);
          });

          // Return cached resource immediately if available, fallback to live network fetch
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
