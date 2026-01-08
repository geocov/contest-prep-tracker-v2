const CACHE = "cpt-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if(cached) return cached;
    try {
      const res = await fetch(e.request);
      const cache = await caches.open(CACHE);
      cache.put(e.request, res.clone());
      return res;
    } catch {
      return caches.match("./index.html");
    }
  })());
});
