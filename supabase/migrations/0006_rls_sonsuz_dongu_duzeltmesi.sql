-- 0005'teki "rezervasyonlar_musteri_okur" politikası, kullanicilar tablosuna
-- normal bir alt sorguyla bakıyordu; bu da kullanicilar'ın kendi RLS politikasını
-- (0003) tekrar tetikleyip sonsuz döngüye giriyordu ("infinite recursion detected").
--
-- Çözüm: kullanıcının kendi kullanici.id'sini RLS'i atlayarak (security definer)
-- döndüren bir fonksiyon kullanmak, döngüyü kırar.

create or replace function public.mevcut_kullanici_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from kullanicilar where auth_user_id = auth.uid()
$$;

drop policy if exists "rezervasyonlar_musteri_okur" on rezervasyonlar;
create policy "rezervasyonlar_musteri_okur" on rezervasyonlar for select using (
  kullanici_id = public.mevcut_kullanici_id()
);
