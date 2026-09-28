alter table masalar add column alan text not null default '';

alter table masalar drop constraint masalar_restoran_id_kapasite_key;
alter table masalar add constraint masalar_restoran_id_kapasite_alan_key unique (restoran_id, kapasite, alan);
