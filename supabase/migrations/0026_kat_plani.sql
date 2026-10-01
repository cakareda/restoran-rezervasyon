create table restoran_masalari (
  id uuid primary key default gen_random_uuid(),
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  isim text not null,
  kapasite int not null check (kapasite > 0),
  alan text not null default '',
  pozisyon_x numeric not null default 10 check (pozisyon_x >= 0 and pozisyon_x <= 100),
  pozisyon_y numeric not null default 10 check (pozisyon_y >= 0 and pozisyon_y <= 100),
  olusturulma timestamptz not null default now()
);

alter table restoran_masalari enable row level security;

create policy "restoran_masalari_herkes_okur" on restoran_masalari for select using (true);
create policy "restoran_masalari_restoran_yonetir" on restoran_masalari for all using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
) with check (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);

alter table rezervasyonlar add column atanan_masa_idler uuid[];
