-- Restoran sahipleri artık kendiliğinden kayıt olamıyor (güvenlik: başkasının
-- restoranını sahiplenme riski). Bunun yerine bu tablo, "bana ulaşın" formundan
-- gelen talepleri tutar; hesabı ve restoran kaydını Eda elle açıyor.
create table basvurular (
  id uuid primary key default gen_random_uuid(),
  restoran_adi text not null,
  eposta text not null,
  telefon text,
  masa_duzeni text,
  menu text,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'iletisime_gecildi', 'tamamlandi')),
  olusturulma timestamptz not null default now()
);

alter table basvurular enable row level security;

-- Herkes (girişsiz) başvuru gönderebilir; başvuruları yalnızca service role okur/yönetir.
create policy "basvurular_herkes_ekler" on basvurular for insert with check (true);
