-- Restoranın oturma süresi (bir masanın ortalama ne kadar işgal edildiği, dakika).
alter table restoranlar
  add column oturma_suresi_dk int not null default 90;

-- Masa envanteri: restoran "kapasite X'lik Y masam var" şeklinde tanımlar.
-- Örn: {kapasite: 2, adet: 4}, {kapasite: 4, adet: 3}, {kapasite: 6, adet: 1}
create table masalar (
  id uuid primary key default gen_random_uuid(),
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  kapasite int not null check (kapasite > 0),
  adet int not null check (adet > 0),
  unique (restoran_id, kapasite)
);

alter table masalar enable row level security;

create policy "masalar_herkes_okur" on masalar for select using (true);
create policy "masalar_restoran_yonetir" on masalar for all using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
) with check (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);

-- Rezervasyona hangi masa kapasitesinin atandığı (müsaitlik kontrolü için).
alter table rezervasyonlar
  add column masa_kapasitesi int,
  add column ozel_gun text;

-- Bekleme listesi: müsait masa yoksa misafir buraya eklenir, restoran elle arar.
create table bekleme_listesi (
  id uuid primary key default gen_random_uuid(),
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  ad_soyad text not null,
  eposta text not null,
  telefon text,
  tarih date not null,
  saat time not null,
  kisi_sayisi int not null check (kisi_sayisi > 0),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'iletildi', 'iptal')),
  olusturulma timestamptz not null default now()
);

alter table bekleme_listesi enable row level security;

create policy "bekleme_listesi_herkes_ekler" on bekleme_listesi for insert with check (true);
create policy "bekleme_listesi_restoran_okur" on bekleme_listesi for select using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);
create policy "bekleme_listesi_restoran_gunceller" on bekleme_listesi for update using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);
