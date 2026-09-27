-- Misafirin rezervasyon sırasında bırakabileceği not (alerji, özel istek, VIP vb.)
-- Restoran panelinde rozet olarak gösterilir.
alter table rezervasyonlar
  add column notlar text;
