/* Only the empty application shell and same-origin static assets. APIs are never cached. */
const CACHE='asad-shell-offline-v1';
const safeAsset=r=>r.ok&&r.type!=='opaque'&&new URL(r.url).origin===self.location.origin&&!r.headers.get('content-type')?.includes('text/html');
const shell=async r=>r.ok&&new URL(r.url).origin===self.location.origin&&new URL(r.url).pathname==='/'&&r.headers.get('content-type')?.includes('text/html')&&(await r.clone().text()).includes('data-asad-shell=');
const asset=url=>url.origin===self.location.origin&&(/\.(js|css|woff2?|svg|png|ico)$/.test(url.pathname))&&!url.pathname.startsWith('/api/');
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('message',event=>{if(event.data==='CLEAR_SHELL')event.waitUntil(caches.delete(CACHE));});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(req.mode==='navigate'&&url.pathname==='/')event.respondWith((async()=>{try{const r=await fetch(req);if(await shell(r)){const cache=await caches.open(CACHE);await cache.put('/',r.clone());}return r;}catch(error){const r=await caches.match('/');if(r)return r;throw error;}})());
 else if(asset(url))event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;const r=await fetch(req);if(safeAsset(r)){const cache=await caches.open(CACHE);await cache.put(req,r.clone());}return r;})());
});
self.addEventListener('message',event=>{if(event.data?.type==='WARM_SHELL')event.waitUntil((async()=>{const cache=await caches.open(CACHE);const page=await fetch('/');if(!await shell(page))return;await cache.put('/',page);const urls=new Set(event.data.resources.filter(value=>{try{return asset(new URL(value));}catch{return false;}}));await Promise.allSettled([...urls].map(async url=>{const r=await fetch(url);if(safeAsset(r))await cache.put(url,r);}));})());});
