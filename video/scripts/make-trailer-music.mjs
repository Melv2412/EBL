// Bande-son de la bande-annonce, entièrement synthétisée (aucun sample, aucune musique tierce).
// Écrit public/trailer.wav ; les repères suivent src/trailer.json.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..");
const T = JSON.parse(await readFile(path.join(out, "src/trailer.json"), "utf8"));
const S = T.scenes;
const Q = T.cues;

const RATE = 44100;
const DURATION = T.total / T.fps;
const buf = new Float32Array(Math.ceil(RATE * DURATION));
const sec = (frame) => frame / T.fps;
const TAU = 2 * Math.PI;

let seed = 11;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(start, length, fn) {
  const i0 = Math.max(0, Math.floor(start * RATE));
  const n = Math.min(buf.length - i0, Math.floor(length * RATE));
  for (let i = 0; i < n; i++) buf[i0 + i] += fn(i / RATE);
}

/** Bruit filtré passe-bas, coupure variable dans le temps (0..1). */
function lowNoise(cutoff) {
  let y = 0;
  return (t) => {
    y += cutoff(t) * (noise() - y);
    return y;
  };
}

const kick = (t0, v = 1) =>
  add(t0, 0.4, (t) => v * Math.sin(TAU * (42 + 90 * Math.exp(-t * 28)) * t) * Math.exp(-t * 8));

const taiko = (t0, v = 0.8) => {
  const n = lowNoise(() => 0.08);
  add(t0, 0.6, (t) => v * (Math.sin(TAU * (55 + 85 * Math.exp(-t * 18)) * t) + 0.5 * n(t)) * Math.exp(-t * 6.5));
};

const snare = (t0, v = 0.45) => {
  let prev = 0;
  add(t0, 0.22, (t) => {
    const x = noise();
    const hp = x - prev;
    prev = x;
    return v * (0.8 * hp * Math.exp(-t * 20) + 0.4 * Math.sin(TAU * 185 * t) * Math.exp(-t * 28));
  });
};

const hat = (t0, v = 0.1) => {
  let prev = 0;
  add(t0, 0.05, () => {
    const x = noise();
    const hp = x - prev;
    prev = x;
    return v * hp;
  });
};

const tick = (t0, v = 0.25) => add(t0, 0.035, (t) => v * (0.7 * Math.sin(TAU * 2600 * t) + 0.3 * noise()) * Math.exp(-t * 170));

/** « Braam » de cuivres graves façon bande-annonce : harmoniques riches, attaque courte, longue queue. */
const braam = (t0, root = 36.71, len = 3.2, v = 0.5) => {
  const voices = [root, root * 1.003, root * 1.5, root * 2, root * 2.997];
  add(t0, len, (t) => {
    const env = Math.min(1, t / 0.05) * Math.exp(-t * (1.6 / len) * 2);
    let s = 0;
    for (const f of voices) for (let h = 1; h <= 9; h++) s += Math.sin(TAU * f * h * t + h) / h ** 1.25;
    return v * env * Math.tanh(s * 0.5);
  });
};

const subDrop = (t0, len = 1.6, v = 0.7) =>
  add(t0, len, (t) => {
    const phase = TAU * (28 * t + (70 / 2.2) * (1 - Math.exp(-t * 2.2)));
    return v * Math.sin(phase) * Math.min(1, t * 80) * (1 - t / len);
  });

const hit = (t0, v = 1) => {
  kick(t0, 1.2 * v);
  taiko(t0, 0.7 * v);
  add(t0, 0.08, (t) => 0.5 * v * noise() * Math.exp(-t * 60));
};

const crash = (t0, v = 0.3, len = 2.2) => {
  let prev = 0;
  add(t0, len, (t) => {
    const x = noise();
    const hp = x - prev;
    prev = x;
    return v * hp * Math.exp(-t * (4.5 / len));
  });
};

/** Souffle de passage : monte puis retombe (ou monte seulement jusqu'à la coupe). */
const whoosh = (t0, len, v = 0.35, cutAtEnd = false) => {
  const n = lowNoise((t) => 0.02 + 0.25 * (t / len));
  add(t0, len, (t) => {
    const k = t / len;
    const env = cutAtEnd ? k * k : Math.sin(Math.PI * k) ** 2;
    return v * env * n(t);
  });
};

const riser = (t0, len, v = 0.35) => {
  const n = lowNoise((t) => 0.03 + 0.4 * (t / len) ** 2);
  add(t0, len, (t) => {
    const k = t / len;
    return v * k * k * (0.6 * n(t) + 0.4 * Math.sin(TAU * (120 + 900 * k * k) * t));
  });
};

const heartbeat = (t0, v = 0.9) => {
  const thump = (at, a) => add(at, 0.25, (t) => a * Math.sin(TAU * (48 + 30 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14));
  thump(t0, v);
  thump(t0 + 0.24, v * 0.65);
};

const glint = (t0, v = 0.18) =>
  add(t0, 1.1, (t) => v * (Math.sin(TAU * 2093 * t) + 0.5 * Math.sin(TAU * 3136 * t)) * Math.exp(-t * 4) * Math.min(1, t * 40));

/** Grondement du dragon : bruit grave modulé et voix rauque, sans enregistrement animal. */
const roar = (t0, len = 1.8, v = 0.55) => {
  const n = lowNoise(() => 0.06);
  add(t0, len, (t) => {
    const env = Math.min(1, t / 0.12) * Math.max(0, 1 - t / len) ** 0.6;
    const growl = 0.5 + 0.5 * Math.sin(TAU * 31 * t);
    const f = 62 + 8 * Math.sin(TAU * 5 * t);
    let saw = 0;
    for (let h = 1; h <= 8; h++) saw += Math.sin(TAU * f * h * t) / h;
    return v * env * (0.7 * n(t) * growl * 2.5 + 0.35 * saw * growl);
  });
};

const drone = (t0, len, freqs, v = 0.05) =>
  add(t0, len, (t) => {
    const env = Math.min(1, t / 1.2) * Math.min(1, (len - t) / 0.8);
    const lfo = 0.75 + 0.25 * Math.sin(TAU * 0.3 * t);
    return v * env * lfo * freqs.reduce((s, f) => s + Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.004 * t), 0);
  });

const bassNote = (t0, freq, len, v = 0.28) =>
  add(t0, len, (t) => {
    const env = Math.min(1, t * 300) * Math.exp(-t * 6);
    let s = 0;
    for (let h = 1; h <= 6; h++) s += Math.sin(TAU * freq * h * t) / h;
    return v * env * s;
  });

const pop = (t0, freq, v = 0.2) =>
  add(t0, 0.18, (t) => v * Math.sin(TAU * freq * t * (1 + 0.5 * Math.exp(-t * 40))) * Math.exp(-t * 22));

const bounce = (t0, v = 0.8) => {
  add(t0, 0.18, (t) => v * Math.sin(TAU * (70 + 90 * Math.exp(-t * 60)) * t) * Math.exp(-t * 28));
  add(t0, 0.02, (t) => 0.25 * v * noise() * Math.exp(-t * 300));
};

const beat = 60 / T.bpm;
const D = 36.71;

// ---------- 1-2. Silence, horloge, souvenirs ----------
drone(0, sec(S.champions.start), [D, D * 1.5, D * 2], 0.045);
for (let f = 15; f < S.champions.start - 12; f += 15) tick(sec(f), f % 30 ? 0.16 : 0.24);
for (const c of Q.memoryCuts) {
  whoosh(sec(c) - 0.25, 0.4, 0.25);
  taiko(sec(c), 0.5);
}

// ---------- 3. Champions ----------
braam(sec(Q.championSlam), D, 3.6, 0.55);
hit(sec(Q.championSlam), 1.1);
subDrop(sec(Q.championSlam), 1.8);
crash(sec(Q.championSlam), 0.3, 3);
braam(sec(Q.championSlam + 78), D * 1.189, 3, 0.35);
drone(sec(Q.championSlam), sec(S.challenge.start - Q.championSlam), [D, D * 1.189, D * 1.5], 0.035);

// ---------- 4. Le défi ----------
heartbeat(sec(S.challenge.start + 4), 0.6);
heartbeat(sec(S.challenge.start + 30), 0.7);
whoosh(sec(Q.challengeSmash) - 0.45, 0.45, 0.4, true);
hit(sec(Q.challengeSmash), 1.2);
braam(sec(Q.challengeSmash), D * 2, 2.4, 0.45);
crash(sec(Q.challengeSmash), 0.28);

// ---------- 5. Les prétendants : percussions à 100 BPM ----------
const ROOTS = [D, D, D * 1.189, D * 0.891];
for (let b = 0, t = sec(S.contenders.start); t < sec(S.rookie.start) - 0.05; b++, t = sec(S.contenders.start) + b * beat) {
  taiko(t, b % 2 ? 0.55 : 0.8);
  if (b % 2) snare(t, 0.35);
  hat(t + beat / 2);
  bassNote(t, ROOTS[Math.floor(b / 2) % 4], beat * 0.45);
  bassNote(t + beat / 2, ROOTS[Math.floor(b / 2) % 4] * 2, beat * 0.4, 0.18);
}
for (const s of Q.contenderSlams) {
  whoosh(sec(s) - 0.3, 0.3, 0.3, true);
  hit(sec(s), 0.9);
}
hit(sec(Q.contenderSlams[3] + 30), 1);
crash(sec(Q.contenderSlams[3] + 30), 0.22);

// ---------- 6. IT15 ----------
drone(sec(S.rookie.start), sec(Q.rookieVs - S.rookie.start), [D * 0.5, D, D * 1.06], 0.05);
for (const h of Q.heartbeats) heartbeat(sec(h), 0.95);
glint(sec(Q.rookieReveal - 22));
whoosh(sec(Q.rookieReveal) - 0.7, 0.7, 0.45, true);
roar(sec(Q.rookieReveal), 2, 0.5);
braam(sec(Q.rookieReveal), D * 0.891, 3.2, 0.5);
subDrop(sec(Q.rookieReveal), 1.6);
hit(sec(Q.rookieReveal), 1);
hit(sec(Q.rookieVs), 1.1);
hit(sec(Q.rookieVs + 6), 0.9);
crash(sec(Q.rookieVs), 0.3);

// ---------- 7. L'échelle ----------
for (let b = 0, t = sec(S.ladder.start); t < sec(S.ready.start) - 0.05; b++, t = sec(S.ladder.start) + b * (beat / 2)) {
  if (b % 2 === 0) taiko(t, b % 4 ? 0.5 : 0.85);
  if (b % 4 === 2) snare(t, 0.4);
  hat(t, 0.07);
  hat(t + beat / 4, 0.05);
  if (b % 2 === 0) bassNote(t, ROOTS[Math.floor(b / 8) % 4], beat * 0.4);
}
for (const c of Q.ladderCuts) add(sec(c), 0.06, (t) => 0.3 * noise() * Math.exp(-t * 70));
Q.ties.forEach((f, i) => {
  pop(sec(f), 523.25 * 2 ** (i / 5));
  bounce(sec(f), 0.7);
});

// ---------- 8. Prépare-toi ----------
braam(sec(Q.readySlam), D, 2.5, 0.55);
hit(sec(Q.readySlam), 1.2);
hit(sec(Q.readySlam + 12), 1.2);
braam(sec(Q.readySlam + 12), D * 2, 2.2, 0.4);
whoosh(sec(Q.readyWave) - 0.2, 0.9, 0.4);
subDrop(sec(Q.readyWave), 1.4, 0.6);
riser(sec(Q.readyWave), sec(Q.readyCut - Q.readyWave), 0.45);
// Roulement qui accélère jusqu'à la coupe.
for (let t = sec(Q.readyWave), gap = 0.5; t < sec(Q.readyCut) - 0.04; t += gap, gap = Math.max(0.06, gap * 0.88)) {
  taiko(t, 0.35 + 0.5 * ((t - sec(Q.readyWave)) / sec(Q.readyCut - Q.readyWave)));
}

// ---------- 9. La date ----------
hit(sec(Q.dateHit), 1.4);
braam(sec(Q.dateHit), D, 4, 0.6);
subDrop(sec(Q.dateHit), 2);
crash(sec(Q.dateHit), 0.35, 3.5);
drone(sec(Q.dateHit), DURATION - sec(Q.dateHit), [D * 2, D * 3, D * 4.49], 0.03);
for (const [k, f] of [1290, 1306, 1316].entries()) bounce(sec(f), 0.8 - k * 0.2);

// Le silence avant chaque impact.
const mute = (from, to) => buf.fill(0, Math.floor(sec(from) * RATE), Math.floor(sec(to) * RATE));
mute(Q.readyCut, Q.dateHit);

// ---------- Mixage : normalisation, fondu de fin, WAV 16 bits ----------
let peak = 0;
for (const s of buf) peak = Math.max(peak, Math.abs(s));
const gain = 0.95 / (peak || 1);
const fade = Math.floor(RATE * 1);
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
  const s = Math.tanh(buf[i] * gain * f * 1.3);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2);
}
await mkdir(path.join(out, "public"), { recursive: true });
await writeFile(path.join(out, "public/trailer.wav"), pcm);
console.log(`trailer.wav : ${DURATION}s, ${(pcm.length / 1024 / 1024).toFixed(1)} Mo`);
