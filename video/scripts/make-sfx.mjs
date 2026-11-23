// Bruitages de la bande-annonce « TrailerSon », synthétisés (aucun sample tiers).
// Fabrique chaque effet, puis les place sur une seule piste stéréo : public/sfx.wav (lue par src/TrailerSon.tsx).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../public/sfx.wav");

const RATE = 44100;
const TAU = 2 * Math.PI;
const BAR = 4 * 0.4603; // une mesure de « RIP DAISHI »

let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

/** Filtre biquad (RBJ) dont la fréquence peut varier à chaque échantillon. */
function biquad(type, q = 0.8) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, freq) => {
    const w = (TAU * Math.min(freq, RATE * 0.45)) / RATE;
    const a = Math.sin(w) / (2 * q);
    const c = Math.cos(w);
    let b0, b1, b2;
    if (type === "lp") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
    else if (type === "hp") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    else [b0, b1, b2] = [a, 0, -a]; // passe-bande
    const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/** Rend `len` secondes ; `fn(t)` renvoie un nombre (mono) ou [gauche, droite]. */
function render(len, fn) {
  const n = Math.floor(len * RATE);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = fn(i / RATE);
    if (Array.isArray(v)) [L[i], R[i]] = v;
    else L[i] = R[i] = v;
  }
  return [L, R];
}

/** Effets normalisés, mixés à la fin sur une seule piste. */
const FX = {};
async function save(name, [L, R]) {
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.9 / (peak || 1);
  FX[name] = [L.map((x) => x * g), R.map((x) => x * g)];
}

async function writeWav(file, [L, R]) {
  const pcm = Buffer.alloc(44 + L.length * 4);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + L.length * 4, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(2, 22);
  pcm.writeUInt32LE(RATE, 24);
  pcm.writeUInt32LE(RATE * 4, 28);
  pcm.writeUInt16LE(4, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(L.length * 4, 40);
  for (let i = 0; i < L.length; i++) {
    pcm.writeInt16LE(Math.round(Math.tanh(L[i]) * 32767), 44 + i * 4);
    pcm.writeInt16LE(Math.round(Math.tanh(R[i]) * 32767), 46 + i * 4);
  }
  await writeFile(file, pcm);
}

// Obturateur : claquement du miroir puis du rideau, sec et aigu.
{
  const hp = biquad("hp", 0.7);
  const bp = biquad("bp", 4);
  const click = (t) => (t < 0 ? 0 : Math.exp(-t * 260));
  await save(
    "shutter",
    render(0.14, (t) => {
      const e = click(t) + 0.7 * click(t - 0.048);
      const x = noise() * e;
      return 0.8 * hp(x, 2500) + 1.2 * bp(x, 5200) + 0.25 * Math.sin(TAU * 1900 * t) * click(t - 0.048);
    }),
  );
}

// Whoosh : souffle filtré qui balaie, avec passage d'un côté à l'autre.
for (const [name, from] of [["whoosh-lr", -1], ["whoosh-rl", 1], ["whoosh", 0]]) {
  const bp = biquad("bp", 1.4);
  const len = 0.5;
  await save(
    name,
    render(len, (t) => {
      const u = t / len;
      const env = Math.sin(Math.PI * Math.min(1, u ** 0.8)) ** 2;
      const s = bp(noise(), 300 + 2600 * Math.sin(Math.PI * u)) * env;
      const pan = from * (1 - 2 * u); // -1 = gauche
      const a = (pan + 1) / 2;
      return [s * Math.cos((a * Math.PI) / 2), s * Math.sin((a * Math.PI) / 2)];
    }),
  );
}

// Aspiration inversée (cymbale à l'envers) : monte pendant une mesure et se coupe net sur le drop.
{
  const hp = biquad("hp", 0.7);
  const bp = biquad("bp", 2);
  await save(
    "riser",
    render(BAR, (t) => {
      const u = t / BAR;
      const env = u ** 3;
      return env * (hp(noise(), 3000) + 0.5 * bp(noise(), 400 + 5000 * u) + 0.15 * Math.sin(TAU * (80 + 400 * u * u) * t));
    }),
  );
}

// Gros impact : boom grave, attaque de bruit et cymbale qui s'étire.
function impact(len, cymbal) {
  const lp = biquad("lp", 0.7);
  const hp = biquad("hp", 0.7);
  return render(len, (t) => {
    const boom = Math.sin(TAU * (32 * t + (90 / 9) * (1 - Math.exp(-t * 9)))) * Math.exp(-t * 3.2);
    const crack = lp(noise(), 1800) * Math.exp(-t * 30);
    const cym = cymbal ? hp(noise(), 6000) * Math.exp(-t * 1.6) * Math.min(1, t / 0.004) : 0;
    return Math.tanh(1.6 * boom + 1.2 * crack) + 0.35 * cym;
  });
}
await save("impact", impact(3, true));
await save("hit", impact(1.2, false));

// Onde de choc : impact suivi d'un grondement grave qui roule.
{
  const lp = biquad("lp", 0.9);
  const crackLp = biquad("lp", 0.7);
  await save(
    "shockwave",
    render(3, (t) => {
      const boom = Math.sin(TAU * (28 * t + (110 / 7) * (1 - Math.exp(-t * 7)))) * Math.exp(-t * 2.2);
      const rumble = lp(noise(), 120 + 200 * Math.exp(-t * 2)) * 6 * Math.exp(-t * 1.3) * Math.min(1, t / 0.05);
      const crack = crackLp(noise(), 2500) * Math.exp(-t * 25);
      return Math.tanh(1.4 * boom + rumble + crack);
    }),
  );
}

// Rebond de ballon sur le parquet : coup grave et creux.
{
  const bp = biquad("bp", 6);
  await save(
    "bounce",
    render(0.3, (t) => {
      const thump = Math.sin(TAU * (70 * t + (120 / 40) * (1 - Math.exp(-t * 40)))) * Math.exp(-t * 22);
      const shell = bp(noise(), 520) * Math.exp(-t * 30) * 3;
      const slap = noise() * Math.exp(-t * 400) * 0.6;
      return thump + shell + slap;
    }),
  );
}

// Crissement de baskets : deux couinements aigus et rugueux.
{
  const chirp = (t0, len, f0, f1) => {
    let phase = 0;
    return (t) => {
      const u = (t - t0) / len;
      if (u < 0 || u > 1) return 0;
      phase += (TAU * (f0 + (f1 - f0) * Math.sin(Math.PI * u * 0.8))) / RATE;
      const rough = 1 + 0.5 * Math.sin(TAU * 95 * t);
      return Math.sin(Math.PI * u) ** 0.6 * rough * (Math.sin(phase) + 0.4 * Math.sin(2 * phase));
    };
  };
  const a = chirp(0, 0.14, 1700, 2500);
  const b = chirp(0.17, 0.1, 2100, 2800);
  const hp = biquad("hp", 0.7);
  await save("squeak", render(0.3, (t) => a(t) + 0.8 * b(t) + 0.15 * hp(noise(), 3000) * (a(t) !== 0 ? 1 : 0)));
}

// Sifflet d'arbitre : coup long, avec le roulement de la bille.
{
  const bp = biquad("bp", 3);
  const len = 1.1;
  let phase = 0;
  await save(
    "whistle",
    render(len, (t) => {
      const env = Math.min(1, t / 0.03) * Math.min(1, (len - t) / 0.12);
      const trill = 1 - 0.55 * (0.5 + 0.5 * Math.sin(TAU * 31 * t));
      phase += (TAU * (3150 + 70 * Math.sin(TAU * 31 * t))) / RATE;
      const tone = Math.sin(phase) + 0.2 * Math.sin(2 * phase);
      return env * (trill * tone + 0.25 * bp(noise(), 3150));
    }),
  );
}

// ---------- Placement sur la vidéo ----------
// Même grille que src/TrailerSon.tsx (RIP DAISHI, 130,4 BPM) : garder ces valeurs identiques.
const FPS = 30;
const TOTAL = 45 * FPS;
const BEAT = 0.4603;
const DROP = 29.7 - 18.65;
const fr = (s) => Math.round(s * FPS);
const bar = (k) => fr(DROP + k * BAR);
const beat = (k) => fr(DROP + k * BEAT);

const memoryCuts = [
  ...Array.from({ length: 8 }, (_, k) => beat(-12 + k)),
  ...Array.from({ length: 8 }, (_, k) => fr(DROP - BAR + (k * BEAT) / 2)),
].filter((c) => c < fr(DROP - 0.18));
const tensionCuts = [0, 1, 2, 3].map((k) => beat(14 * 4 + k));

/** [image, effet, volume] */
const CUES = [
  // Ouverture des barres cinéma.
  [0, "whoosh", 0.35],
  // Souvenirs : un déclic par photo, la rafale sur la dernière mesure, puis l'aspiration jusqu'au drop.
  ...memoryCuts.map((at, k) => [at, "shutter", k < 8 ? 0.5 : 0.42]),
  [fr(DROP - BAR), "riser", 0.45],
  // Drop IT14.
  [bar(0), "impact", 0.85],
  // Prétendants : le logo arrive de gauche, puis de droite (le souffle culmine à l'arrivée).
  ...[6, 7, 8, 9].map((k, i) => [bar(k) - 6, i % 2 ? "whoosh-rl" : "whoosh-lr", 0.45]),
  // IT15 puis VS (deux coups : les logos, puis « VS »).
  [bar(11), "shockwave", 0.85],
  [bar(13), "hit", 0.6],
  [bar(13) + 6, "hit", 0.8],
  // « Chaque match compte. » : dribble sur les temps, crissements.
  ...tensionCuts.map((at) => [at, "bounce", 0.6]),
  [tensionCuts[0], "squeak", 0.25],
  [tensionCuts[2], "squeak", 0.2],
  // La date, puis le coup de sifflet final avec le site.
  [bar(16), "impact", 0.95],
  [beat(16 * 4 + 6), "whistle", 0.32],
];

const n = Math.ceil((TOTAL / FPS) * RATE);
const mix = [new Float32Array(n), new Float32Array(n)];
for (const [at, name, vol] of CUES) {
  const i0 = Math.round((at / FPS) * RATE);
  const fx = FX[name];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < fx[c].length && i0 + i < n; i++) mix[c][i0 + i] += fx[c][i] * vol;
}
await mkdir(path.dirname(out), { recursive: true });
await writeWav(out, mix);
console.log(`sfx.wav : ${CUES.length} bruitages placés`);
