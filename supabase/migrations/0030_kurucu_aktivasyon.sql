-- Sözleşme Madde 7: Kurucu Restoran (31.12.2026 23:59'a kadar kayıt+aktivasyon) ve
-- ücretsiz dönemin Aktivasyon tarihinden itibaren hesaplanması.
alter table restoranlar
  add column kurucu_restoran boolean not null default true,
  add column aktivasyon_tarihi timestamptz;

update restoranlar set aktivasyon_tarihi = olusturulma where aktivasyon_tarihi is null;

alter table restoranlar
  alter column aktivasyon_tarihi set not null,
  alter column aktivasyon_tarihi set default now();
