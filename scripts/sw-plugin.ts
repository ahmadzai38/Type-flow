import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * Emits a tiny, dependency-free service worker at build time.
 *
 * - Precaches exactly the files produced by this build (no runtime cache growth).
 * - The cache name contains a hash of the file list, so every deploy gets a fresh
 *   cache and old caches are deleted on activation.
 * - Navigations are network-first (so updates arrive immediately when online)
 *   and fall back to the cached index.html when offline.
 * - There is no polling or background sync of any kind.
 */
export function serviceWorkerPlugin(): Plugin {
  return {
    name: 'typeflow-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'sw.js')
        .sort();
      const precache = ['./', './favicon.svg', './manifest.webmanifest', ...files.filter((f) => f !== 'index.html').map((f) => `./${f}`)];
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 12);
      const source = `/* TypeFlow service worker — generated at build time. */
const CACHE = 'typeflow-${version}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, self.registration.scope).toString())))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('typeflow-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(new URL('./', self.registration.scope).toString()).then((r) => r || Response.error()),
      ),
    );
    return;
  }

  event.respondWith(caches.match(req, { ignoreVary: true }).then((cached) => cached || fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
