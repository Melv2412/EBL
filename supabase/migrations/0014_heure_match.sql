-- Heure de chaque match (facultative), affichée avec la date.
alter table series add column if not exists match_time time;
