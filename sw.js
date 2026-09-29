// Guarda la app en el celular para que abra aunque no haya internet.
// Si cambias fotos o mensajes, sube el número de versión.
const CACHE = "para-mama-v6";
const BASE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "fotos/mama-y-yo.jpg", "fotos/perrita.jpg", "musica/cancion.mp3"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Responde primero con lo guardado y actualiza en segundo plano
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(e.request, { ignoreSearch: true });
      const red = fetch(e.request)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => guardado || cache.match("index.html"));
      return guardado || red;
    })
  );
});
