/**
 * Minimal offline shell: cache-first for static assets, network-first
 * for pages with an offline fallback to the last cached dashboard.
 */
const CACHE = "etp-shell-v2";
const STATIC_ASSETS = ["/", "/icons/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache auth or API traffic.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    // Immutable build assets: cache-first. Only cache successful
    // responses — a mid-deploy 404 must never be frozen into the
    // cache, or every later load of that chunk fails permanently.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages: network-first with cache fallback. Same rule: never cache
  // error responses, or the offline fallback would replay them.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/")))
  );
});
