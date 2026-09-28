-- Telefonla/elden gelen rezervasyonlarda (kaynak='telefon') misafirin online hesabı olmaz,
-- bu yüzden adı/telefonu doğrudan rezervasyon satırında tutuyoruz.
alter table rezervasyonlar
  add column misafir_ad_soyad text,
  add column misafir_telefon text;
