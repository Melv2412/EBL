alter table public.homepage_settings
  add column slides jsonb default null
  check (slides is null or jsonb_typeof(slides) = 'array');