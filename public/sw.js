// Restoran paneli için minimal service worker.
// Bilinçli olarak HİÇBİR ŞEY önbelleğe almıyor: rezervasyon verisi canlı ve sık değişiyor,
// eski (stale) bir görünüm restoran personelini yanlış yönlendirebilir (örn. dolu bir saati
// boş gösterme). Bu dosyanın tek amacı, panelin telefonda "ana ekrana ekle" ile
// PWA gibi açılabilmesi için tarayıcının kurulabilirlik şartını sağlamak.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Kasıtlı olarak boş: her istek doğrudan ağa (network) gider, önbellekten karşılanmaz.
});
