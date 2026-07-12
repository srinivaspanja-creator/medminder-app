const CACHE_NAME = 'mymedminder-v2';

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      return new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
      });
    })
  );
});