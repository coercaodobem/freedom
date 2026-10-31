'use strict';
const CACHE = 'property-shell-v10';
const SHELL = ['./', './index.html', './about.html', './styles.css?v=property-v10', './app.js?v=property-v10', './vault.js?v=property-v10', './routing.js?v=property-v10', './forwarding.js?v=property-v10', './nano.js?v=property-v10', './money.js?v=property-v10', './marketplace.js?v=property-v10', './campaigns.js?v=property-v10', './contact.js?v=property-v10', './manifest.webmanifest?v=property-v10', './assets/icon.svg?v=property-v10', './vendor/nostr-tools-2.25.2.bundle.js?v=property-v10'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(path, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^(?:property|liberdade)-shell-/.test(key) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
