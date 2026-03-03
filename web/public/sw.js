// Xpace On — Service Worker com estratégia offline
// =================================================
const CACHE_NAME = 'xpace-v1';
const OFFLINE_URL = '/offline.html';

// Assets críticos para cache no install
const CRITICAL_ASSETS = [
    '/',
    '/offline.html',
    '/favicon.ico',
];

// --- INSTALL: pré-cache de assets críticos ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CRITICAL_ASSETS))
    );
    self.skipWaiting();
});

// --- ACTIVATE: limpa caches antigas ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// --- FETCH: estratégia por tipo de request ---
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignora requests não-GET e Chrome Extensions
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // Ignora requests de API e Supabase (sempre rede)
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request).catch(() =>
                new Response(JSON.stringify({ error: 'Offline' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503,
                })
            )
        );
        return;
    }

    // Imagens: Cache First (com fallback)
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Navegação: Network First, fallback para /offline.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
                )
        );
        return;
    }

    // Default: Stale-While-Revalidate (JS/CSS/fontes)
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
            return cached || fetchPromise;
        })
    );
});

// --- PUSH NOTIFICATIONS ---
self.addEventListener('push', (event) => {
    let data = { title: 'XPACE ON', body: 'Nova atualização!', icon: '/favicon.ico', url: '/' };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/favicon.ico',
            badge: '/favicon.ico',
            data: { url: data.url || '/' },
            tag: 'xpace-notification',
        })
    );
});

// --- NOTIFICATION CLICK ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Tenta focar uma aba já aberta
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Abre nova aba
            return clients.openWindow(targetUrl);
        })
    );
});
