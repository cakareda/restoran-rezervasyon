-- Restoran fotoğrafları için herkese açık okunabilen bir storage bucket.
insert into storage.buckets (id, name, public)
values ('restoran-fotograflari', 'restoran-fotograflari', true)
on conflict (id) do nothing;

-- Herkes fotoğrafları görebilir (halka açık restoran sayfaları için).
create policy "restoran_fotograflari_herkes_okur" on storage.objects
  for select using (bucket_id = 'restoran-fotograflari');

-- Bir restoran sadece kendi klasörüne (restoran_id/...) yükleme/silme yapabilir.
create policy "restoran_fotograflari_sahibi_yukler" on storage.objects
  for insert with check (
    bucket_id = 'restoran-fotograflari'
    and (storage.foldername(name))[1] in (
      select id::text from restoranlar where auth_user_id = auth.uid()
    )
  );

create policy "restoran_fotograflari_sahibi_siler" on storage.objects
  for delete using (
    bucket_id = 'restoran-fotograflari'
    and (storage.foldername(name))[1] in (
      select id::text from restoranlar where auth_user_id = auth.uid()
    )
  );
