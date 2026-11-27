// Кэши оддии қолаби барнома: саҳифа бе интернет ҳам кушода мешавад (API кэш намешавад).
// Аввал шабака, баъд кэш. Файлҳои версиядор (app.js?v=…) — нусхаи кӯҳна аз кэш тоза мешавад.
const CACHE = 'codelab-v2';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './app.js', './styles.css', './fonts.css']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
async function remember(req, res) {
  const cc = await caches.open(CACHE);
  const u = new URL(req.url);
  if (u.search) for (const k of await cc.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) await cc.delete(k); }
  await cc.put(req, res);
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request)
    .then(r => { if (r.ok) remember(e.request, r.clone()).catch(() => {}); return r; })
    .catch(() => caches.match(e.request)
      .then(r => r || caches.match(e.request, { ignoreSearch: true }))
      .then(r => r || caches.match('./index.html'))));
});
