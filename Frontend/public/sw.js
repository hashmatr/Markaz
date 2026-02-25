const CACHE_NAME = 'markaz-v1';
const STATIC_CACHE = 'markaz-static-v1';
const DYNAMIC_CACHE = 'markaz-dynamic-v1';
const API_CACHE = 'markaz-api-v1';

// Static assets to pre-cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// Install event - pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        // Only cache safe GET endpoints
        const cacheableAPIs = [
            '/api/products',
            '/api/categories',
            '/api/flash-sales/active',
            '/api/sellers',
        ];

        const shouldCache = cacheableAPIs.some(api => url.pathname.startsWith(api));

        if (shouldCache) {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(API_CACHE).then((cache) => {
                            cache.put(request, clone);
                        });
                        return response;
                    })
                    .catch(() => caches.match(request))
            );
        }
        return;
    }

    // Static assets - Cache first, network fallback
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(request)
                .then((cached) => {
                    if (cached) return cached;

                    return fetch(request).then((response) => {
                        // Only cache successful responses
                        if (!response || response.status !== 200) return response;

                        const clone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, clone);
                        });
                        return response;
                    });
                })
        );
    }
});

// Background Sync for offline cart
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
});

async function syncCart() {
    // Attempt to sync cart data when back online
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'CART_SYNCED' });
        });
    } catch (err) {
        console.error('Cart sync failed:', err);
    }
}

// Push notifications (future use)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const options = {
        body: data.body || 'Check out the latest deals on Markaz!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Markaz', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
