-- Demi-finalistes connus sans le détail de la série (archives : on sait qui a perdu en demie, pas contre qui).
create table if not exists semifinalists (
  edition_year int not null references editions(start_year) on delete cascade,
  promo        int not null references promos(number),
  primary key (edition_year, promo)
);
alter table semifinalists enable row level security;
create policy "lecture publique" on semifinalists for select using (true);
create policy "ecriture admin" on semifinalists for all using (is_admin()) with check (is_admin());

alter table players add column if not exists is_captain boolean not null default false;
