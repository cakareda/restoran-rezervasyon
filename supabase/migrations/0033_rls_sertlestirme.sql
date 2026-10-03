drop policy if exists "rezervasyonlar_herkes_ekler" on rezervasyonlar;
drop policy if exists "kullanicilar_herkes_ekler" on kullanicilar;
drop policy if exists "yorumlar_gelen_misafir_ekler" on yorumlar;
drop policy if exists "bekleme_listesi_herkes_ekler" on bekleme_listesi;
drop policy if exists "basvurular_herkes_ekler" on basvurular;
drop policy if exists "rezervasyonlar_restoran_gunceller" on rezervasyonlar;
drop policy if exists "bekleme_listesi_restoran_gunceller" on bekleme_listesi;
drop policy if exists "restoranlar_kendi_ekler" on restoranlar;
revoke update on table restoranlar from anon, authenticated;
do $$
declare
  kolonlar text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into kolonlar
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'restoranlar'
     and column_name not in (
       'id', 'auth_user_id', 'olusturulma',
       'fiyat_seviyesi', 'ortalama_fiyat', 'kurucu_restoran', 'aktivasyon_tarihi'
     );
  execute format('grant update (%s) on public.restoranlar to authenticated', kolonlar);
end $$;
