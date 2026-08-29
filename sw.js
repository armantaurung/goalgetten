/**
 * GoalGetten 🎯 Service Worker (PWA Auto-Update & Offline Caching)
 */

const CACHE_NAME = 'goalgetten-v5.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=5.0',
  './css/animations.css?v=5.0',
  './icons/icon.svg',
  './js/storage.js?v=5.0',
  './js/gamification.js?v=5.0',
  './js/auth.js?v=5.0',
  './js/ai-coach.js?v=5.0',
  './js/app.js?v=5.0'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache Assets warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old service worker cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass caching for remote APIs (Supabase, Gemini, Google CDN)
  if (url.origin.includes('supabase.co') || url.origin.includes('googleapis.com') || url.origin.includes('generativelanguage')) {
    return;
  }

  // Network-First strategy with Cache Fallback for instant fresh mobile/desktop loading
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
