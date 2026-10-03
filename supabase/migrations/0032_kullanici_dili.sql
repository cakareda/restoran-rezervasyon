-- Misafirin tercih ettiği dil: kayıtta seçilir (ya da sayfa dilinden otomatik alınır),
-- profilden değiştirilebilir; e-posta ve WhatsApp bildirimleri bu dile göre gider.
alter table kullanicilar
  add column dil text check (dil in ('tr', 'en', 'de', 'es', 'fr', 'it', 'ar', 'ru'));
