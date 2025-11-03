const CACHE_NAME = 'employees-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll failed:', error);
        // Не блокируем установку, если некоторые ресурсы не закэшированы
      })
  );
  // Принудительно активируем новый Service Worker сразу после установки
  self.skipWaiting();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем из кеша или загружаем из сети
        return response || fetch(event.request);
      })
      .catch(() => {
        // Если нет в кеше и сеть недоступна, можно вернуть fallback
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Активация и очистка старых кешей
self.addEventListener('activate', (event) => {
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
    }).then(() => {
      // Берём контроль над всеми страницами сразу
      return self.clients.claim();
    })
  );
});

