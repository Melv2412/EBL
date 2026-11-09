create table public.homepage_settings (
  id boolean primary key default true check (id),
  mode text not null default 'auto' check (mode in ('auto', 'final', 'champion', 'slideshow')),
  slide_order text[] not null default '{}'
);

insert into public.homepage_settings (id) values (true);

alter table public.homepage_settings enable row level security;

create policy "lecture publique" on public.homepage_settings
  for select using (true);

create policy "modification admin" on public.homepage_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.homepage_settings from anon, authenticated;
grant select on public.homepage_settings to anon, authenticated;
grant update on public.homepage_settings to authenticated;