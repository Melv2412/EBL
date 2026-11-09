# EBL — ESATIC Basket League

Site de la ligue de basket inter-promos de l'ESATIC : finale du moment, éditions, promos, échelle L1 → M2.

Next.js (App Router) + Supabase, déployé sur Vercel.

## Lancer en local

```bash
npm install
npm run dev
```

Sans fichier `.env.local`, le site utilise les données de `src/lib/fixture.ts`.

## Brancher Supabase

1. Créer un projet Supabase.
2. Dans le SQL Editor, exécuter `supabase/migrations/0001_init.sql` puis `supabase/seed.sql`.
3. Copier `.env.example` en `.env.local` et remplir l'URL et la clé `anon`.

## Affichage de l'accueil

Dans `/admin`, le formulaire « Affichage de l'accueil » permet de choisir :

- **Automatique** : finale en attente, sinon dernier champion connu ; diaporama si aucun des deux n'existe.
- **Finale attendue** ou **Champion** : mise en avant correspondante, sans modifier les scores ni les éditions.
- **Diaporama** : tracés du terrain de finale au premier plan, photos de fond à 12 % d'opacité et fondu automatique toutes les secondes. Aucun bouton, indicateur ou arrêt au survol. Le défilement ne dépend pas de la préférence de réduction des animations ni de l'état de visibilité déclaré par le navigateur intégré.

Si une finale sélectionnée est ensuite terminée, le mode « Finale attendue » affiche le diaporama jusqu'au prochain choix ou à la prochaine finale en attente. Les poules et demi-finales restent accessibles dans les pages d'édition, sans bloc dédié sous la navigation de l'accueil. Le bandeau jaune « Vote ouvert » est retiré ; le vote reste accessible depuis le menu et l'encart des résultats All-EBL conserve ses conditions d'affichage.

La navigation publique ne propose pas de lien vers l'administration. Le bandeau « Mode admin » est également retiré, même pour les admins connectés. L'accès direct à `/admin` reste protégé par connexion.

Les 14 copies optimisées sont dans `public/photos/diaporama/`, référencées par `src/lib/home-slides.ts`. Elles doivent être incluses dans le commit puis le merge vers `main`, avec les composants et la migration ; le site ne lit pas le dossier local `brouillons/photo_diapo`. Les originaux ne sont pas modifiés.

Sur chaque base Supabase cible, appliquer `supabase/migrations/0010_homepage_settings.sql` après les migrations précédentes. Le réglage et l'ordre des photos sont propres à cette base : le merge Git ne les transfère pas. Sans la table de réglages, l'accueil conserve le mode automatique et le formulaire admin indique la migration requise. Seuls les admins peuvent enregistrer un changement.

Appliquer ensuite `supabase/migrations/0011_homepage_slides.sql` pour activer l'ajout et le retrait de photos dans le formulaire d'accueil. Les photos existantes et leur ordre sont conservés tant qu'aucune liste personnalisée n'est enregistrée. Une liste enregistrée vide affiche le terrain seul.

L'admin peut retirer des photos, réintégrer les photos livrées avec le site, changer leur ordre et ajouter une photo JPEG, PNG ou WebP par enregistrement depuis un téléphone ou un ordinateur. Les nouvelles photos sont compressées avant l'envoi puis stockées dans le bucket Supabase `media`, sous `diaporama/`. « Retirer » enlève une photo de la sélection, sans supprimer son fichier. Une photo envoyée puis retirée définitivement de la sélection peut être ajoutée à nouveau par envoi. Valider les modifications avec « Enregistrer l'accueil ».

Chaque photo possède aussi un cadrage horizontal et vertical réglable avec aperçu ordinateur (1440 × 900) ou téléphone (390 × 844), et un bouton « Recentrer ». Les aperçus montrent la découpe en pleine opacité pour faciliter le réglage ; le fond public conserve son opacité de 12 %. Le même réglage s'applique aux différents écrans, dont les proportions peuvent faire varier la zone visible. Le cadrage est enregistré avec « Enregistrer l'accueil », sans modifier l'image d'origine. Les photos sans cadrage enregistré restent centrées. Aucune migration supplémentaire n'est nécessaire après `0011_homepage_slides.sql` : la position est stockée dans la liste JSON existante.

La liste personnalisée, les cadrages et les photos envoyées appartiennent à la base et au stockage Supabase utilisés ; ils ne sont pas transférés par un merge Git vers une autre base.

## Votes et archives All-EBL

La page `/vote` propose le vote ouvert le plus récent parmi les saisons publiées. À défaut, elle annonce la prochaine ouverture selon sa date, ou affiche « Aucun vote ouvert ». Le bulletin reste inaccessible avant l'ouverture et après la clôture.

La page `/all-ebl` présente uniquement les saisons dont le vote est terminé et qui sont publiées, avec la plus récente par défaut. Le badge de saison devient un sélecteur lorsqu'il y a plusieurs saisons disponibles ; le choix figure dans l'URL (`?saison=2025-26`). Avec une seule saison, il reste un simple badge. Sans résultats publiés, la page affiche un message d'attente.

Les admins connectés conservent l'accès aux saisons configurées non publiées et aux résultats provisoires. Ces changements d'affichage ne modifient ni les bulletins, ni les calculs des résultats, ni la base Supabase ; aucune nouvelle migration n'est nécessaire.

## Organisation

- `src/lib/league.ts` : logique métier (niveaux L1–M2, parcours, échelle, enjeux de la finale).
- `src/lib/data.ts` : chargement des données (Supabase, ou fixture en local).
- `supabase/` : schéma et données de départ.
