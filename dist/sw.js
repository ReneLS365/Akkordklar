const CACHE='akkordklar-shell-v2-20261101-04';
const FILES=['./tally.mjs','./tally-view.mjs','./','./index.html','./styles.css','./app.mjs','./engine.mjs','./transport-v2.mjs','./project-store.mjs','./rule-data.mjs','./transport-visual.mjs','./transport-price.mjs','./transport-price-view.mjs','./calculators.mjs','./native-bridge.mjs','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./sources/HP3-Provinsen-2026.pdf','./sources/Hvidbog-2025.pdf'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of FILES){const response=await fetch(path,{cache:'reload'});if(!response.ok||response.redirected)throw new Error('Appfil kunne ikke hentes: '+path);await cache.put(path,response);}}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('akkordklar-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
  // Private auth/redirect pages must never replace the offline app shell.
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html')){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return response;}).catch(()=>caches.match('./index.html')));return;}
  if(!FILES.some(path=>new URL(path,self.location.href).pathname===url.pathname))return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok&&!response.redirected){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));
});
