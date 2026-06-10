const CACHE_NAME = 'offline-v2';
const OFFLINE_URL = '/index.html';

// 安装：缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll([
                OFFLINE_URL,
                "/index.css",
                "/bootstrap-icons.min.css",
                "/dexie.min.js",
                "/streamsaver/StreamSaver.min.js",
                "/idbbackup.js",
                "/data.js",
                "/ui.js",
                "/song-search.js",
                "/settings.js",
                "/download.js",
                "/player.js",
                "/songlists.js",
                "/db.js",
                "/auth.js",
                "/onlinedb.js",
                "/api.js",
                "/favicon.svg",
                "/fonts/bootstrap-icons.woff2",
                "/streamsaver/mitm.html"
            ])
        )
    );
    self.skipWaiting(); // 立即生效
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim(); // 立刻接管页面
});

// 核心：Network First
self.addEventListener('fetch', event => {
    const req = event.request;

    if (req.method !== 'GET') return;

    event.respondWith(
        fetch(req)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(req, copy);
                });
                return res;
            })
            .catch(() => {
                return caches.match(req).then(res => {
                    if (res) return res;

                    if (req.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }

                    return new Response("Offline", {
                        status: 503,
                        headers: { "Content-Type": "text/plain" }
                    });
                });
            })
    );
});