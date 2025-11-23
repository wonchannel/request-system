// ----- 기본 캐시 이름 -----
const CACHE_NAME = "request-system-cache-v2";

// ----- 캐싱할 기본 파일들 -----
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-512.png"
];

// ----- 설치(install) 이벤트 -----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// ----- 활성화(activate) 이벤트 -----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// ----- fetch 요청을 캐시 + 네트워크 병행 -----
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/index.html") // 오프라인 대응
        )
      );
    })
  );
});