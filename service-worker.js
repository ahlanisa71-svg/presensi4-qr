const CACHE_NAME = 'niszar-cache-v2';
const ASET = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(ASET.map(function(url){
        return cache.add(url).catch(function(err){
          console.log('Gagal cache:', url, err);
        });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  // Permintaan navigasi (membuka halaman) -> selalu jatuhkan ke index.html versi cache saat offline
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(function(resp){
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put('./index.html', respClone); });
        return resp;
      }).catch(function(){
        return caches.match('./index.html').then(function(cached){
          return cached || caches.match('./');
        });
      })
    );
    return;
  }

  // Permintaan file lain (CSS/JS/gambar dsb jika ada)
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(resp){
        if(resp && resp.status === 200){
          var respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, respClone); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
