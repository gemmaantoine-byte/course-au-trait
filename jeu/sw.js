// Course au trait – le jeu marche sans Internet une fois ouvert une première fois.
// Page du jeu : réseau d'abord (toujours la dernière version), sinon la copie gardée.
// Polices et icônes : copie gardée d'abord, mise à jour en arrière-plan.
const CACHE = 'cat-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.hostname.endsWith('workers.dev') || u.hostname.endsWith('stripe.com')) return;   // clés et paiement : jamais en cache
  const page = r.mode === 'navigate' || (u.origin === location.origin && (u.pathname.endsWith('/') || u.pathname.endsWith('.html')));
  if (page) {
    e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(u.pathname.endsWith('/') ? './' : r, cp)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('./') || caches.match('./index.html'))));
    return;
  }
  if (u.origin === location.origin || u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
