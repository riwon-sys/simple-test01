// --- 버전 파라미터 읽기 (sw.js?v=XXXXX) ---
const VERSION = (() => {
  try { return new URL(self.location).searchParams.get('v') || 'v1'; }
  catch { return 'v1'; }
})();

const CACHE = `avgcalc-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 필요한 파일 캐시 + 즉시 대기 해제
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제 + 즉시 제어권
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// fetch 전략
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 내비게이션: 최신 우선(네트워크) → 실패 시 캐시
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // 정적 리소스: 캐시 우선 → 없으면 네트워크
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
