alter table rezervasyonlar
  add column iptal_eden text check (iptal_eden in ('restoran', 'misafir'));
