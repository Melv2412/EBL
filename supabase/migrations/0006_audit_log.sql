-- Journal des modifications : chaque écriture sur les tables de la ligue est enregistrée
-- (qui, quand, avant / après). Une action de l'admin = une transaction = un groupe dans l'historique.

create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  tx          bigint not null default txid_current(),
  actor       uuid,
  actor_name  text,
  table_name  text not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  row_key     jsonb not null,
  old_row     jsonb,
  new_row     jsonb,
  restored_at timestamptz
);
create index if not exists audit_log_at_idx on audit_log (at desc);
create index if not exists audit_log_tx_idx on audit_log (tx);

alter table audit_log enable row level security;
create policy "admins lisent le journal" on audit_log for select using (is_admin());
-- Aucune écriture directe : seuls les déclencheurs (security definer) écrivent.

create or replace function audit_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pk text[] := tg_argv;
  src jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  k jsonb := '{}'::jsonb;
  c text;
  who text;
begin
  -- Rien à journaliser si la ligne n'a pas changé.
  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then return new; end if;
  foreach c in array pk loop k := k || jsonb_build_object(c, src -> c); end loop;
  select coalesce(raw_user_meta_data ->> 'username', email) into who from auth.users where id = auth.uid();
  insert into audit_log (actor, actor_name, table_name, action, row_key, old_row, new_row)
  values (
    auth.uid(), who, tg_table_name, lower(tg_op), k,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare
  t record;
begin
  for t in select * from (values
    ('promos', 'number'),
    ('editions', 'start_year'),
    ('series', 'id'),
    ('games', 'id'),
    ('players', 'id'),
    ('awards', 'id'),
    ('edition_teams', 'edition_year,promo'),
    ('semifinalists', 'edition_year,promo')
  ) as v(name, pk) loop
    execute format('drop trigger if exists audit on %I', t.name);
    execute format(
      'create trigger audit after insert or update or delete on %I for each row execute function audit_write(%s)',
      t.name,
      (select string_agg(quote_literal(x), ',') from unnest(string_to_array(t.pk, ',')) x)
    );
  end loop;
end $$;

-- Annule une ligne du journal : remet l'ancienne valeur, recrée une ligne supprimée,
-- ou supprime une ligne créée. Réservé aux admins.
create or replace function audit_restore(log_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare
  e audit_log;
  cond text;
  cond_t text;
  cols text;
begin
  if not is_admin() then raise exception 'Réservé aux admins.'; end if;
  select * into e from audit_log where id = log_id;
  if not found then raise exception 'Entrée introuvable.'; end if;
  if e.restored_at is not null then raise exception 'Déjà annulée.'; end if;

  select string_agg(format('%I = %L', key, e.row_key ->> key), ' and '),
         string_agg(format('t.%I = %L', key, e.row_key ->> key), ' and ')
    into cond, cond_t from jsonb_object_keys(e.row_key) key;

  if e.action = 'insert' then
    execute format('delete from %I where %s', e.table_name, cond);
  elsif e.action = 'update' then
    -- Seules les colonnes modifiées reprennent leur ancienne valeur.
    select string_agg(format('%I = r.%I', key, key), ', ') into cols
    from jsonb_object_keys(e.old_row) key
    where (e.old_row -> key) is distinct from (e.new_row -> key);
    if cols is null then return 'Rien à annuler.'; end if;
    execute format(
      'update %I t set %s from jsonb_populate_record(null::%I, $1) r where %s',
      e.table_name, cols, e.table_name, cond_t
    ) using e.old_row;
  else
    execute format(
      'insert into %I overriding system value select * from jsonb_populate_record(null::%I, $1)',
      e.table_name, e.table_name
    ) using e.old_row;
  end if;

  update audit_log set restored_at = now() where id = log_id;
  return 'Annulé.';
end $$;

revoke all on function audit_restore(bigint) from public, anon;
grant execute on function audit_restore(bigint) to authenticated;
revoke all on function audit_write() from public, anon, authenticated;
