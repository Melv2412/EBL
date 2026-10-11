-- ESATIC Basket League — schéma initial
-- Lecture publique, écriture réservée aux comptes listés dans `admins`.

create type edition_status as enum ('a_completer', 'en_cours', 'terminee');
create type series_round as enum ('demi', 'finale', 'troisieme');
create type award_type as enum ('mvp', 'mention_honorable');

-- Une promo = une équipe (IT8, IT9, … IT15). Le numéro est la clé.
create table promos (
  number        int primary key check (number > 0),
  name          text,                       -- « Grizzly », null si inconnu
  entry_year    int not null,               -- année d'entrée en L1 (IT12 → 2023)
  logo_url      text,                       -- null → écusson généré
  color_primary   text not null default '#1b2a33',
  color_secondary text not null default '#2aa7c9',
  created_at    timestamptz not null default now()
);

-- Une édition = une saison universitaire (2025-26 → start_year 2025).
create table editions (
  start_year  int primary key,
  status      edition_status not null default 'a_completer',
  final_date  date,
  final_time  time,
  venue       text,
  summary     text,
  created_at  timestamptz not null default now()
);

-- Une série = une confrontation (demi, finale) jouée en BO3 ou en match sec.
-- winner null = pas encore joué. wins_a / wins_b null = score inconnu
-- (on connaît parfois le vainqueur d'une vieille finale sans le score).
create table series (
  id          bigint generated always as identity primary key,
  edition_year int not null references editions(start_year) on delete cascade,
  round       series_round not null,
  promo_a     int not null references promos(number),
  promo_b     int not null references promos(number),
  winner      int references promos(number),
  wins_a      int check (wins_a >= 0),
  wins_b      int check (wins_b >= 0),
  best_of     int not null default 3 check (best_of in (1, 3, 5)),
  check (promo_a <> promo_b),
  check (winner is null or winner in (promo_a, promo_b))
);

-- Détail facultatif des matchs d'une série.
create table games (
  id         bigint generated always as identity primary key,
  series_id  bigint not null references series(id) on delete cascade,
  game_no    int not null check (game_no > 0),
  score_a    int,
  score_b    int,
  played_on  date,
  unique (series_id, game_no)
);

create table players (
  id          bigint generated always as identity primary key,
  full_name   text not null,                -- tel qu'on l'appelle à l'école
  promo       int not null references promos(number),
  position    text,                         -- Meneur, Arrière, Ailier, Intérieur…
  photo_url   text,
  created_at  timestamptz not null default now()
);

create table awards (
  id           bigint generated always as identity primary key,
  edition_year int not null references editions(start_year) on delete cascade,
  type         award_type not null,
  player_id    bigint not null references players(id) on delete cascade
);

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create index on series (edition_year);
create index on players (promo);
create index on awards (edition_year);

-- Sécurité : tout le monde lit, seuls les admins écrivent.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

do $$
declare t text;
begin
  foreach t in array array['promos','editions','series','games','players','awards'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "lecture publique" on %I for select using (true)', t);
    execute format('create policy "ecriture admin" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

alter table admins enable row level security;
create policy "admin se voit" on admins for select using (user_id = auth.uid());

-- Stockage des logos et photos : lecture publique, écriture admin.
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;
create policy "media lecture" on storage.objects for select using (bucket_id = 'media');
create policy "media ecriture" on storage.objects for all
  using (bucket_id = 'media' and is_admin()) with check (bucket_id = 'media' and is_admin());
