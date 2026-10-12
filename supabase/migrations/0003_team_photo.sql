-- Photo d'équipe affichée en bannière sur la fiche promo.
alter table promos add column if not exists team_photo_url text;
