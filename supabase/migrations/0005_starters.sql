-- 5 de départ : placé sur le demi-terrain de la fiche promo, sans mention visible.
alter table players add column if not exists is_starter boolean not null default false;
