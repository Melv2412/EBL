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

1. **Le pourcentage de victoires** (victoires ÷ matchs joués).
2. À égalité : **la différence de points** (points marqués moins points encaissés, sur tous les matchs de poule).
3. Si ça ne suffit pas : **le total des points marqués**.

Une équipe qui n'a encore joué aucun match est classée après toutes celles qui ont joué.

Il n'y a pas de critère de match direct. Si A a battu B mais que B a une meilleure différence de points, B passe devant.

Le pourcentage permet d'avoir un classement juste en cours de poule. Une équipe à 1 victoire en 1 match (100 %) passe devant une équipe à 1 victoire et 1 défaite (50 %), même si celle-ci a joué plus. En fin de poule, tout le monde a joué le même nombre de matchs : l'ordre est alors celui du nombre de victoires.

Il n'y a pas de points au classement (ni 2 / 1 / 0, ni le 3 / 1 / 0 du foot). Le tableau affiche J, V, D, points marqués / encaissés, différence et %.

### Forfait

- L'équipe qui déclare forfait **perd 20-0**. C'est une défaite.
- Le 20-0 compte dans le pourcentage, dans la différence de points et dans les points marqués.
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
- **Classement** : au pourcentage de victoires, puis différence de points, puis points marqués ; les équipes sans match en dernier (section 4). Pas de points au classement, pas le barème du foot.
- **Groupes** : une seule poule.

## 7. Questions pour toi

1. Sur ClubSport, comment le MVP d'un match est-il relié à un joueur : par un nom tapé à la main, ou en choisissant une fiche joueur existante ?
2. Sur une fiche joueur, le compteur « Matchs joués » compte-t-il les matchs de l'équipe, ou seulement les matchs où le joueur a un événement ? Dans le second cas, il vaudrait mieux le masquer sur les fiches basket et n'afficher que les titres de MVP.
3. Peux-tu donner à Melvin un accès admin limité au basket, pour qu'il fasse la saisie lui-même ?
4. Plus tard, serais-tu d'accord pour que ClubSport lise automatiquement les données d'EBL ? Voir la section 8.

## 8. Plus tard (si tu es d'accord)

EBL pourrait publier un flux public en lecture seule, à l'adresse `https://ebl-zeta.vercel.app/api/basket/v1`. Ce n'est pas une page à regarder : elle renvoie les données au format JSON. Le flux contiendrait :

- les équipes ;
- les matchs (statut, phase, édition) ;
- les scores ;
- les MVP ;
- les forfaits ;
- une date de mise à jour pour chaque élément.

### Comment ça marcherait

1. L'organisation du basket saisit un résultat dans l'admin EBL, comme aujourd'hui.
2. EBL met aussitôt le flux à jour.
3. **C'est ClubSport qui vient lire le flux.** EBL n'envoie rien vers ClubSport et n'écrit jamais dans son site.
4. ClubSport affiche ensuite ces données à sa façon.

La recopie à la main disparaît : on saisit une seule fois, dans EBL.

### Quand ClubSport est-il à jour ?

C'est toi qui décides comment ClubSport lit le flux :

- **à chaque visite d'une page basket** : ClubSport est à jour immédiatement ;
- **à intervalle régulier**, par exemple toutes les 5 ou 15 minutes, avec les données gardées en cache entre deux lectures : une nouvelle donnée peut mettre jusqu'à ce délai à apparaître.

### Ce que chacun doit faire

- **EBL** : créer le flux.
- **ClubSport** : écrire le code qui lit le flux et range les données dans tes pages basket.

### Pourquoi ClubSport lit, au lieu qu'EBL envoie

- EBL n'a besoin d'aucun accès à ClubSport : ni à sa base, ni à son code.
- Si un des deux sites a un problème, l'autre continue de fonctionner. ClubSport garde la dernière version lue.
- Le numéro de version dans l'adresse (`v1`) permet de faire évoluer le flux sans casser ton site. Une version incompatible serait publiée en `v2`, et `v1` resterait en place.
