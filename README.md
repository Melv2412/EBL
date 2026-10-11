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

## Organisation

- `src/lib/league.ts` : logique métier (niveaux L1–M2, parcours, échelle, enjeux de la finale).
- `src/lib/data.ts` : chargement des données (Supabase, ou fixture en local).
- `supabase/` : schéma et données de départ.
