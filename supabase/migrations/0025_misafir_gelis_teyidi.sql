-- Restoran "Geldi" olarak işaretlese bile, bunu tek taraflı kabul etmek yerine
-- misafire rezervasyon saatinden sonra bir doğrulama sorusu gönderiyoruz.
-- Komisyonlu dönemde restoranın "gelmedi" diyerek ücretten kaçmasına veya
-- "geldi" diyerek haksız ücretlendirilmesine karşı bağımsız bir kayıt tutar.
alter table rezervasyonlar
  add column misafir_teyit boolean,
  add column misafir_teyit_zamani timestamptz,
  add column teyit_gonderildi boolean not null default false;

comment on column rezervasyonlar.misafir_teyit is
  'Misafirin e-posta/WhatsApp üzerinden kendi onayı: null = henüz yanıt yok, true = geldiğini onayladı, false = gelmediğini/itiraz ettiğini bildirdi.';
