create sequence if not exists sozlesme_kabul_no_seq;

create table sozlesme_kabulleri (
  id uuid primary key default gen_random_uuid(),
  kabul_no text not null unique
    default ('SK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('sozlesme_kabul_no_seq')::text, 6, '0')),
  restoran_id uuid not null references restoranlar(id) on delete cascade,
  sozlesme_surumu text not null,
  belgeler jsonb not null,
  ticari_kosullar jsonb not null,
  restoran_bilgileri jsonb not null,
  imza_adi text not null,
  imza_unvani text,
  imza_gorseli text not null,
  kabul_eden_kullanici_id uuid,
  kabul_eden_eposta text,
  ip text,
  user_agent text,
  kabul_zamani timestamptz not null default now()
);

create unique index sozlesme_kabulleri_restoran_surum_idx
  on sozlesme_kabulleri (restoran_id, sozlesme_surumu);

alter table sozlesme_kabulleri enable row level security;

create policy "sozlesme_kabulleri_restoran_okur" on sozlesme_kabulleri for select using (
  restoran_id in (select id from restoranlar where auth_user_id = auth.uid())
);

create or replace function sozlesme_kabulu_degistirilemez() returns trigger as $$
begin
  raise exception 'sozlesme_kabulleri kayitlari degistirilemez';
end;
$$ language plpgsql;

create trigger sozlesme_kabulleri_update_engelle
  before update on sozlesme_kabulleri
  for each row execute function sozlesme_kabulu_degistirilemez();
