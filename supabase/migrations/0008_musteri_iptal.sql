-- Müşteri kendi rezervasyonunu iptal edebilsin (e-postadaki linkten veya profilinden).
alter table rezervasyonlar drop constraint rezervasyonlar_durum_check;
alter table rezervasyonlar add constraint rezervasyonlar_durum_check
  check (durum in ('beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi'));
