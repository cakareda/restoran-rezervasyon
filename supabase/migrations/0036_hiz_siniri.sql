-- Herkese açık uçlar (rezervasyon, kayıt, başvuru...) için basit sabit pencereli hız sınırı.
-- Sayaç yalnızca sunucudan (servis anahtarı) kullanılır; istemci rolleri erişemez.
create table hiz_siniri (
  anahtar text not null,
  pencere timestamptz not null,
  sayi int not null default 0,
  primary key (anahtar, pencere)
);

alter table hiz_siniri enable row level security;
revoke all on hiz_siniri from anon, authenticated;

-- true döner: sınır aşıldı. Sayaç atomik artırılır.
create or replace function hiz_siniri_kontrol(p_anahtar text, p_limit int, p_pencere_sn int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pencere timestamptz;
  v_sayi int;
begin
  v_pencere := to_timestamp(floor(extract(epoch from now()) / p_pencere_sn) * p_pencere_sn);
  insert into hiz_siniri (anahtar, pencere, sayi) values (p_anahtar, v_pencere, 1)
  on conflict (anahtar, pencere) do update set sayi = hiz_siniri.sayi + 1
  returning sayi into v_sayi;

  -- Eski kayıtları ara sıra temizle.
  if random() < 0.01 then
    delete from hiz_siniri where pencere < now() - interval '2 days';
  end if;

  return v_sayi > p_limit;
end;
$$;

revoke all on function hiz_siniri_kontrol(text, int, int) from public, anon, authenticated;
grant execute on function hiz_siniri_kontrol(text, int, int) to service_role;
