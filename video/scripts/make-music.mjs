// Compose la bande-son de la vidéo par synthèse (aucun sample, aucune musique tierce)
// et l'écrit en WAV dans public/music.wav. Les repères suivent src/timeline.ts.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..");
const T = JSON.parse(await readFile(path.join(out, "src/timeline.json"), "utf8"));
const data = JSON.parse(await readFile(path.join(out, "src/data.json"), "utf8"));

const RATE = 44100;
const DURATION = T.total / T.fps;
const buf = new Float32Array(Math.ceil(RATE * DURATION));
const sec = (frame) => frame / T.fps;

// Bruit déterministe : le même rendu à chaque fois.
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(start, length, fn) {
  const i0 = Math.max(0, Math.floor(start * RATE));
  const n = Math.min(buf.length - i0, Math.floor(length * RATE));
  for (let i = 0; i < n; i++) buf[i0 + i] += fn(i / RATE);
}

const kick = (t0, v = 1) =>
  add(t0, 0.35, (t) => {
    const f = 45 + 85 * Math.exp(-t * 30);
    return v * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9);
  });

const snare = (t0, v = 0.5) => {
  let prev = 0;
  add(t0, 0.2, (t) => {
    const n = noise();
    const hp = n - prev; // passe-haut grossier : plus « claquant »
    prev = n;
    return v * (0.7 * hp * Math.exp(-t * 22) + 0.4 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30));
  });
};

const hat = (t0, v = 0.12) => {
  let prev = 0;
  add(t0, 0.05, (t) => {
    const n = noise();
    const hp = n - prev;
    prev = n;
    return v * hp * Math.exp(-t * 90);
  });
};

const bass = (t0, freq, len, v = 0.32) =>
  add(t0, len, (t) => {
    const env = Math.min(1, t * 200) * Math.exp(-t * 3.5);
    const w = 2 * Math.PI * freq * t;
    return v * env * (Math.sin(w) + 0.35 * Math.sin(2 * w) + 0.15 * Math.sin(3 * w));
  });

/** Rebond de ballon sur le parquet. */
const bounce = (t0, v = 0.9) => {
  add(t0, 0.18, (t) => {
    const f = 70 + 90 * Math.exp(-t * 60);
    return v * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 28);
  });
  add(t0, 0.02, (t) => 0.25 * v * noise() * Math.exp(-t * 300));
};

const pop = (t0, freq = 880, v = 0.22) =>
  add(t0, 0.15, (t) => v * Math.sin(2 * Math.PI * freq * t * (1 + 0.6 * Math.exp(-t * 40))) * Math.exp(-t * 25));

const pad = (t0, len, freqs, v = 0.05) =>
  add(t0, len, (t) => {
    const env = Math.min(1, t / 0.8) * Math.min(1, (len - t) / 0.8);
    return v * env * freqs.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t), 0);
  });

const riser = (t0, len, v = 0.35) => {
  let prev = 0;
  add(t0, len, (t) => {
    const n = noise();
    const hp = n - prev;
    prev = n;
    const k = t / len;
    return v * k * k * (0.6 * hp + 0.4 * Math.sin(2 * Math.PI * (200 + 900 * k) * t));
  });
};

const crash = (t0, v = 0.35) => {
  let prev = 0;
  add(t0, 1.8, (t) => {
    const n = noise();
    const hp = n - prev;
    prev = n;
    return v * hp * Math.exp(-t * 2.2);
  });
};

// ---------- Intro : le logo rebondit ----------
const intro = T.scenes.intro;
pad(0, sec(intro.end) + 0.4, [110, 164.81, 220], 0.035);
for (const f of T.bounces) bounce(sec(f), 0.95 - 0.12 * T.bounces.indexOf(f));

// ---------- Beat de 96 BPM du concept jusqu'à l'outro ----------
const BPM = 96;
const beat = 60 / BPM;
const beatStart = sec(T.scenes.concept.start);
const beatEnd = sec(T.scenes.outro.start) - beat; // une mesure de silence avant le final
const ROOTS = [55, 43.65, 65.41, 49]; // la, fa, do, sol
const promosStart = sec(T.scenes.promos.start);

for (let b = 0, t = beatStart; t < beatEnd; b++, t = beatStart + b * beat) {
  const inBar = b % 4;
  kick(t, inBar === 0 ? 1 : 0.8);
  if (inBar === 1 || inBar === 3) snare(t);
  if (inBar === 2 && b % 8 === 6) kick(t + beat / 2, 0.6); // petite relance
  hat(t + beat / 2);
  if (t >= promosStart) {
    hat(t + beat / 4, 0.06);
    hat(t + (3 * beat) / 4, 0.06);
  }
  const root = ROOTS[Math.floor(b / 4) % ROOTS.length];
  bass(t, root, beat * 0.9);
  bass(t + beat / 2, root * (b % 2 ? 1.5 : 2), beat * 0.4, 0.2);
}

// Les cravates apparaissent : une note montante chacune.
T.ties.forEach((f, i) => pop(sec(f), 523.25 * Math.pow(2, i / 6)));
// Chaque promo : un impact au changement.
const perPromo = Math.floor((T.scenes.promos.end - T.scenes.promos.start) / Math.max(1, data.promos.length));
data.promos.forEach((_, i) => {
  const f = T.scenes.promos.start + i * perPromo;
  kick(sec(f), 0.9);
  pop(sec(f) + 0.05, 659.25, 0.12);
});
// Palmarès : un rebond par champion qui tombe dans sa case.
data.champions.forEach((_, i) => bounce(sec(T.scenes.palmares.start + T.dropDelay + i * T.dropStep + 12), 0.8));

// ---------- Outro ----------
const outro = sec(T.scenes.outro.start);
riser(outro - 1.6, 1.6);
kick(outro, 1.2);
crash(outro, 0.3);
pad(outro, DURATION - outro, [110, 138.59, 164.81, 220], 0.05);

// ---------- Mixage : normalisation, fondu de fin, WAV 16 bits ----------
let peak = 0;
for (const s of buf) peak = Math.max(peak, Math.abs(s));
const gain = 0.89 / (peak || 1);
const fade = Math.floor(RATE * 1.2);
const pcm = Buffer.alloc(44 + buf.length * 2);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(36 + buf.length * 2, 4);
pcm.write("WAVEfmt ", 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(RATE, 24);
pcm.writeUInt32LE(RATE * 2, 28);
pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(buf.length * 2, 40);
for (let i = 0; i < buf.length; i++) {
  const f = i > buf.length - fade ? (buf.length - i) / fade : 1;
  // Légère saturation douce pour arrondir les pics.
  const s = Math.tanh(buf[i] * gain * f * 1.1);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2);
}
await mkdir(path.join(out, "public"), { recursive: true });
await writeFile(path.join(out, "public/music.wav"), pcm);
console.log(`music.wav : ${DURATION}s, ${(pcm.length / 1024 / 1024).toFixed(1)} Mo`);
