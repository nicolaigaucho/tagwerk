/* Service Worker: offline nutzbar und Push-Mitteilungen. */
const CACHE = 'tagwerk-v9';
const SHELL = ['./', 'index.html', 'app.css', 'config.js', 'js/supabase.js', 'js/store.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request, {cache: 'no-cache'}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch { d = {body: e.data?.text() || ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tagwerk', {body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'tagwerk-daily'}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
