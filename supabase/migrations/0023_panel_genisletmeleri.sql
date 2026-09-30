-- Restoran sahibinin elle seçebildiği fiyat seviyesi (1=₺ .. 4=₺₺₺₺). Boşsa
-- ortalama fiyat metninden otomatik çıkarılmaya devam eder (bkz. lib/format.ts).
alter table restoranlar add column fiyat_seviyesi smallint check (fiyat_seviyesi between 1 and 4);

-- Bayram/özel gün istisnaları: haftalık çalışma saatlerini belirli bir tarih için geçersiz kılar.
-- JSON dizi: [{ "tarih": "2026-01-01", "kapali": true, "aciklama": "Yılbaşı" }, ...]
alter table restoranlar add column ozel_gunler text;

-- Grup rezervasyonu eşiği: bu kişi sayısı ve üzeri online rezervasyonlarda restorana
-- ekstra uyarı gösterilir (panelde rozet).
alter table restoranlar add column grup_esigi integer;

-- Misafirin rezervasyon sırasında belirttiği alan tercihi (salon/bahçe/teras vb.);
-- kapasite hesabında zorunlu kısıt değil, restorana bilgi amaçlıdır.
alter table rezervasyonlar add column alan_tercihi text;

-- Panelde yeni rezervasyon geldiğinde zil ikonunun anlık güncellenebilmesi (ses uyarısı +
-- sayaç) için Realtime yayınına ekleniyor. Mevcut "rezervasyonlar_restoran_okur" RLS
-- politikası zaten bu değişiklikleri sadece ilgili restorana filtreliyor.
alter publication supabase_realtime add table rezervasyonlar;
