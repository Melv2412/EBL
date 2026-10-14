-- All-EBL Team : 3 extérieurs + 2 intérieurs élus chaque saison.
-- Score = 50 % vote du public (1 bulletin par appareil) + 50 % vote des capitaines (lien secret à usage unique).
-- Les bulletins ne sont lisibles que par les admins ; le public n'a accès qu'aux totaux, une fois le vote clos.

alter table editions
  add column if not exists allebl_opens_at  timestamptz,
  add column if not exists allebl_closes_at timestamptz,
  add column if not exists allebl_published boolean not null default false;

-- Candidats retenus par l'admin. Un joueur peut l'être des deux côtés.
create table if not exists allebl_candidates (
  edition_year int not null references editions(start_year) on delete cascade,
  player_id    bigint not null references players(id) on delete cascade,
  side         text not null check (side in ('ext', 'int')),
  primary key (edition_year, player_id, side)
);

create table if not exists allebl_votes (
  id           bigint generated always as identity primary key,
  edition_year int not null references editions(start_year) on delete cascade,
  device       text not null,
  ip_hash      text,
  ext_ids      bigint[] not null,
  int_ids      bigint[] not null,
  voided       boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (edition_year, device)
);

create table if not exists allebl_captain_links (
  code         text primary key,
  edition_year int not null references editions(start_year) on delete cascade,
  promo        int not null references promos(number),
  used_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (edition_year, promo)
);

create table if not exists allebl_captain_votes (
  code         text primary key references allebl_captain_links(code) on delete cascade,
  edition_year int not null references editions(start_year) on delete cascade,
  ext_ids      bigint[] not null,
  int_ids      bigint[] not null,
  voided       boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table allebl_candidates enable row level security;
create policy "lecture publique" on allebl_candidates for select using (true);
create policy "ecriture admin" on allebl_candidates for all using (is_admin()) with check (is_admin());

alter table allebl_votes enable row level security;
create policy "admin" on allebl_votes for all using (is_admin()) with check (is_admin());

alter table allebl_captain_links enable row level security;
create policy "admin" on allebl_captain_links for all using (is_admin()) with check (is_admin());

alter table allebl_captain_votes enable row level security;
create policy "admin" on allebl_captain_votes for all using (is_admin()) with check (is_admin());

-- Journal des modifications : les candidats et les liens (pas les bulletins, trop nombreux).
drop trigger if exists audit on allebl_candidates;
create trigger audit after insert or update or delete on allebl_candidates
  for each row execute function audit_write('edition_year', 'player_id', 'side');
drop trigger if exists audit on allebl_captain_links;
create trigger audit after insert or update or delete on allebl_captain_links
  for each row execute function audit_write('code');

-- Vérifie un bulletin : 3 extérieurs et 2 intérieurs distincts, tous candidats du bon côté,
-- aucun joueur deux fois, et (pour un capitaine) aucun joueur de sa propre promo.
create or replace function allebl_check_ballot(y int, e bigint[], i bigint[], own_promo int default null)
returns void language plpgsql stable security definer set search_path = public as $$
declare
  ed editions;
begin
  select * into ed from editions where start_year = y;
  if not found then raise exception 'Édition inconnue.'; end if;
  if ed.allebl_opens_at is null or now() < ed.allebl_opens_at then raise exception 'Le vote n''est pas encore ouvert.'; end if;
  if ed.allebl_closes_at is not null and now() > ed.allebl_closes_at then raise exception 'Le vote est terminé.'; end if;
  if coalesce(array_length(e, 1), 0) <> 3 or (select count(distinct x) from unnest(e) x) <> 3 then
    raise exception 'Choisis exactement 3 extérieurs différents.';
  end if;
  if coalesce(array_length(i, 1), 0) <> 2 or (select count(distinct x) from unnest(i) x) <> 2 then
    raise exception 'Choisis exactement 2 intérieurs différents.';
  end if;
  if e && i then raise exception 'Un même joueur ne peut pas être choisi deux fois.'; end if;
  if (select count(*) from allebl_candidates c where c.edition_year = y and c.side = 'ext' and c.player_id = any (e)) <> 3
    or (select count(*) from allebl_candidates c where c.edition_year = y and c.side = 'int' and c.player_id = any (i)) <> 2 then
    raise exception 'Bulletin invalide : joueur non candidat.';
  end if;
  if own_promo is not null and exists (select 1 from players p where p.id = any (e || i) and p.promo = own_promo) then
    raise exception 'Un capitaine ne peut pas voter pour un joueur de sa promo.';
  end if;
end $$;

-- Vote du public (appelé par le serveur du site avec la clé publique).
create or replace function allebl_vote(y int, device_id text, ip text, e bigint[], i bigint[])
returns text language plpgsql security definer set search_path = public as $$
begin
  if coalesce(length(device_id), 0) < 16 then raise exception 'Appareil non reconnu.'; end if;
  perform allebl_check_ballot(y, e, i);
  insert into allebl_votes (edition_year, device, ip_hash, ext_ids, int_ids) values (y, device_id, ip, e, i);
  return 'Vote enregistré.';
exception when unique_violation then
  raise exception 'Tu as déjà voté depuis cet appareil.';
end $$;

-- Lien de capitaine : à quelle édition et quelle promo il correspond, et s'il a déjà servi.
create or replace function allebl_captain_link(c text)
returns table (edition_year int, promo int, used boolean)
language sql stable security definer set search_path = public as $$
  select l.edition_year, l.promo, l.used_at is not null from allebl_captain_links l where l.code = c;
$$;

create or replace function allebl_captain_vote(c text, e bigint[], i bigint[])
returns text language plpgsql security definer set search_path = public as $$
declare
  l allebl_captain_links;
begin
  select * into l from allebl_captain_links where code = c for update;
  if not found then raise exception 'Lien de vote invalide.'; end if;
  if l.used_at is not null then raise exception 'Ce lien a déjà servi.'; end if;
  perform allebl_check_ballot(l.edition_year, e, i, l.promo);
  insert into allebl_captain_votes (code, edition_year, ext_ids, int_ids) values (c, l.edition_year, e, i);
  update allebl_captain_links set used_at = now() where code = c;
  return 'Vote enregistré.';
end $$;

-- Totaux par candidat. Public seulement une fois le vote clos ; les admins les voient en direct.
create or replace function allebl_tally(y int)
returns table (player_id bigint, side text, public_votes int, captain_votes int, public_ballots int, captain_ballots int)
language plpgsql stable security definer set search_path = public as $$
declare
  ed editions;
begin
  select * into ed from editions where start_year = y;
  if not found then return; end if;
  if not is_admin() and (not ed.allebl_published or ed.allebl_closes_at is null or now() <= ed.allebl_closes_at) then
    return;
  end if;
  return query
  with pb as (select ext_ids, int_ids from allebl_votes where edition_year = y and not voided),
       cb as (select ext_ids, int_ids from allebl_captain_votes where edition_year = y and not voided)
  select c.player_id, c.side,
    (select count(*)::int from pb where c.player_id = any (case when c.side = 'ext' then pb.ext_ids else pb.int_ids end)),
    (select count(*)::int from cb where c.player_id = any (case when c.side = 'ext' then cb.ext_ids else cb.int_ids end)),
    (select count(*)::int from pb),
    (select count(*)::int from cb)
  from allebl_candidates c where c.edition_year = y;
end $$;

revoke all on function allebl_check_ballot(int, bigint[], bigint[], int) from public, anon, authenticated;
grant execute on function allebl_vote(int, text, text, bigint[], bigint[]) to anon, authenticated;
grant execute on function allebl_captain_link(text) to anon, authenticated;
grant execute on function allebl_captain_vote(text, bigint[], bigint[]) to anon, authenticated;
grant execute on function allebl_tally(int) to anon, authenticated;
