// ============================================================================
// The Diet Cascade — Admin Web Push Service Worker
// Handles incoming VAPID push messages and notification tap deep-linking.
// ============================================================================

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let payload = {
        title: 'The Diet Cascade — Admin Alert',
        body: 'You have client diet plan updates requiring attention.',
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        tag: 'tdc-admin-reminder',
        url: '/admin/clients?filter=revision_due',
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            payload = { ...payload, ...parsed };
        } catch {
            const rawText = event.data.text();
            if (rawText) payload.body = rawText;
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon || '/images/logo.png',
        badge: payload.badge || '/images/logo.png',
        tag: payload.tag || 'tdc-admin-reminder',
        renotify: true,
        requireInteraction: Boolean(payload.requireInteraction),
        data: {
            url: payload.url || '/admin/clients',
        },
        actions: Array.isArray(payload.actions)
            ? payload.actions
            : [
                  { action: 'open', title: 'Open Admin' },
                  { action: 'dismiss', title: 'Dismiss' },
              ],
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const relativeOrFullUrl = event.notification?.data?.url || '/admin/clients';
    const targetUrl = new URL(relativeOrFullUrl, self.location.origin).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    try {
                        const clientUrl = new URL(client.url);
                        if (
                            clientUrl.origin === self.location.origin &&
                            clientUrl.pathname.startsWith('/admin')
                        ) {
                            if ('navigate' in client) {
                                return client.navigate(targetUrl).then((c) => c && c.focus());
                            }
                            return client.focus();
                        }
                    } catch {
                        // Ignore malformed client URLs
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
                return null;
            })
    );
});
