// Service worker do Carteira Prime.
// Estratégia: stale-while-revalidate no app shell — abre instantâneo do cache e
// atualiza os arquivos em segundo plano; a nova versão vale na próxima abertura.
// Os dados ficam no localStorage (fora do cache), então atualizar o código nunca apaga nada.

const CACHE = "carteira-prime-v16";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./budget-data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./fonts/archivo.css",
  "./fonts/archivo-1.woff2",
  "./fonts/archivo-2.woff2",
  "./fonts/archivo-3.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fromNetwork = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fromNetwork;
      }),
    ),
  );
});
