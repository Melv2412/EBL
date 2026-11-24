-- MVP de chaque match (chaque manche) et jusqu'à 3 stats au choix, ex. [{"stat":"pts","value":18}].

alter table games
  add column if not exists mvp_player_id bigint references players(id) on delete set null,
  add column if not exists mvp_stats jsonb not null default '[]'::jsonb;

alter table games drop constraint if exists games_mvp_stats_max3;
alter table games add constraint games_mvp_stats_max3
  check (jsonb_typeof(mvp_stats) = 'array' and jsonb_array_length(mvp_stats) <= 3);
