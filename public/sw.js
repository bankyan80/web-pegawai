const CACHE = 'timker-v1';
const CORE = [
  '/',
  '/?hal=home',
  '/?hal=aboutus',
  '/?hal=form_login',
  '/css/bootstrap.min.css',
  '/css/theme.css',
  '/fontawesome/css/all.css',
  '/js/jquery.min.js',
  '/js/popper.min.js',
  '/js/bootstrap.min.js',
  '/js/kep.js',
  '/images/logokab.png',
  '/images/no_photo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/controller/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/?hal=home'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
