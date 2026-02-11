const CACHE_NAME = "whack-a-mole-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./src/styles.css",
  "./src/index.js",
  "./manifest.webmanifest",

  // Images
  "./assets/park.png",
  "./assets/hole.png",
  "./assets/mole.png",
  "./assets/wmole.png",
  "./assets/mallet.png",
  "./assets/tmole.png",

  // Audio
  "./assets/song.mp3",
  "./assets/hit.mp3",
  "./assets/victory.mp3",
  "./assets/applause.mp3",
  "./assets/defeat.mp3",

  // Icons
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)),
        ),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
