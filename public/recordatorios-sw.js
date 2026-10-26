// Service worker de "Mi Día" (/recordatorios): funciona sin conexión y maneja los toques en las notificaciones.
const CACHE = "mi-dia-v2";
const ARCHIVOS = [
  "/recordatorios",
  "/recordatorios/styles.css",
  "/recordatorios/app.js",
  "/recordatorios/parser.js",
  "/recordatorios/datos.js",
  "/recordatorios/manifest.webmanifest",
  "/recordatorios/icon.svg",
  "/recordatorios/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Red primero (para recibir actualizaciones) y caché si no hay conexión
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/recordatorios")) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname === "/recordatorios/" ? "/recordatorios" : e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/recordatorios"))),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = e.notification.data?.url || "/recordatorios";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => new URL(v.url).pathname.startsWith("/recordatorios"));
      if (abierta) {
        abierta.postMessage({ tipo: "repaso" });
        return abierta.focus();
      }
      return self.clients.openWindow(destino);
    }),
  );
});
