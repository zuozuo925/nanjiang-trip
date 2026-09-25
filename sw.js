const CACHE_NAME = 'nanjiang-trip-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('缓存核心资源');
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
            console.log('清理旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 缓存优先，网络兜底
self.addEventListener('fetch', function(event) {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(function(response) {
        // 缓存命中，直接返回
        if (response) {
          return response;
        }
        // 缓存未命中，网络请求
        return fetch(event.request).then(function(response) {
          // 检查是否有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // 克隆响应并缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(function() {
          // 网络失败，尝试返回缓存的首页
          return caches.match('./index.html');
        });
      })
  );
});