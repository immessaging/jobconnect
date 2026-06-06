// ============================================
// JOBCONNECT NIGERIA - SERVICE WORKER
// ============================================
const CACHE_NAME = 'jobconnect-v2';
const DYNAMIC_CACHE = 'jobconnect-dynamic-v2';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/job_connect_logo.png',
  '/src/main.jsx'
];

// ============================================
// INSTALL EVENT - Cache static assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.log('❌ Cache failed:', err);
      })
  );
});

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH EVENT - Network first, cache fallback
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // API calls - Network first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'You are offline. Please check your connection.' 
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Static assets & pages - Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version immediately
          // Then update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, networkResponse.clone());
                  });
              }
            })
            .catch(() => {
              // Network failed, cached version is fine
            });
          
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache the response for later
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, clonedResponse);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Both cache and network failed
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then((offlineResponse) => {
                  return offlineResponse || new Response(
                    `<html>
                      <body style="font-family:Arial;text-align:center;padding:50px;background:#0a1628;color:#d4a843;">
                        <h1>📡 You're Offline</h1>
                        <p>Please check your internet connection.</p>
                        <button onclick="location.reload()" style="padding:10px 20px;background:#d4a843;color:#0a1628;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">
                          🔄 Retry
                        </button>
                      </body>
                    </html>`,
                    {
                      status: 200,
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            // For non-navigation requests, return error
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

// ============================================
// PUSH NOTIFICATION
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification from JobConnect',
    icon: '/job_connect_logo.png',
    badge: '/job_connect_logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'JobConnect Nigeria',
      options
    )
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Sync pending messages when back online
      console.log('🔄 Background sync: messages')
    );
  }
});

// ============================================
// MESSAGE FROM MAIN THREAD
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
});