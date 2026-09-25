const CACHE_NAME = 'nanjiang-trip-v7';
const urlsToCache = [
  './manifest.json',
  './sw.js'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  // HTML导航请求：永远从网络拿最新版，绕过HTTP缓存和SW缓存
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .then(function(response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put('./index.html', copy);
          });
          return response;
        })
        .catch(function() {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 其他资源：缓存优先
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(function(response) {
        if (response) return response;
        return fetch(event.request).then(function(response) {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copy);
          });
          return response;
        }).catch(function() {
          return caches.match('./index.html');
        });
      })
  );
});
