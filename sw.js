// Guarda la app en el celular para que abra aunque no haya internet.
// Si cambias fotos o mensajes, sube el número de versión.
const CACHE = "para-mama-v7";
const BASE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "fotos/mama-y-yo.jpg", "fotos/perrita.jpg", "musica/cancion.mp3"];

self.addEventListener("install", (e) => {
  // cache: "reload" evita que se guarde una copia vieja del navegador
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.all(BASE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))
  ));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const esPagina = req.mode === "navigate" || /\.(html|js|json)$/.test(url.pathname);

  // La página y el código: primero internet (versión más nueva); si no hay, lo guardado
  if (esPagina && url.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
          return res;
        })
        .catch(async () => (await caches.match(req, { ignoreSearch: true })) || caches.match("./"))
    );
    return;
  }

  // Fotos, música y letras: lo guardado primero (rápido) y se actualiza en segundo plano
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: true });
      const red = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
