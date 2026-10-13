# Vidéo EBL (Remotion)

Vidéo verticale de 30 secondes (1080 × 1920) qui présente l'EBL : intro, le concept (une promo, une équipe, une cravate par niveau), les promos, l'échelle des champions, puis l'appel au site.

Tout vient de la base Supabase au moment du rendu : quand une édition se termine ou qu'une promo change de logo, il suffit de relancer le rendu.

## Générer la vidéo

```bash
cd video
npm install
npm run render
```

Le fichier sort dans `video/out/ebl.mp4`.

`npm run render` enchaîne trois étapes :

1. `npm run data` lit les promos et les champions dans Supabase (clé publique de `../.env.local`) et copie les logos.
2. `npm run music` compose la bande-son par synthèse (aucune musique tierce) dans `public/music.wav`.
3. Remotion assemble la vidéo.

Pour réutiliser Microsoft Edge au lieu de télécharger le navigateur de Remotion, ajoute
`-- --browser-executable="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` à la commande.

## Modifier

- `npm run studio` ouvre un aperçu interactif dans le navigateur.
- `src/timeline.json` : durée et découpage des scènes (la musique suit les mêmes repères).
- `src/EblVideo.tsx` : les scènes.
