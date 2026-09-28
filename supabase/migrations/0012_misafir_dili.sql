-- Misafirin rezervasyon anındaki site dilini kaydediyoruz; ileride onay e-postasını
-- ve panel gösterimini buna göre yapabilmek için.
alter table rezervasyonlar
  add column misafir_dili text;
