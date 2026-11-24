# Règles du basket EBL

À l'attention du responsable de ClubSport. Ce document décrit comment se joue le basket inter-promos de l'ESATIC (EBL) et ce que ClubSport doit en afficher.

## 1. Le principe

- **Le site EBL (https://ebl-zeta.vercel.app) est la seule source pour le basket.** Les résultats y sont saisis par l'organisation du basket.
- **ClubSport affiche un résumé** des données d'EBL. Pour l'instant, on les recopie à la main.
- Les données vont seulement d'EBL vers ClubSport. Avec une seule saisie, les deux sites ne peuvent pas se contredire.

## 2. Les équipes

- Une équipe = une promo (IT11, IT12, IT13…), pas une classe.
- Toutes les promos jouent, de la L1 au M2. Les anciens peuvent revenir porter les couleurs de leur promo.
- Une promo garde son numéro IT d'une saison à l'autre. Son niveau (L1, L2, L3, M1, M2) change chaque année.
- Une promo peut avoir un nom (ex. IT15 « Dragons »). À l'affichage, on montre le nom s'il existe, avec le code IT en complément.

## 3. Le format d'une saison

1. **Poule unique.** Chaque promo joue une fois contre chacune des autres, en match sec.
2. **Demi-finales au meilleur des 3** : le 1er de la poule contre le 4e, le 2e contre le 3e. La première équipe à 2 victoires est qualifiée.
3. **Finale** : un match sec, joué le jour des finales multisports.

Il n'y a pas de match nul au basket.

## 4. Le classement de la poule

### L'ordre du classement

1. **Le nombre de victoires.**
2. À égalité de victoires : **la différence de points** (points marqués moins points encaissés, sur tous les matchs de poule).
3. Si ça ne suffit pas : **le total des points marqués**.

Il n'y a pas de critère de match direct. Si A a battu B mais que B a une meilleure différence de points, B passe devant.

### La colonne « Pts » (affichée, mais ne sert pas à classer)

| Résultat | Pts |
|---|---|
| Victoire | 2 |
| Défaite | 1 |
| Défaite par forfait | 0 |

Ce n'est pas le barème du foot (3 / 1 / 0).

### Forfait

- L'équipe qui déclare forfait **perd 20-0**. C'est une défaite, avec 0 Pts au lieu de 1.
- Le 20-0 compte dans la différence de points et dans les points marqués.
- Un match gagné par forfait n'a pas de MVP.
- En demi-finale, un forfait compte comme un match perdu de la série.

Le site EBL calcule ce classement automatiquement. Sur ClubSport, le plus simple est de recopier l'ordre affiché par EBL.

## 5. Ce que ClubSport reçoit pour chaque match

- Les deux promos ;
- la phase : Poule, Demi (manche 1, 2 ou 3) ou Finale ;
- la date, l'heure et le lieu ;
- le score final, avec la mention « forfait » s'il y a lieu ;
- le **MVP** : nom du joueur et promo ;
- un lien vers la page du match sur EBL.

**Rien d'autre.** L'EBL ne relève ni les points de chaque joueur, ni les rebonds, ni les passes, ni la chronologie panier par panier. Personne n'est chargé de noter toutes les stats pendant les matchs.

## 6. Ce que ClubSport doit adapter pour le basket

- **Statistiques** : remplacer « Meilleurs marqueurs (Basket) » par un **palmarès MVP**. Un classement des marqueurs ne contiendrait que les MVP, il serait donc faux.
- **Fiche match** : afficher le score, le MVP, la phase, la date, le lieu et le lien « Voir sur EBL ». Aucun événement daté à la minute (Panier, Rebond, Passe, Interception).
- **Joueurs** : ne créer que les joueurs qui ont été MVP. On crée un joueur sur ClubSport la première fois qu'il est élu MVP (nom, promo, poste et photo repris d'EBL). Ses titres de MVP s'ajoutent ensuite à sa fiche. C'est la même logique qu'au foot, où seuls les buteurs et les MVP sont enregistrés.
- **Classement** : par nombre de victoires, puis différence de points, puis points marqués (section 4). Colonne Pts en 2 / 1 / 0, pas le barème du foot.
- **Groupes** : une seule poule.

## 7. Questions pour toi

1. Sur ClubSport, comment le MVP d'un match est-il relié à un joueur : par un nom tapé à la main, ou en choisissant une fiche joueur existante ?
2. Sur une fiche joueur, le compteur « Matchs joués » compte-t-il les matchs de l'équipe, ou seulement les matchs où le joueur a un événement ? Dans le second cas, il vaudrait mieux le masquer sur les fiches basket et n'afficher que les titres de MVP.
3. Peux-tu donner à Melvin un accès admin limité au basket, pour qu'il fasse la saisie lui-même ?
4. Plus tard, serais-tu d'accord pour que ClubSport lise automatiquement les données d'EBL ? Voir la section 8.

## 8. Plus tard (si tu es d'accord)

EBL pourrait publier un flux public en lecture seule, `/api/basket/v1`, au format JSON. Il contiendrait les équipes, les matchs (statut, phase, édition), les scores, les MVP et les forfaits, avec une date de mise à jour pour chaque élément. ClubSport le lirait, et la recopie à la main disparaîtrait.

EBL n'aurait besoin d'aucun accès à ClubSport, ni à sa base, ni à son code. Le numéro de version dans l'adresse permet de faire évoluer le flux sans casser ton site.
