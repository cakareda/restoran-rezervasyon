-- Rezervasyon saatinden birkaç saat önce Masadaki'den otomatik hatırlatma gönderiyoruz;
-- aynı rezervasyona iki kez hatırlatma gitmesin diye işaretliyoruz.
alter table rezervasyonlar
  add column hatirlatma_gonderildi boolean not null default false;
