/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Прекэш всех статических ресурсов сборки (инжектируется CRA/Workbox при билде)
precacheAndRoute(self.__WB_MANIFEST);

// SPA: все навигационные запросы отдаём через index.html
const fileExtRegexp = /\/[^/?]+\.[^/]+$/;
registerRoute(
    ({ request, url }: { request: Request; url: URL }) => {
        if (request.mode !== 'navigate') return false;
        if (url.pathname.startsWith('/api')) return false;
        if (url.pathname.match(fileExtRegexp)) return false;
        return true;
    },
    createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Статические ресурсы (изображения) — Stale While Revalidate
registerRoute(
    ({ url }: { url: URL }) =>
        url.origin === self.location.origin &&
        (url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')),
    new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [new ExpirationPlugin({ maxEntries: 50 })],
    })
);

// API GET — Network First, 10с таймаут, потом кэш
registerRoute(
    ({ url }: { url: URL }) => url.pathname.startsWith('/api'),
    new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
            new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 3600 }),
        ],
    }),
    'GET'
);

// API мутации — Background Sync (повтор при восстановлении сети)
const bgSyncPlugin = new BackgroundSyncPlugin('api-mutations', {
    maxRetentionTime: 24 * 60, // 24 часа
});

for (const method of ['POST', 'PUT', 'DELETE'] as const) {
    registerRoute(
        ({ url }: { url: URL }) => url.pathname.startsWith('/api'),
        new NetworkFirst({ plugins: [bgSyncPlugin] }),
        method
    );
}

// Обновление SW по команде от клиента
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
