const CACHE_NAME = "scoundrel-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/main.js",
  "/src/logic/rng.js",
  "/src/logic/card.js",
  "/src/logic/deck.js",
  "/src/logic/state.js",
  "/src/logic/combat.js",
  "/src/logic/turn.js",
  "/src/logic/scoring.js",
  "/src/logic/commands.js",
  "/src/logic/daily.js",
  "/src/logic/variants.js",
  "/src/render/layout.js",
  "/src/render/card-renderer.js",
  "/src/render/board-renderer.js",
  "/src/render/hud-renderer.js",
  "/src/render/animation.js",
  "/src/render/particles.js",
  "/src/render/themes.js",
  "/src/render/screens/ui-helpers.js",
  "/src/render/screens/main-menu-screen.js",
  "/src/render/screens/game-over-screen.js",
  "/src/render/screens/high-score-screen.js",
  "/src/render/screens/stats-screen.js",
  "/src/render/screens/achievements-screen.js",
  "/src/render/screens/daily-screen.js",
  "/src/render/screens/variant-select-screen.js",
  "/src/render/screens/replay-screen.js",
  "/src/input/input-handler.js",
  "/src/audio/audio-manager.js",
  "/src/persist/storage-adapter.js",
  "/src/persist/high-scores.js",
  "/src/persist/stats.js",
  "/src/persist/achievements.js",
  "/src/persist/daily.js",
  "/src/persist/replay.js",
  "/manifest.json",
  "/assets/icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
