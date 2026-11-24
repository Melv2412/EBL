-- Forfait : la promo qui déclare forfait perd 20-0 et ne prend aucun point au classement.
alter table games
  add column if not exists forfeit_promo int references promos(number);
