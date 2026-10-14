// Lit la ligue dans Supabase (clé publique, lecture seule) et prépare src/data.json
// pour la vidéo, avec les logos copiés dans video/public/.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.resolve(here, "..");

const env = Object.fromEntries(
  (await readFile(path.join(root, ".env.local"), "utf8"))
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquent dans .env.local");

const get = async (table, query) => {
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`${table} : ${res.status} ${await res.text()}`);
  return res.json();
};

const [promos, series] = await Promise.all([
  get("promos", "select=number,name,entry_year,logo_url,color_primary,color_secondary&order=number"),
  get("series", "select=edition_year,round,winner&round=eq.finale&winner=not.is.null&order=edition_year"),
]);

const LEVELS = ["L1", "L2", "L3", "M1", "M2"];
const byNumber = new Map(promos.map((p) => [p.number, p]));

// Logos locaux du site copiés pour Remotion ; les logos envoyés depuis l'admin sont des URL.
await mkdir(path.join(out, "public/logos"), { recursive: true });
const logo = async (u) => {
  if (!u) return null;
  if (/^https?:/.test(u)) return u;
  const rel = u.replace(/^\//, "");
  await copyFile(path.join(root, "public", rel), path.join(out, "public", rel));
  return rel;
};
await copyFile(path.join(root, "public/logos/ebl.jpeg"), path.join(out, "public/logos/ebl.jpeg"));

const shown = [];
for (const p of promos) {
  if (!p.name && !p.logo_url) continue; // promos sans identité connue : pas à l'écran
  shown.push({ number: p.number, name: p.name ?? `IT${p.number}`, logo: await logo(p.logo_url), primary: p.color_primary, secondary: p.color_secondary });
}

const champions = series
  .map((s) => {
    const p = byNumber.get(s.winner);
    if (!p) return null;
    // Les anciens revenus jouer après le M2 comptent dans la case M2 (« M2 et + »).
    const i = s.edition_year - p.entry_year;
    const level = i < 0 ? undefined : LEVELS[Math.min(i, LEVELS.length - 1)];
    if (!level) return null;
    return { level, season: `${s.edition_year}-${String(s.edition_year + 1).slice(2)}`, number: p.number };
  })
  .filter(Boolean);

const data = { since: 2019, site: "ebl-zeta.vercel.app", promos: shown, champions };
await writeFile(path.join(out, "src/data.json"), JSON.stringify(data, null, 2));
console.log(`${shown.length} promos, ${champions.length} champions →`, champions.map((c) => `IT${c.number} ${c.level} ${c.season}`).join(", "));
