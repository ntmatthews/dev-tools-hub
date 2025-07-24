/**
 * Hyperforge Labs Developer Tools Hub v2.0
 * Service Worker for Progressive Web App functionality
 */

const CACHE_NAME = 'hyperforge-dev-tools-v2.0';
const CACHE_VERSION = '2.0.0';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/index-v2.html',
    '/css/styles.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/api-service.js',
    '/js/theme-manager.js',
    '/js/uuid.js',
    '/js/base64.js',
    '/js/password-checker.js',
    '/js/json-formatter.js',
    '/js/hash-calculator.js',
    '/js/qr-generator.js',
    '/js/ping-test.js',
    '/manifest.json',
    '/favicon.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('🔧 Service Worker: Caching files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('🔧 Service Worker: All files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('🔧 Service Worker: Cache failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🔧 Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('🔧 Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external URLs
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response before caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return a simple offline response for other requests
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for API requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔧 Service Worker: Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

// Push notification support
self.addEventListener('push', (event) => {
    console.log('🔧 Service Worker: Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: '/favicon.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/favicon.svg'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Hyperforge Dev Tools', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔧 Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper function for background sync
async function doBackgroundSync() {
    try {
        // Sync any pending data
        const pending = await getStoredRequests();
        
        for (const request of pending) {
            try {
                await fetch(request.url, request.options);
                await removeStoredRequest(request.id);
            } catch (error) {
                console.error('🔧 Service Worker: Failed to sync request', error);
            }
        }
        
        console.log('🔧 Service Worker: Background sync completed');
    } catch (error) {
        console.error('🔧 Service Worker: Background sync failed', error);
    }
}

// Helper functions for request storage
async function getStoredRequests() {
    // In a real implementation, you'd use IndexedDB
    return [];
}

async function removeStoredRequest(id) {
    // In a real implementation, you'd remove from IndexedDB
    return Promise.resolve();
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('🔧 Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_VERSION,
            cacheName: CACHE_NAME
        });
    }
});

// Periodically clean up old data
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cleanup') {
        event.waitUntil(cleanupOldData());
    }
});

async function cleanupOldData() {
    try {
        // Clean up old cached data
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
            name.startsWith('hyperforge-dev-tools-') && name !== CACHE_NAME
        );
        
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        
        console.log('🔧 Service Worker: Cleanup completed');
    } catch (error) {
        console.error('🔧 Service Worker: Cleanup failed', error);
    }
}

console.log('🔧 Service Worker: Loaded successfully');
