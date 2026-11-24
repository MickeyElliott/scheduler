/* App-shell service worker.
   - Pages, config.js and manifests: network-first, so updates land right away; cached copy only when offline.
   - Icons, fonts and the public supabase-js library: cached for offline starts.
   - Supabase API calls (and anything private) are never intercepted or cached here.
     Private study content lives in localStorage and is wiped on sign-out by the app itself. */
const VERSION = 'shell-v1';
const SHELL = ['./', './index.html', './meals.html', './config.js', './manifest.webmanifest', './meals.webmanifest',
  './icons/app-180.png', './icons/app-192.png', './icons/meals-180.png', './icons/meals-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== VERSION + '-cdn').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const PUBLIC_CDN = /^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/')) {
      const key = url.origin + url.pathname;   /* one entry per file: no ?query or #hash variants */
      e.respondWith(fetch(req).then(res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match(url.pathname.endsWith('meals.html') ? './meals.html' : './index.html') : undefined))
          .then(r => r || new Response('Offline', { status: 503 }))));
      return;
    }
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  if (PUBLIC_CDN.test(url.hostname)) {   /* stale-while-revalidate for public libraries and fonts */
    e.respondWith(caches.open(VERSION + '-cdn').then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
  /* everything else (Supabase REST/auth/realtime) goes straight to the network */
});
