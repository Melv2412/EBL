// Copie les logos et photos du site dans video/public/ pour la bande-annonce,
// ainsi que le morceau de brouillons/ s'il est présent.
import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../public");
const drafts = path.resolve(here, "../../brouillons");
const out = path.resolve(here, "../public");

await mkdir(out, { recursive: true });
for (const dir of ["logos", "photos"]) await cp(path.join(site, dir), path.join(out, dir), { recursive: true });
const song = (await readdir(drafts).catch(() => [])).find((f) => /rip daishi/i.test(f) && f.endsWith(".mp3"));
if (song) await cp(path.join(drafts, song), path.join(out, "song.mp3"));
console.log(`Logos et photos copiés dans video/public/${song ? `, morceau : ${song}` : ""}`);
