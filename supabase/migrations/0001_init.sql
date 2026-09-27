-- Restoran Rezervasyon Platformu - Faz 1 şema

create extension if not exists "pgcrypto";

create table restoranlar (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  ad text not null,
  sehir text not null,
  semt text not null,
  mutfak_turu text not null,
  eposta text not null,
  telefon text,
  kapasite int,
  ortalama_fiyat text,
  aciklama text,
  fotograf_url text,
  olusturulma timestamptz not null default now()
);

create table kullanicilar (
  id uuid primary key default gen_random_uuid(),
  ad_soyad text not null,
  eposta text not null,
  telefon text,
  olusturulma timestamptz not null default now(),
  unique (eposta)
);

create table rezervasyonlar (
  id uuid primary key default gen_random_uuid(),
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  kullanici_id uuid not null references kullanicilar(id) on delete cascade,
  tarih_saat timestamptz not null,
  kisi_sayisi int not null check (kisi_sayisi > 0),
  durum text not null default 'beklemede' check (durum in ('beklemede', 'onaylandi', 'reddedildi')),
  geldi_mi boolean,
  olusturulma timestamptz not null default now()
);

create table bildirimler (
  id uuid primary key default gen_random_uuid(),
  rezervasyon_id uuid not null references rezervasyonlar(id) on delete cascade,
  kanal text not null default 'eposta',
  tur text not null,
  gonderilme timestamptz not null default now()
);

create table yorumlar (
  id uuid primary key default gen_random_uuid(),
  rezervasyon_id uuid not null unique references rezervasyonlar(id) on delete cascade,
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  puan_yemek int not null check (puan_yemek between 1 and 5),
  puan_servis int not null check (puan_servis between 1 and 5),
  puan_ortam int not null check (puan_ortam between 1 and 5),
  yorum_metni text,
  olusturulma timestamptz not null default now()
);

create index rezervasyonlar_restoran_id_idx on rezervasyonlar(restoran_id);
create index rezervasyonlar_kullanici_id_idx on rezervasyonlar(kullanici_id);
create index yorumlar_restoran_id_idx on yorumlar(restoran_id);

-- Row Level Security

alter table restoranlar enable row level security;
alter table kullanicilar enable row level security;
alter table rezervasyonlar enable row level security;
alter table bildirimler enable row level security;
alter table yorumlar enable row level security;

-- restoranlar: herkes okuyabilir (kullanıcı sitesi listeleme/arama için), sadece kendi hesabı güncelleyebilir
create policy "restoranlar_herkes_okur" on restoranlar for select using (true);
create policy "restoranlar_kendi_gunceller" on restoranlar for update using (auth_user_id = auth.uid());
create policy "restoranlar_kendi_ekler" on restoranlar for insert with check (auth_user_id = auth.uid());

-- kullanicilar: anon rezervasyon formu insert edebilir; restoran girişli kullanıcılar kendi rezervasyonlarındaki misafiri okuyabilir
create policy "kullanicilar_herkes_ekler" on kullanicilar for insert with check (true);
create policy "kullanicilar_herkes_okur" on kullanicilar for select using (true);

-- rezervasyonlar: anon oluşturabilir; sadece ilgili restoran kendi rezervasyonlarını görür/günceller
create policy "rezervasyonlar_herkes_ekler" on rezervasyonlar for insert with check (true);
create policy "rezervasyonlar_restoran_okur" on rezervasyonlar for select using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);
create policy "rezervasyonlar_restoran_gunceller" on rezervasyonlar for update using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);

-- bildirimler: yalnızca ilgili restoran kendi rezervasyonlarına ait bildirimleri okuyabilir; sunucu tarafı (service role) insert eder
create policy "bildirimler_restoran_okur" on bildirimler for select using (
  rezervasyon_id in (
    select r.id from rezervasyonlar r
    join restoranlar rt on rt.id = r.restoran_id
    where rt.auth_user_id = auth.uid()
  )
);

-- yorumlar: herkes okuyabilir (restoran detay sayfası), yalnızca geldi_mi=true olan rezervasyon için insert
create policy "yorumlar_herkes_okur" on yorumlar for select using (true);
create policy "yorumlar_gelen_misafir_ekler" on yorumlar for insert with check (
  rezervasyon_id in (select id from rezervasyonlar where geldi_mi = true)
);
