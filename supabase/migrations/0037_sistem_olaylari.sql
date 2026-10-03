create table sistem_olaylari (
  id bigint generated always as identity primary key,
  tur text not null check (tur in ('cron', 'hata')),
  ad text not null,
  basarili boolean not null default true,
  ozet text,
  zaman timestamptz not null default now()
);

create index sistem_olaylari_ad_zaman_idx on sistem_olaylari (ad, zaman desc);

alter table sistem_olaylari enable row level security;
revoke all on sistem_olaylari from anon, authenticated;
