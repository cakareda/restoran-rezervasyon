-- Müşteriler kendi rezervasyonlarını (profilim sayfasında) görebilsin.
create policy "rezervasyonlar_musteri_okur" on rezervasyonlar for select using (
  kullanici_id in (select id from kullanicilar where auth_user_id = auth.uid())
);
