import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "./theme";
import {
  CYAN,
  RED,
  CourtLines,
  Crown,
  Embers,
  Flash,
  Glitch,
  Grain,
  LogoCard,
  PROMOS,
  Photo,
  Shockwave,
  Versus,
  clamp,
  label,
  photo,
  promo,
  shakeAt,
  title,
  type Promo,
} from "./Trailer";

// Grille mesurée sur « RIP DAISHI » (Jam$co) : 130,4 BPM, drop à 0:29.70, extrait 0:18.65 → 1:03.65.
export const FPS = 30;
export const TOTAL = 45 * FPS;
const SONG_START = 18.65;
const BEAT = 0.4603;
const BAR = 4 * BEAT;
const DROP = 29.7 - SONG_START;

const fr = (s: number) => Math.round(s * FPS);
const bar = (k: number) => fr(DROP + k * BAR);
const beat = (k: number) => fr(DROP + k * BEAT);
/** Impulsion sur chaque temps : 1 au temps, puis décroît. */
const pulse = (abs: number, sharp = 7) => {
  const t = (abs / FPS - DROP) / BEAT;
  return Math.exp(-(t - Math.floor(t)) * sharp);
};

const SC = {
  open: [0, bar(-3)],
  memories: [bar(-3), bar(0)],
  champions: [bar(0), bar(4)],
  challenge: [bar(4), bar(6)],
  contenders: [bar(6), bar(10)],
  rookie: [bar(10), bar(14)],
  tension: [bar(14), bar(16)],
  date: [bar(16), TOTAL],
} as const;
type Scene = keyof typeof SC;
const at = (scene: Scene, abs: number) => abs - SC[scene][0];

// ---------- 1. Le silence (3 mesures de montée) ----------

function Open() {
  const f = useCurrentFrame();
  const text = "Le terrain s'est tu.";
  const shown = Math.max(0, Math.floor((f - 24) / 6));
  const bars = [0, bar(-5), bar(-4)].map((b) => at("open", b));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Photo file="photos/all-ebl-arena.jpg" length={SC.open[1]} from={1.25} to={1.4} gray={1} opacity={interpolate(f, [0, 40], [0, 0.35], clamp)} />
      <CourtLines progress={interpolate(f, [8, 150], [0, 1], clamp)} opacity={0.14} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...title(92), whiteSpace: "nowrap" }}>
          {text.slice(0, shown)}
          <span style={{ color: C.teal, opacity: f % 14 < 7 ? 1 : 0 }}>_</span>
        </div>
      </AbsoluteFill>
      <Flash cues={bars.slice(1)} dur={8} peak={0.18} />
    </AbsoluteFill>
  );
}

// ---------- 2. Les souvenirs : une photo par temps, puis par demi-temps ----------

function Memories() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lastBar = at("memories", bar(-1));
  const cuts = [
    ...Array.from({ length: 8 }, (_, k) => at("memories", beat(-12 + k))),
    ...Array.from({ length: 8 }, (_, k) => at("memories", fr(DROP - BAR + (k * BEAT) / 2))),
  ].filter((c) => c < lastBar + 50);
  const files = [3, 12, 5, 9, 1, 2, 4, 8, 11, 13, 14, 6, 7, 10, 3, 12];
  const i = Math.max(0, cuts.filter((c) => f >= c).length - 1);
  const t = f - cuts[i];
  const text = spring({ frame: f - lastBar, fps, config: { damping: 18 } });
  const black = at("memories", fr(DROP - 0.18));
  if (f >= black) return <AbsoluteFill style={{ background: "black" }} />;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ opacity: interpolate(f, [lastBar - 6, lastBar + 10], [1, 0.3], clamp), transform: shakeAt(f, cuts, 12, 5) }}>
        <Photo file={photo(files[i])} t={t} length={14} from={1.4} to={1.18} gray={0.75} blur={t < 2 ? 8 : 0} />
      </AbsoluteFill>
      <Flash cues={cuts} dur={3} peak={0.7} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...title(92), opacity: text, transform: `translateY(${(1 - text) * 40}px) skewX(-6deg)` }}>
          Mais personne
          <br />
          <span style={{ color: C.teal }}>n&apos;a oublié.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 3. DROP : les champions ----------

function Champions() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + SC.champions[0];
  const p = promo(14);
  const crownAt = at("champions", bar(1));
  const nameAt = at("champions", bar(2));
  const shineAt = at("champions", bar(3));
  const hit = spring({ frame: f, fps, config: { damping: 9, stiffness: 180, mass: 0.8 } });
  const kicker = spring({ frame: f - crownAt, fps, config: { damping: 16 } });
  const name = spring({ frame: f - nameAt, fps, config: { damping: 14 } });
  const shine = interpolate(f, [shineAt, shineAt + 30], [-40, 140], clamp);
  const beatScale = 1 + 0.035 * pulse(abs);
  return (
    <AbsoluteFill style={{ background: "black", transform: `${shakeAt(f, [0], 44, 18)} scale(${interpolate(f, [0, SC.champions[1] - SC.champions[0]], [1, 1.07], clamp)})` }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${p.color}66 0%, #1a0306 45%, black 80%)` }} />
      <Photo file="photos/all-ebl-arena.jpg" length={220} from={1.3} to={1.45} gray={1} opacity={0.18} tint={p.color} />
      <Embers color={C.gold} seed="champ" />
      <Shockwave at={0} color={C.gold} />
      <Shockwave at={4} color={p.color} max={1100} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <div style={{ opacity: interpolate(f, [crownAt, crownAt + 8], [0, 1], clamp), marginBottom: -20 }}>
          <Crown progress={interpolate(f, [crownAt, crownAt + 28], [0, 1], clamp)} />
        </div>
        <div style={{ transform: `scale(${interpolate(hit, [0, 1], [2.8, 1]) * beatScale})`, opacity: Math.min(1, hit * 3) }}>
          <LogoCard p={p} size={560} ring={C.gold} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 330, textAlign: "center" }}>
        <div style={{ ...label(36, C.gold), opacity: kicker, transform: `translateY(${(1 - kicker) * 30}px)` }}>Champions en titre · 2025-26</div>
        <div style={{ position: "relative", marginTop: 18, opacity: name, transform: `scale(${0.9 + 0.1 * name})`, overflow: "hidden" }}>
          <div style={label(40, C.white)}>Les</div>
          <Glitch at={nameAt} style={title(128)}>
            Hecatonchires
          </Glitch>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shine}%`,
              width: "18%",
              background: "linear-gradient(90deg, transparent, rgba(255,240,200,.55), transparent)",
              transform: "skewX(-20deg)",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </AbsoluteFill>
      <Flash cues={[0]} dur={8} />
      <Flash cues={[crownAt, nameAt]} dur={4} peak={0.3} />
    </AbsoluteFill>
  );
}

// ---------- 4. Le défi ----------

function Challenge() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const smash = at("challenge", bar(5));
  const first = spring({ frame: f, fps, config: { damping: 20 } });
  const big = spring({ frame: f - smash, fps, config: { damping: 10, stiffness: 200 } });
  if (f < smash) {
    return (
      <AbsoluteFill style={{ background: "black", opacity: interpolate(f, [smash - 8, smash - 2], [1, 0], clamp) }}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.22, filter: "blur(18px)" }}>
          <LogoCard p={promo(14)} size={900} />
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 90 }}>
          <div style={{ ...title(110), opacity: first, transform: `translateX(${(1 - first) * -80}px) skewX(-6deg)` }}>
            Ils l&apos;ont
            <br />
            prise.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(f, [smash], 44, 20) }}>
      <AbsoluteFill style={{ background: `linear-gradient(115deg, ${RED}33 0%, black 45%, black 55%, ${C.teal}44 100%)` }} />
      <Photo file={photo(6)} length={60} from={1.5} to={1.3} gray={1} opacity={0.2} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ transform: `scale(${interpolate(big, [0, 1], [1.8, 1])})` }}>
          <div style={title(150)}>Venez la</div>
          <Glitch at={smash} power={34} style={title(190, C.teal)}>
            chercher.
          </Glitch>
        </div>
      </AbsoluteFill>
      <Flash cues={[smash]} dur={6} />
    </AbsoluteFill>
  );
}

// ---------- 5. Les prétendants : un logo par mesure ----------

const CONTENDER_BG: Record<number, string> = {
  11: "photos/all-ebl-arena.jpg",
  12: "photos/equipes/it12.webp",
  13: "photos/equipes/it13.webp",
  14: "photos/all-ebl-arena.jpg",
};

function Contender({ p, t, dir, abs }: { p: Promo; t: number; dir: number; abs: number }) {
  const { fps } = useVideoConfig();
  const s = spring({ frame: t, fps, config: { damping: 11, stiffness: 190 } });
  const champion = p.number === 14;
  return (
    <AbsoluteFill style={{ transform: shakeAt(t, [0], 24, 10) }}>
      <Photo file={CONTENDER_BG[p.number]} t={t} length={55} from={1.35} to={1.2} gray={0.4} opacity={0.4} tint={p.color} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 0%, black 75%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
        <div style={{ transform: `translateX(${(1 - s) * dir * 700}px) rotate(${(1 - s) * dir * 18}deg) scale(${1 + 0.04 * pulse(abs)})` }}>
          <LogoCard p={p} size={480} ring={champion ? C.gold : undefined} />
        </div>
        <div style={{ textAlign: "center", opacity: s }}>
          <div style={label(34, champion ? C.gold : p.color)}>
            IT{p.number} · {p.level}
            {champion ? " · Tenant du titre" : ""}
          </div>
          {p.name !== `IT${p.number}` && <div style={{ ...title(p.name.length > 12 ? 104 : 140), marginTop: 10 }}>{p.name}</div>}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Contenders() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + SC.contenders[0];
  const slams = [6, 7, 8, 9].map((k) => at("contenders", bar(k)));
  const order = [11, 12, 13, 14].map(promo);
  const i = slams.filter((c) => f >= c).length - 1;
  const gridAt = at("contenders", fr(DROP + 9.5 * BAR));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {f < gridAt && i >= 0 && <Contender key={i} p={order[i]} t={f - slams[i]} dir={i % 2 ? 1 : -1} abs={abs} />}
      {f >= gridAt && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, transform: shakeAt(f, [gridAt], 20, 10) }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 360px)", gap: 40 }}>
            {order.map((p, k) => {
              const s = spring({ frame: f - gridAt - k * 2, fps, config: { damping: 12, stiffness: 220 } });
              return (
                <div key={p.number} style={{ transform: `scale(${s * (1 + 0.04 * pulse(abs))})` }}>
                  <LogoCard p={p} size={360} ring={p.number === 14 ? C.gold : undefined} />
                </div>
              );
            })}
          </div>
          <Glitch at={gridAt} style={{ ...title(96), textAlign: "center" }}>
            Une promo. Une équipe.
          </Glitch>
        </AbsoluteFill>
      )}
      <Flash cues={[...slams, gridAt]} dur={4} peak={0.7} />
    </AbsoluteFill>
  );
}

// ---------- 6. IT15 ----------

function Rookie() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = f + SC.rookie[0];
  const reveal = at("rookie", bar(11));
  const vs = at("rookie", bar(13));
  const p = promo(15);
  if (f >= vs) return <Versus t={f - vs} />;
  const beatGlow = pulse(abs, 5);
  const open = interpolate(f, [reveal, reveal + 14], [0, 80], { ...clamp, easing: Easing.out(Easing.cubic) });
  const word = spring({ frame: f - reveal - 14, fps, config: { damping: 14 } });
  const glint = interpolate(f, [reveal - 20, reveal - 10, reveal - 1], [0, 1, 0], clamp);
  const alpha = Math.round(14 + beatGlow * 46).toString(16).padStart(2, "0");
  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(f, [reveal], 34, 18) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.teal}${alpha} 0%, black 60%)` }} />
      {f < reveal && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 420 }}>
          <div style={label(40, C.soft)}>{"Et cette année…".slice(0, Math.max(0, Math.floor((f - 2) / 3)))}</div>
        </AbsoluteFill>
      )}
      <div
        style={{
          position: "absolute",
          left: 540 - 300 * glint,
          top: 820,
          width: 600 * glint,
          height: 6,
          borderRadius: 6,
          background: CYAN,
          boxShadow: `0 0 40px 12px ${CYAN}`,
          opacity: glint,
        }}
      />
      {f >= reveal && (
        <>
          <Embers color={CYAN} seed="rookie" />
          <Shockwave at={reveal} color={CYAN} />
          <Shockwave at={reveal + 5} color="white" max={1000} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
            <div
              style={{
                clipPath: `circle(${open}% at 50% 50%)`,
                transform: `scale(${interpolate(f, [reveal, reveal + 20, vs], [0.6, 1, 1.06], clamp) * (1 + 0.03 * pulse(abs))})`,
              }}
            >
              <LogoCard p={p} size={600} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 330, textAlign: "center" }}>
            <div style={{ ...label(38, C.white), opacity: word }}>Un nouveau</div>
            <Glitch at={reveal + 14} power={30} style={{ ...title(150, CYAN), opacity: word, marginTop: 12 }}>
              prétendant
            </Glitch>
          </AbsoluteFill>
          <Flash cues={[reveal]} dur={8} color={CYAN} />
        </>
      )}
    </AbsoluteFill>
  );
}

// ---------- 7. La tension ----------

function Tension() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cuts = [0, 1, 2, 3].map((k) => at("tension", beat(14 * 4 + k)));
  const slam = at("tension", bar(15));
  const toi = at("tension", beat(15 * 4 + 2));
  const cut = at("tension", fr(40.35));
  if (f >= cut) return <AbsoluteFill style={{ background: "black" }} />;

  if (f < slam) {
    const i = Math.max(0, cuts.filter((c) => f >= c).length - 1);
    const t = f - cuts[i];
    return (
      <AbsoluteFill style={{ background: "black" }}>
        <AbsoluteFill style={{ transform: shakeAt(f, cuts, 16, 5) }}>
          <Photo file={photo([10, 1, 13, 7][i])} t={t} length={14} from={1.5} to={1.3} gray={i % 2 ? 1 : 0.3} blur={t < 2 ? 6 : 0} />
        </AbsoluteFill>
        <Flash cues={cuts} dur={3} peak={0.6} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Glitch at={0} power={14} style={{ ...title(120), textShadow: "0 8px 40px black" }}>
            Chaque match
            <br />
            compte.
          </Glitch>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const a = spring({ frame: f - slam, fps, config: { damping: 9, stiffness: 220 } });
  const b = spring({ frame: f - toi, fps, config: { damping: 9, stiffness: 220 } });
  const reveal = interpolate(f, [toi, toi + 18], [0, 120], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tension = interpolate(f, [toi, cut], [0, 1], clamp);
  const jx = (random(`rx${f}`) - 0.5) * tension * 10;
  const jy = (random(`ry${f}`) - 0.5) * tension * 10;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {f >= toi && (
        <AbsoluteFill style={{ clipPath: `circle(${reveal}% at 50% 50%)` }}>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.teal}66 0%, ${C.night} 70%)` }} />
          <CourtLines opacity={0.25} color={CYAN} />
          <Embers color={CYAN} seed="ready" count={60} />
        </AbsoluteFill>
      )}
      <Shockwave at={toi} color={CYAN} max={2400} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          transform: `${shakeAt(f, [slam, toi], 40, 16)} translate(${jx}px, ${jy}px) scale(${1 + tension * 0.12})`,
        }}
      >
        <div style={{ ...title(200), opacity: Math.min(1, a * 2), transform: `scale(${interpolate(a, [0, 1], [2.4, 1])}) skewX(-6deg)` }}>Prépare</div>
        <Glitch at={toi} power={30} style={{ ...title(300, CYAN), opacity: Math.min(1, b * 2), transform: `scale(${interpolate(b, [0, 1], [2.4, 1])}) skewX(-6deg)` }}>
          -toi.
        </Glitch>
      </AbsoluteFill>
      <Flash cues={[slam, toi]} dur={5} />
    </AbsoluteFill>
  );
}

// ---------- 8. La date, sur l'impact de 0:59.17 ----------

function DateCard() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = (k: number) => at("date", beat(16 * 4 + k));
  const s = (delay: number, damping = 12) => spring({ frame: f - delay, fps, config: { damping, stiffness: 180 } });
  const day = s(0, 8);
  const year = s(b(1));
  const tag = s(b(2), 16);
  const brand = s(b(6), 16);
  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(f, [0], 46, 20) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${C.teal}40 0%, ${C.night} 55%, black 100%)` }} />
      <CourtLines progress={interpolate(f, [0, 50], [0, 1], clamp)} opacity={0.16} />
      <Embers color={C.gold} seed="date" count={30} opacity={0.6} />
      <Shockwave at={0} color="white" max={2200} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 280, textAlign: "center" }}>
        <div style={{ ...label(52, C.teal), opacity: day }}>Jeudi</div>
        <div style={{ ...title(400), lineHeight: 0.85, transform: `scale(${interpolate(day, [0, 1], [2.2, 1])}) skewX(-6deg)`, opacity: Math.min(1, day * 2) }}>19</div>
        <div style={{ ...title(170), transform: `scale(${interpolate(day, [0, 1], [1.6, 1])}) skewX(-6deg)`, opacity: Math.min(1, day * 2) }}>Novembre</div>
        <div style={{ ...title(120, C.gold), opacity: year, transform: `translateY(${(1 - year) * 40}px) skewX(-6deg)`, marginTop: 10 }}>2026</div>
        <div style={{ ...label(46, C.white), opacity: tag, marginTop: 40, padding: "14px 34px", border: `3px solid ${C.teal}` }}>La reprise</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 170, gap: 44 }}>
        <div style={{ display: "flex", gap: 22 }}>
          {[...PROMOS].reverse().map((p, k) => {
            const pop = s(b(3) + Math.round((k * BEAT * FPS) / 2), 10);
            return (
              <div key={p.number} style={{ transform: `scale(${pop})` }}>
                <LogoCard p={p} size={150} ring={p.number === 14 ? C.gold : undefined} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 34, opacity: brand, transform: `translateY(${(1 - brand) * 30}px)` }}>
          <Img src={staticFile("logos/ebl.jpeg")} style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ ...label(38, C.white), letterSpacing: 6 }}>ebl-zeta.vercel.app</div>
          <Img src={staticFile("logos/esatic.png")} style={{ width: 120, height: 120, objectFit: "contain", background: "white", borderRadius: 24 }} />
        </div>
      </AbsoluteFill>
      <Flash cues={[0]} dur={10} />
      <Flash cues={[b(1), b(2)]} dur={4} peak={0.25} />
    </AbsoluteFill>
  );
}

// ---------- Bruitages ----------
// Tous placés sur une seule piste par scripts/make-sfx.mjs (public/sfx.wav), sur la même grille.

/** La musique s'efface un instant sous les gros impacts (IT15, VS, date) pour les laisser passer. */
const DUCKS = [bar(11), bar(13), bar(16)];
const duck = (f: number) => DUCKS.reduce((v, d) => (f >= d ? Math.min(v, 1 - 0.3 * Math.exp(-(f - d) / 6)) : v), 1);

// ---------- Montage ----------

function Letterbox() {
  const f = useCurrentFrame();
  const h =
    f < 26
      ? interpolate(f, [0, 26], [960, 130], { easing: Easing.inOut(Easing.cubic) })
      : interpolate(f, [SC.date[0], SC.date[0] + 18], [130, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "black" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "black" }} />
    </>
  );
}

export function TrailerSon() {
  const scenes: [Scene, () => ReactNode][] = [
    ["open", () => <Open />],
    ["memories", () => <Memories />],
    ["champions", () => <Champions />],
    ["challenge", () => <Challenge />],
    ["contenders", () => <Contenders />],
    ["rookie", () => <Rookie />],
    ["tension", () => <Tension />],
    ["date", () => <DateCard />],
  ];
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {scenes.map(([k, render]) => (
        <Sequence key={k} from={SC[k][0]} durationInFrames={SC[k][1] - SC[k][0]}>
          {render()}
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,.7) 100%)" }} />
      <Grain />
      <Letterbox />
      <Audio
        src={staticFile("song.mp3")}
        trimBefore={fr(SONG_START)}
        volume={(f) => interpolate(f, [0, 8, TOTAL - 45, TOTAL], [0, 1, 1, 0], clamp) * duck(f)}
      />
      <Audio src={staticFile("sfx.wav")} volume={(f) => interpolate(f, [TOTAL - 20, TOTAL], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
