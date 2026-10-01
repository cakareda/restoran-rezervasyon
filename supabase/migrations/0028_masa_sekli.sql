alter table restoran_masalari
  add column sekil text not null default 'dikdortgen' check (sekil in ('daire', 'dikdortgen'));
