// Versioned per build via the `v` query param the client registers this script with
// (see src/main.tsx / __BUILD_ID__), so a redeploy gets a fresh cache name and `activate`
// below evicts every stale one instead of piling newly hashed assets into the same cache.
const CACHE = 'arema-launchboard-' + (new URL(self.location.href).searchParams.get('v') || 'dev');

// This SW's scope is the app's own base path (e.g. '/ITDconference/' — see BASE_URL in
// main.tsx), but on a shared `<user>.github.io` origin that scope can still see *navigation*
// requests for sibling content that isn't part of this app at all (e.g. '/ITDconference/brand/'
// or any other in-scope path that isn't this SPA's shell) — the fetch handler below must never
// treat those as "the app" and overwrite the cached shell with them.
const SCOPE = self.registration.scope;
const SCOPE_PATH = new URL(SCOPE).pathname;
const SHELL = new URL('index.html', SCOPE).toString();

const PRECACHE_URLS = [
  SCOPE,
  SHELL,
  new URL('fonts/Barlow-Regular.ttf', SCOPE).toString(),
  new URL('fonts/Barlow-Medium.ttf', SCOPE).toString(),
  new URL('fonts/Barlow-SemiBold.ttf', SCOPE).toString(),
];

// A single request failing to precache (e.g. a font 404ing for some reason) shouldn't sink
// the whole install — cache whichever of these succeed.
function addAllBestEffort(cache, urls) {
  return Promise.all(urls.map((url) => cache.add(url).catch(() => {})));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => addAllBestEffort(c, PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        // Only ever prune this app's own caches — this origin is shared with other apps
        // (`<user>.github.io/<other-repo>/...`), each of which may run its own SW with its
        // own cache names, and those must be left alone.
        keys.filter((k) => k.startsWith('arema-launchboard-') && k !== CACHE).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// The page asks us (once, after its own network load) to also cache whatever it fetched —
// the JS bundle, CSS, etc. — so a *first* online visit is enough to go offline afterward,
// not just the second one (install-time precache above only knows the shell + fonts, which
// are the same every build; hashed bundle filenames are only known to the already-loaded page).
self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {};
  if (type !== 'precache' || !Array.isArray(urls)) return;
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(
      urls.map((url) => fetch(url)
        .then((res) => { if (res.ok) return c.put(url, res); })
        .catch(() => {})),
    )),
  );
});

function isShellNavigation(url) {
  return url.pathname === SCOPE_PATH || url.pathname.endsWith('index.html');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // `ignoreVary: true` everywhere below: a couple of these entries are populated by a fetch
  // this SW made itself (the install-time precache, and the `precache` message handler
  // above) rather than by the browser re-issuing the *exact* request a page later makes for
  // the same URL (e.g. a module `<script crossorigin>` tag sends an `Origin` header that a
  // plain same-origin `fetch()` from the SW does not) — a dev/CORS-aware static server can
  // reasonably respond `Vary: Origin` to such a request, which would otherwise make a
  // same-URL cache lookup miss purely because of *how* it happened to be populated. These are
  // all content-hashed or otherwise single-representation files, so ignoring Vary is safe.
  const MATCH_OPTS = { ignoreVary: true };

  if (req.mode === 'navigate') {
    const shell = isShellNavigation(url);
    // Network first so a redeploy is picked up; only a successful response to the shell
    // itself (scope root or an `index.html`) is written into the cached-shell slot — any
    // other in-scope navigation (a 404, a sibling static page, etc.) is left alone.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (shell && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, MATCH_OPTS).then((hit) => hit || caches.match(SHELL, MATCH_OPTS))),
    );
    return;
  }

  // Hashed build assets and fonts: cache first
  event.respondWith(
    caches.match(req, MATCH_OPTS).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
