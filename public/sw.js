// Service worker for installability, an offline fallback page, and offline document creation.
//
// Online, every page load comes from the network, exactly as without this worker. A cached copy is
// used only when the network request actually fails, and only for the four create screens that
// work offline (they take their data from the device snapshot, not from this HTML). Server actions,
// RSC payloads and API responses are never cached.

const CACHE = "erp-static-v1";
const PAGES_CACHE = "erp-pages-v1";
const OFFLINE_URL = "/offline.html";
// Mirrored in lib/offline/snapshot.ts (OFFLINE_ROUTES).
const OFFLINE_PAGES = ["/sales/new", "/purchases/new", "/collections/new", "/payments/new"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = [CACHE, PAGES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** A signed-in, fully rendered page — never a redirect to /login or an error page. */
function isCacheablePage(response) {
  const type = response.headers.get("Content-Type") || "";
  return response.status === 200 && response.type === "basic" && !response.redirected && type.includes("text/html");
}

function isRedirect(response) {
  return response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400);
}

async function cacheAssets(html) {
  // Script/style/font URLs appear both as tags and (without the /_next/ prefix) inside the inline RSC data.
  const matches = html.match(/(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\<>`]+/g) || [];
  const urls = new Set(matches.map((match) => (match.startsWith("/_next/") ? match : `/_next/${match}`)));
  const cache = await caches.open(CACHE);
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        if (await cache.match(url)) return;
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // Best effort — a missing chunk only matters once offline.
      }
    }),
  );
}

async function storePage(path, response) {
  const pages = await caches.open(PAGES_CACHE);
  if (isRedirect(response)) {
    // Signed out: forget the page so a later offline visit can't show the previous session.
    await pages.delete(path);
    return;
  }
  if (!isCacheablePage(response)) return;
  const html = await response.clone().text();
  await pages.put(path, response);
  await cacheAssets(html);
}

/** Network first; the last good copy only when the network is unreachable. */
function offlinePageResponse(event, path) {
  return fetch(event.request)
    .then((response) => {
      const stored = storePage(path, response.clone()).catch(() => {});
      try {
        event.waitUntil(stored);
      } catch {
        // Lifetime extension refused — the write still runs while the worker is alive.
      }
      return response;
    })
    .catch(async () => {
      const cached = await caches.open(PAGES_CACHE).then((pages) => pages.match(path));
      return cached || caches.match(OFFLINE_URL);
    });
}

async function warmPages(paths) {
  for (const path of paths) {
    if (!OFFLINE_PAGES.includes(path)) continue;
    try {
      const response = await fetch(path, { credentials: "same-origin", redirect: "manual", headers: { Accept: "text/html" } });
      await storePage(path, response);
    } catch {
      // Offline or server unreachable — keep whatever copy exists.
    }
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm-offline-pages" && Array.isArray(data.paths)) event.waitUntil(warmPages(data.paths));
  if (data.type === "clear-offline-pages") event.waitUntil(caches.delete(PAGES_CACHE));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: always the network. Offline, the create screens come from their last good copy;
  // everything else gets the offline page.
  if (request.mode === "navigate") {
    if (OFFLINE_PAGES.includes(url.pathname)) {
      event.respondWith(offlinePageResponse(event, url.pathname));
      return;
    }
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Hashed build assets never change for a given URL, so cache-first is safe.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
