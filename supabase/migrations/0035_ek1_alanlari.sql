alter table restoranlar
  add column uyelik_paketi text,
  add column uyelik_aylik_ucret_tl numeric(10,2),
  add column hesaplasma_donemi text not null default 'Aylık',
  add column odeme_vadesi_gun int not null default 10,
  add column odeme_yontemi text not null default 'Havale / EFT';

alter table sozlesme_kabulleri
  add column sozlesme_bitis timestamptz not null default (now() + interval '1 year');

drop index if exists sozlesme_kabulleri_restoran_surum_idx;
create index sozlesme_kabulleri_restoran_idx on sozlesme_kabulleri (restoran_id, sozlesme_surumu, sozlesme_bitis);
