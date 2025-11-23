// ====== 🔥 자동 업데이트 적용된 Service Worker ======

// 캐시 버전 — 배포될 때마다 자동 업데이트 강제됨
const CACHE_VERSION = "v3-" + Date.now();
const CACHE_NAME = `request-system-cache-${CACHE_VERSION}`;

// 캐싱할 파일
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-512.png",
];

// 설치 단계
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing…", CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  // 대기하지 않고 즉시 활성화
  self.skipWaiting();
});

// 활성화 단계 — 이전 캐시 자동 삭제
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated:", CACHE_NAME);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => {
            console.log("🗑 삭제된 캐시:", oldKey);
            return caches.delete(oldKey);
          })
      )
    )
  );

  // 모든 탭 즉시 새 SW 사용
  self.clients.claim();
});

// 네트워크 + 캐시 fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 최신 파일 캐싱
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 오프라인 fallback
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/index.html");
        });
      })
  );
});