-- Une saison peut être annulée : elle reste affichée, sans champion ni finale.
alter type edition_status add value if not exists 'annulee';

-- Les réglages de l'accueil (mode, diaporama) apparaissent dans l'historique.
drop trigger if exists audit on homepage_settings;
create trigger audit after insert or update or delete on homepage_settings
  for each row execute function audit_write('id');
