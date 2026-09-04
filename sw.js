/**
 * GoalGetten 🎯 Service Worker (PWA Auto-Update & Offline Caching)
 */

const CACHE_NAME = 'goalgetten-v6.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=6.1',
  './css/animations.css?v=6.1',
  './icons/icon.svg',
  './js/storage.js?v=6.1',
  './js/gamification.js?v=6.1',
  './js/auth.js?v=6.1',
  './js/ai-coach.js?v=6.1',
  './js/projects.js?v=6.1',
  './js/todoist.js?v=6.1',
  './js/gcal.js?v=6.1',
  './js/app.js?v=6.1'
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
