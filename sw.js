/* excel2map Service Worker — cache-busting */
const CACHE_VERSION = "excel2map-v1";
const CACHE_NAME = CACHE_VERSION + "-" + self.registration?.scope || "excel2map";

// Assets to precache (relative to SW scope)
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon192.png",
  "./icon512.png",
];

// External CDN resources we also cache on first use
const CDN_PATTERNS = [
  /unpkg\.com\/leaflet/,
  /cdn\.sheetjs\.com/,
  /tile\.openstreetmap\.org/,
];

self.addEventListener("install", (event) => {
  // Activate immediately (cache-bust)
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE).catch((err) => {
        console.warn("[SW] precache partial failure", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches (brise-caches)
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("excel2map") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Network-first for navigation / HTML (always try fresh)
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for local static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for CDN / tiles
  const isCdn = CDN_PATTERNS.some((re) => re.test(url.href));
  if (isCdn) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || networkPromise || new Response("", { status: 504 });
      })
    );
  }
});

// Allow client to force cache clear
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
  }
});
