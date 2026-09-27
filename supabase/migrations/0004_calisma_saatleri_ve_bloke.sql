-- Yapılandırılmış çalışma saatleri (rezervasyon saat dilimlerini bunlara göre üretiyoruz)
alter table restoranlar
  add column acilis_saati time not null default '12:00',
  add column kapanis_saati time not null default '23:00';

-- Restoran telefonla aldığı rezervasyonu online sisteme "bloke" olarak girebilsin.
-- Bu tür kayıtların misafiri yoktur (kullanici_id null) ve kaynağı 'telefon'dur.
alter table rezervasyonlar
  alter column kullanici_id drop not null,
  add column kaynak text not null default 'online' check (kaynak in ('online', 'telefon'));
