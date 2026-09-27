-- Güvenlik düzeltmesi: kullanicilar tablosu herkese açık okunabiliyordu.
-- Artık yalnızca (a) kullanıcı kendi kaydını, ya da (b) bir restoran kendi
-- rezervasyonlarındaki misafirin kaydını görebilir.

drop policy if exists "kullanicilar_herkes_okur" on kullanicilar;

create policy "kullanicilar_kisitli_okur" on kullanicilar for select using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from rezervasyonlar r
    join restoranlar rt on rt.id = r.restoran_id
    where r.kullanici_id = kullanicilar.id
      and rt.auth_user_id = auth.uid()
  )
);
