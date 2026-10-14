-- Distinctions : MVP de la finale, DPOY, meilleur scoreur, révélation (L1), concours à 3 points et de dunk.
-- Le meilleur scoreur porte son total de points (et le nombre de matchs, facultatif).

alter type award_type add value if not exists 'mvp_finale';
alter type award_type add value if not exists 'dpoy';
alter type award_type add value if not exists 'top_scorer';
alter type award_type add value if not exists 'revelation';
alter type award_type add value if not exists 'three_point';
alter type award_type add value if not exists 'dunk';

alter table awards
  add column if not exists points int check (points is null or points >= 0),
  add column if not exists games  int check (games is null or games > 0);

-- Une seule distinction de chaque type par édition, sauf les mentions honorables.
create unique index if not exists awards_one_per_type
  on awards (edition_year, type) where (type <> 'mention_honorable');
