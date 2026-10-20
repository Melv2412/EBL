-- Logos des promos IT4 (Knights), IT6 (Spartans) et IT7 (Panthers), servis depuis public/logos.
-- Le nom et les couleurs ne sont remplis que s'ils sont encore vides ou par défaut.

update promos set
  logo_url = '/logos/it4.webp',
  name = coalesce(name, 'Knights'),
  color_primary = case when color_primary = '#1b2a33' then '#151515' else color_primary end,
  color_secondary = case when color_secondary = '#2aa7c9' then '#d0182f' else color_secondary end
where number = 4;

update promos set
  logo_url = '/logos/it6.webp',
  name = coalesce(name, 'Spartans'),
  color_primary = case when color_primary = '#1b2a33' then '#1a0f0f' else color_primary end,
  color_secondary = case when color_secondary = '#2aa7c9' then '#c99a4a' else color_secondary end
where number = 6;

update promos set
  logo_url = '/logos/it7.webp',
  name = coalesce(name, 'Panthers'),
  color_primary = case when color_primary = '#1b2a33' then '#1d1238' else color_primary end,
  color_secondary = case when color_secondary = '#2aa7c9' then '#b44cf0' else color_secondary end
where number = 7;

select number, name, logo_url, color_primary, color_secondary from promos where number in (4, 6, 7) order by number;
