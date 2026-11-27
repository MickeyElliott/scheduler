/* Daily Study service worker (scope: /scheduler/study/).
   App shell + study data are cached on first load so the app works offline afterwards.
   Pages: network-first (updates land right away). data.json is versioned (?v=) and cache-first. */
const VERSION = 'ds-513189e7-30c4c8aa44';
const SHELL = ['./', './index.html', './data.json?v=30c4c8aa44', './manifest.webmanifest',
  '../icons/study-180.png', '../icons/study-192.png', '../icons/study-512.png', '../icons/study-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ds-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const inScope = url.pathname.startsWith(new URL('./', self.registration.scope).pathname);
  if (req.mode === 'navigate' || (inScope && /(\/|\.html|\.webmanifest)$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(url.origin + url.pathname, copy)); } return res; })
      .catch(() => caches.match(url.origin + url.pathname).then(r => r || caches.match('./index.html')).then(r => r || caches.match('./')).then(r => r || new Response('Offline', { status: 503 }))));
    return;
  }
  /* versioned data + icons: cache first */
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
});
