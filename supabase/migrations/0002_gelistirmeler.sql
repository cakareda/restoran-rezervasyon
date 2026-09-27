-- Faz 1 geliştirmeleri: müşteri hesapları, restoran profili zenginleştirme

-- Restoranlara ek profil bilgileri
alter table restoranlar
  add column adres text,
  add column calisma_saatleri text,
  add column olanaklar text[] not null default '{}',
  add column fotograflar text[] not null default '{}';

-- Müşteriler artık isteğe bağlı olarak hesap açıp giriş yapabilir (guest akışı da kalır)
alter table kullanicilar
  add column auth_user_id uuid unique references auth.users(id) on delete set null;

create policy "kullanicilar_kendi_gunceller" on kullanicilar for update using (
  auth_user_id = auth.uid()
);
