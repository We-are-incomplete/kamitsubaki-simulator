const CACHE_NAME = 'kamitsubaki-simulator-cache-v2'; // キャッシュ名を変更して新しいサービスワーカーを強制的にインストール
const coreAssets = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/Cards/back1.png', // manifest.jsonで指定されているアイコン
  '/item/alpha.png',
  '/item/back.png',
  '/item/beta.png',
  '/item/dice1.png',
  '/item/dice2.png',
  '/item/dice3.png',
  '/item/dice4.png',
  '/item/dice5.png',
  '/item/dice6.png',
  '/item/omega.png',
  '/item/vol.png',
  '/item/wall.png',
  '/item/wall1.png',
  '/item/wall2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(coreAssets);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュに存在すればそれを返す
        if (response) {
          return response;
        }
        // キャッシュになければネットワークから取得し、キャッシュに追加してから返す
        return fetch(event.request).then(response => {
          // レスポンスが不正な場合（例: ネットワークエラー、Opaque Response）はキャッシュしない
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
