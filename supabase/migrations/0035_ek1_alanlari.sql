-- Ek-1 (restorana özel ticari koşullar) alanları: admin restoran başına doldurur.
-- restoranlar üzerindeki sütun bazlı UPDATE yetkisi 0033'te yalnızca o günkü sütunlara
-- verildi; buradaki yeni sütunlar restoran oturumundan değiştirilemez (yalnızca servis anahtarı).
alter table restoranlar
  add column uyelik_paketi text,
  add column uyelik_aylik_ucret_tl numeric(10,2),
  add column hesaplasma_donemi text not null default 'Aylık',
  add column odeme_vadesi_gun int not null default 10,
  add column odeme_yontemi text not null default 'Havale / EFT';

-- Sözleşme süresi: kabulden itibaren 1 yıl. Süre dolunca restoran yeniden imzaya yönlendirilir.
alter table sozlesme_kabulleri
  add column sozlesme_bitis timestamptz not null default (now() + interval '1 year');

-- Yenileme için aynı sürümün ikinci kabulüne izin ver (süre dolduktan sonra).
drop index if exists sozlesme_kabulleri_restoran_surum_idx;
create index sozlesme_kabulleri_restoran_idx on sozlesme_kabulleri (restoran_id, sozlesme_surumu, sozlesme_bitis);
