alter table restoranlar
  add column en_erken_rezervasyon_saat int not null default 1,
  add column en_gec_rezervasyon_gun int not null default 60,
  add column maksimum_kisi_sayisi int not null default 20;
