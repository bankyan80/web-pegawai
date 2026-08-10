const CACHE = 'timker-v8';
const CORE = [
  '/css/bootstrap.min.css',
  '/css/theme.css',
  '/css/dashboard.css',
  '/fontawesome/css/all.min.css',
  '/js/jquery.min.js',
  '/js/popper.min.js',
  '/js/bootstrap.min.js',
  '/js/kep.js',
  '/js/dashboard.js',
  '/images/logokab.png',
  '/images/no_photo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest'
];

const OFFLINE_PAGE = '/?hal=home';
const OFFLINE_ASSET = new Response('', { status: 504, statusText: 'Gateway Timeout' });

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

function cachePut(cacheName, request, response) {
  return caches.open(cacheName).then((cache) => cache.put(request, response));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/controller/')) return;
  // API selalu lewat jaringan: responsnya per-akun & no-store, tidak boleh
  // disajikan dari cache (bisa menampilkan data akun lain atau data basi).
  if (url.pathname.startsWith('/api/')) return;

  // Navigasi halaman: jaringan dulu, bila gagal pakai cache halaman
  // terakhir yang pernah dibuka, lalu halaman beranda, terakhir pesan luring.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            cachePut(CACHE, req, res.clone());
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) =>
            cached ||
            caches.match(OFFLINE_PAGE).then((home) =>
              home ||
              new Response('Luring. Periksa kembali koneksi internet Anda.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
              })
            )
          )
        )
    );
    return;
  }

  // Aset statis: sajikan dari cache bila ada, namun selalu validasi ulang dari
  // jaringan di latar belakang agar pembaruan kode langsung terpakai pada
  // kunjungan berikutnya (stale-while-revalidate).
  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req)
        .then(function (res) {
          if (res && res.status === 200) {
            cachePut(CACHE, req, res.clone());
          }
          return res;
        })
        .catch(function () {
          return cached || OFFLINE_ASSET;
        });
      return cached || network;
    })
  );
});
