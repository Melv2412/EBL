-- Saison en poule unique : chaque équipe inscrite joue une fois contre chacune des autres,
-- les 4 premiers vont en demies (BO3), finale en match sec.

alter type series_round add value if not exists 'poule';

-- Date du match (annoncée au fur et à mesure).
alter table series add column if not exists match_date date;

-- Équipes inscrites à une édition (promos en cours + anciens qui s'inscrivent).
create table if not exists edition_teams (
  edition_year int not null references editions(start_year) on delete cascade,
  promo        int not null references promos(number),
  primary key (edition_year, promo)
);

alter table edition_teams enable row level security;
create policy "lecture publique" on edition_teams for select using (true);
create policy "ecriture admin" on edition_teams for all using (is_admin()) with check (is_admin());

-- Un seul score par manche.
create index if not exists games_series_idx on games (series_id);
