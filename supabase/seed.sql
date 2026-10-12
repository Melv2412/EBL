-- Données connues au 11/10/2026.

insert into promos (number, name, entry_year, logo_url, color_primary, color_secondary) values
  (7,  null,                2018, null,               '#1b2a33', '#2aa7c9'),
  (8,  null,                2019, null,               '#1b2a33', '#2aa7c9'),
  (9,  null,                2020, null,               '#1b2a33', '#2aa7c9'),
  (10, 'Eagle',             2021, '/logos/it10.jpeg', '#1d2939', '#c9ac5f'),
  (11, 'Wolvesonze',        2022, '/logos/it11.jpeg', '#25418a', '#6f93d6'),
  (12, 'Grizzly',           2023, '/logos/it12.jpeg', '#3a0a5a', '#b48ee0'),
  (13, 'Warriors',          2024, '/logos/it13.webp', '#13213c', '#f2b21b'),
  (14, 'Les Hecatonchires', 2025, '/logos/it14.jpeg', '#161616', '#d0182f'),
  (15, null,                2026, null,               '#1b2a33', '#2aa7c9');

insert into editions (start_year, status, final_date) values
  (2019, 'a_completer', null),
  (2020, 'a_completer', null),
  (2021, 'a_completer', null),
  (2022, 'a_completer', null),
  (2023, 'terminee',    null),
  (2024, 'terminee',    null),
  (2025, 'en_cours',    '2026-10-17');

insert into series (edition_year, round, promo_a, promo_b, winner, wins_a, wins_b) values
  (2023, 'finale', 10, 11, 10,   null, null),
  (2024, 'finale', 12, 10, 12,   null, null),
  (2025, 'demi',   14, 13, 14,   2,    0),
  (2025, 'demi',   12, 11, 12,   2,    1),
  (2025, 'finale', 12, 14, null, null, null);

-- Finale 2025-26 en match sec.
update series set best_of = 1 where edition_year = 2025 and round = 'finale';

insert into players (full_name, promo) values
  ('Yoan Diebe',     10),
  ('Baki Elysée',    11),
  ('Boni Jean-Elie', 12),
  ('Oulé Désiré',    12);

insert into awards (edition_year, type, player_id)
select v.y, v.t::award_type, p.id
from (values
  (2023, 'mvp',               'Yoan Diebe'),
  (2023, 'mention_honorable', 'Baki Elysée'),
  (2024, 'mvp',               'Boni Jean-Elie'),
  (2024, 'mention_honorable', 'Oulé Désiré')
) as v(y, t, name)
join players p on p.full_name = v.name;

-- Demi-finalistes connus sans le détail de la série.
insert into semifinalists (edition_year, promo) values (2023, 12), (2024, 11), (2024, 13);
