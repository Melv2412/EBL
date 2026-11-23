import type { CSSProperties, ReactNode } from "react";
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
import T from "./trailer.json";
import { C, LEVELS, TIE, body, display, type Level } from "./theme";

const S = T.scenes;
const Q = T.cues;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const RED = "#ff2e4d";
export const CYAN = "#3fe0ff";
const local = (scene: keyof typeof S, frames: number[]) => frames.map((f) => f - S[scene].start);

export type Promo = { number: number; name: string; level: Level; logo: string; color: string };

// Saison 2026-27 : niveaux d'après l'année d'entrée de chaque promo.
export const PROMOS: Promo[] = [
  { number: 15, name: "IT15", level: "L1", logo: "logos/it15.jpg", color: "#2aa7c9" },
  { number: 14, name: "Les Hecatonchires", level: "L2", logo: "logos/it14.jpeg", color: "#d0182f" },
  { number: 13, name: "Warriors", level: "L3", logo: "logos/it13.webp", color: "#f2b21b" },
  { number: 12, name: "Grizzly", level: "M1", logo: "logos/it12.jpeg", color: "#b48ee0" },
  { number: 11, name: "Wolvesonze", level: "M2", logo: "logos/it11.jpeg", color: "#6f93d6" },
];
export const promo = (n: number) => PROMOS.find((p) => p.number === n)!;
export const photo = (n: number) => `photos/diaporama/photo-${String(n).padStart(2, "0")}.webp`;

export const title = (size: number, color: string = C.white): CSSProperties => ({
  fontFamily: display,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 0.95,
  textTransform: "uppercase",
  color,
  transform: "skewX(-6deg)",
});
export const label = (size = 34, color: string = C.soft): CSSProperties => ({
  fontFamily: body,
  fontWeight: 700,
  fontSize: size,
  letterSpacing: size * 0.35,
  textTransform: "uppercase",
  color,
});

// ---------- Effets ----------

/** Secousse de caméra : forte à l'impact, amortie ensuite. */
export function shakeAt(f: number, cues: number[], amp = 26, dur = 14) {
  let x = 0;
  let y = 0;
  for (const at of cues) {
    const t = f - at;
    if (t < 0 || t > dur) continue;
    const k = amp * (1 - t / dur) ** 2;
    x += (random(`sx${at}-${t}`) - 0.5) * 2 * k;
    y += (random(`sy${at}-${t}`) - 0.5) * 2 * k;
  }
  return `translate(${x}px, ${y}px)`;
}

export const flash = (f: number, at: number, dur = 6, peak = 1) => (f < at ? 0 : interpolate(f, [at, at + dur], [peak, 0], clamp));

export function Flash({ cues, dur = 6, peak = 0.9, color = "white" }: { cues: number[]; dur?: number; peak?: number; color?: string }) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: color, opacity: Math.max(0, ...cues.map((c) => flash(f, c, dur, peak))) }} />;
}

/** Texte avec décalage rouge / cyan à l'impact, puis petits sursauts. */
export function Glitch({ children, at, power = 22, style }: { children: ReactNode; at: number; power?: number; style?: CSSProperties }) {
  const f = useCurrentFrame();
  const t = f - at;
  const k = t < 0 ? 0 : t < 10 ? power * (1 - t / 10) : random(`g${at}-${Math.floor(f / 3)}`) > 0.94 ? power * 0.5 : 0;
  const dx = k * (0.6 + random(`gx${at}-${f}`));
  const layer = (color: string, x: number): CSSProperties => ({
    position: "absolute",
    inset: 0,
    color,
    opacity: k ? 0.85 : 0,
    transform: `translateX(${x}px)`,
    mixBlendMode: "screen",
  });
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={layer(RED, -dx)}>{children}</div>
      <div style={layer(CYAN, dx)}>{children}</div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export function Photo({ file, t, length, from = 1.1, to = 1.2, gray = 0.6, opacity = 1, blur = 0, tint }: {
  file: string;
  t?: number;
  length: number;
  from?: number;
  to?: number;
  gray?: number;
  opacity?: number;
  blur?: number;
  tint?: string;
}) {
  const cur = useCurrentFrame();
  const z = interpolate(t ?? cur, [0, length], [from, to], clamp);
  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(file)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${z})`,
          filter: `grayscale(${gray}) contrast(1.25) brightness(.75) blur(${blur}px)`,
        }}
      />
      {tint && <AbsoluteFill style={{ background: tint, mixBlendMode: "color" }} />}
    </AbsoluteFill>
  );
}

export function LogoCard({ p, size, ring }: { p: Promo; size: number; ring?: string }) {
  const color = ring ?? p.color;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.16,
        background: "white",
        overflow: "hidden",
        border: `${Math.max(4, size * 0.025)}px solid ${color}`,
        boxShadow: `0 0 ${size * 0.3}px ${color}99, 0 30px 80px rgba(0,0,0,.6)`,
        flexShrink: 0,
      }}
    >
      <Img src={staticFile(p.logo)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

export function Shockwave({ at, color, max = 1500, cx = 540, cy = 960 }: { at: number; color: string; max?: number; cx?: number; cy?: number }) {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 26) return null;
  const r = interpolate(t, [0, 26], [80, max], { easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r / 2,
        top: cy - r / 2,
        width: r,
        height: r,
        borderRadius: "50%",
        border: `${interpolate(t, [0, 26], [30, 1])}px solid ${color}`,
        boxShadow: `0 0 60px ${color}`,
        opacity: interpolate(t, [0, 26], [1, 0]),
      }}
    />
  );
}

export function Embers({ color, count = 45, seed = "e", opacity = 1 }: { color: string; count?: number; seed?: string; opacity?: number }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const speed = 3 + random(`${seed}s${i}`) * 7;
        const y = 1980 - ((f * speed + random(`${seed}y${i}`) * 2100) % 2100);
        const x = random(`${seed}x${i}`) * 1080 + Math.sin((f + i * 23) / 18) * 24;
        const s = 3 + random(`${seed}r${i}`) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 ${s * 3}px ${color}`,
              opacity: 0.3 + 0.7 * random(`${seed}o${i}`),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function CourtLines({ progress = 1, opacity = 0.1, color = "white" }: { progress?: number; opacity?: number; color?: string }) {
  const draw = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress };
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity }}>
      <g fill="none" stroke={color} strokeWidth="5">
        <line x1="0" y1="960" x2="1080" y2="960" {...draw} />
        <circle cx="540" cy="960" r="180" {...draw} />
        <path d="M120 1920v-280a420 420 0 0 1 840 0v280" {...draw} />
        <path d="M120 0v280a420 420 0 0 0 840 0V0" {...draw} />
      </g>
    </svg>
  );
}

function Ball({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="47" fill="#e8762c" stroke="#3a1a08" strokeWidth="4" />
      <g fill="none" stroke="#3a1a08" strokeWidth="4">
        <line x1="3" y1="50" x2="97" y2="50" />
        <line x1="50" y1="3" x2="50" y2="97" />
        <path d="M18 16c14 14 14 54 0 68M82 16c-14 14-14 54 0 68" />
      </g>
    </svg>
  );
}

function Tie({ level, size }: { level: Level; size: number }) {
  return (
    <svg viewBox="0 0 16 28" width={size * (16 / 28)} height={size}>
      <path d="M4 1h8l-1.6 4.2H5.6z" fill={TIE[level]} stroke="rgba(255,255,255,.4)" strokeWidth="0.6" />
      <path d="M5.6 5.6h4.8L13 21l-5 6-5-6z" fill={TIE[level]} stroke="rgba(255,255,255,.4)" strokeWidth="0.6" />
    </svg>
  );
}

// ---------- 1. Le silence ----------

function Open() {
  const f = useCurrentFrame();
  const text = "Le terrain s'est tu.";
  const shown = Math.max(0, Math.floor((f - 28) / 2.4));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Photo file="photos/all-ebl-arena.jpg" length={120} from={1.25} to={1.4} gray={1} opacity={interpolate(f, [0, 40], [0, 0.35], clamp)} />
      <CourtLines progress={interpolate(f, [8, 100], [0, 1], clamp)} opacity={0.14} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...title(92), whiteSpace: "nowrap" }}>
          {text.slice(0, shown)}
          <span style={{ color: C.teal, opacity: f % 16 < 8 ? 1 : 0 }}>_</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 2. Les souvenirs ----------

function Memories() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cuts = local("memories", Q.memoryCuts);
  const files = [3, 12, 5, 9];
  const i = Math.max(0, cuts.filter((c) => f >= c).length - 1);
  const t = f - cuts[i];
  const text = spring({ frame: f - 82, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ opacity: interpolate(f, [78, 100], [1, 0.2], clamp), transform: shakeAt(f, cuts, 12, 6) }}>
        <Photo file={photo(files[i])} t={t} length={24} from={1.4} to={1.18} gray={0.75} blur={t < 3 ? 8 : 0} />
      </AbsoluteFill>
      <Flash cues={cuts} dur={4} peak={0.8} />
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

// ---------- 3. Les champions ----------

export function Crown({ progress }: { progress: number }) {
  const draw = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress };
  return (
    <svg viewBox="0 0 200 110" width={260} height={143}>
      <path d="M15 95L5 25l50 35L100 5l45 55 50-35-10 70z" fill="none" stroke={C.gold} strokeWidth="7" strokeLinejoin="round" {...draw} />
      <line x1="15" y1="105" x2="185" y2="105" stroke={C.gold} strokeWidth="7" {...draw} />
    </svg>
  );
}

function Champions() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = Q.championSlam - S.champions.start;
  const p = promo(14);
  const hit = spring({ frame: f - slam, fps, config: { damping: 9, stiffness: 180, mass: 0.8 } });
  const kicker = spring({ frame: f - slam - 30, fps, config: { damping: 16 } });
  const name = spring({ frame: f - slam - 48, fps, config: { damping: 14 } });
  const shine = interpolate(f, [slam + 80, slam + 110], [-40, 140], clamp);
  const visible = f >= slam;
  return (
    <AbsoluteFill style={{ background: "black", opacity: interpolate(f, [200, 210], [1, 0], clamp) }}>
      {visible && (
        <AbsoluteFill style={{ transform: `${shakeAt(f, [slam], 40, 18)} scale(${interpolate(f, [slam, 210], [1, 1.07], clamp)})` }}>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${p.color}66 0%, #1a0306 45%, black 80%)` }} />
          <Photo file="photos/all-ebl-arena.jpg" length={200} from={1.3} to={1.45} gray={1} opacity={0.18} tint={p.color} />
          <Embers color={C.gold} seed="champ" />
          <Shockwave at={slam} color={C.gold} />
          <Shockwave at={slam + 4} color={p.color} max={1100} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
            <div style={{ opacity: interpolate(f, [slam + 60, slam + 70], [0, 1], clamp), marginBottom: -20 }}>
              <Crown progress={interpolate(f, [slam + 60, slam + 90], [0, 1], clamp)} />
            </div>
            <div style={{ transform: `scale(${interpolate(hit, [0, 1], [2.8, 1])})`, opacity: Math.min(1, hit * 3) }}>
              <LogoCard p={p} size={560} ring={C.gold} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 330, textAlign: "center" }}>
            <div style={{ ...label(36, C.gold), opacity: kicker, transform: `translateY(${(1 - kicker) * 30}px)` }}>
              Champions en titre · 2025-26
            </div>
            <div
              style={{
                position: "relative",
                marginTop: 18,
                opacity: name,
                transform: `scale(${0.9 + 0.1 * name})`,
                WebkitMaskImage: "linear-gradient(black, black)",
              }}
            >
              <div style={label(40, C.white)}>Les</div>
              <Glitch at={slam + 48} style={title(128)}>Hecatonchires</Glitch>
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
          <Flash cues={[slam]} dur={8} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------- 4. Le défi ----------

function Challenge() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const smash = Q.challengeSmash - S.challenge.start;
  const first = spring({ frame: f - 4, fps, config: { damping: 20 } });
  const big = spring({ frame: f - smash, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {f < smash ? (
        <AbsoluteFill style={{ opacity: interpolate(f, [38, 46], [1, 0], clamp) }}>
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
      ) : (
        <AbsoluteFill style={{ transform: shakeAt(f, [smash], 44, 20) }}>
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
      )}
    </AbsoluteFill>
  );
}

// ---------- 5. Les prétendants ----------

const CONTENDER_BG: Record<number, string> = {
  11: "photos/all-ebl-arena.jpg",
  12: "photos/equipes/it12.webp",
  13: "photos/equipes/it13.webp",
  14: "photos/all-ebl-arena.jpg",
};

function Contender({ p, t, dir }: { p: Promo; t: number; dir: number }) {
  const { fps } = useVideoConfig();
  const s = spring({ frame: t, fps, config: { damping: 11, stiffness: 190 } });
  const champion = p.number === 14;
  return (
    <AbsoluteFill style={{ transform: shakeAt(t, [0], 24, 10) }}>
      <Photo file={CONTENDER_BG[p.number]} t={t} length={36} from={1.35} to={1.2} gray={0.4} opacity={0.4} tint={p.color} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 0%, black 75%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
        <div style={{ transform: `translateX(${(1 - s) * dir * 700}px) rotate(${(1 - s) * dir * 18}deg)` }}>
          <LogoCard p={p} size={480} ring={champion ? C.gold : undefined} />
        </div>
        <div style={{ textAlign: "center", opacity: s }}>
          <div style={label(34, champion ? C.gold : p.color)}>
            IT{p.number} · {p.level}
            {champion ? " · Tenant du titre" : ""}
          </div>
          <div style={{ ...title(p.name.length > 12 ? 104 : 140), marginTop: 10 }}>{p.name}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Contenders() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slams = local("contenders", Q.contenderSlams);
  const order = [11, 12, 13, 14].map(promo);
  const i = slams.filter((c) => f >= c).length - 1;
  const gridAt = slams[3] + 30;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {f < gridAt && i >= 0 && <Contender key={i} p={order[i]} t={f - slams[i]} dir={i % 2 ? 1 : -1} />}
      {f >= gridAt && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, transform: shakeAt(f, [gridAt], 20, 10) }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 360px)", gap: 40 }}>
            {order.map((p, k) => {
              const s = spring({ frame: f - gridAt - k * 2, fps, config: { damping: 12, stiffness: 220 } });
              return (
                <div key={p.number} style={{ transform: `scale(${s})` }}>
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

// ---------- 6. L'arrivée d'IT15 ----------

function Rookie() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beats = local("rookie", Q.heartbeats);
  const reveal = Q.rookieReveal - S.rookie.start;
  const vs = Q.rookieVs - S.rookie.start;
  const p = promo(15);
  const pulse = Math.max(0, ...beats.map((b) => flash(f, b, 12, 1)), ...beats.map((b) => flash(f, b + 7, 10, 0.6)));
  const intro = "Et cette année…";
  const open = interpolate(f, [reveal, reveal + 14], [0, 80], { ...clamp, easing: Easing.out(Easing.cubic) });
  const word = spring({ frame: f - reveal - 14, fps, config: { damping: 14 } });
  const glint = interpolate(f, [reveal - 22, reveal - 12, reveal - 2], [0, 1, 0], clamp);

  if (f >= vs) return <Versus t={f - vs} />;

  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(f, [reveal], 34, 18) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.teal}${Math.round(18 + pulse * 50).toString(16).padStart(2, "0")} 0%, black 60%)` }} />
      {f < reveal && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 420 }}>
          <div style={label(40, C.soft)}>{intro.slice(0, Math.max(0, Math.floor((f - 4) / 2.5)))}</div>
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
                transform: `scale(${interpolate(f, [reveal, reveal + 20, vs], [0.6, 1, 1.06], clamp)})`,
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

export function Versus({ t }: { t: number }) {
  const { fps } = useVideoConfig();
  const left = spring({ frame: t, fps, config: { damping: 13, stiffness: 200 } });
  const mark = spring({ frame: t - 6, fps, config: { damping: 7, stiffness: 220 } });
  const line = spring({ frame: t - 14, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(t, [0, 6], 30, 14) }}>
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${CYAN}55 0%, black 48%, black 52%, ${RED}55 100%)` }} />
      <div style={{ position: "absolute", top: 250, left: 70, transform: `translateX(${(1 - left) * -600}px)` }}>
        <LogoCard p={promo(15)} size={420} />
        <div style={{ ...label(32, CYAN), marginTop: 22 }}>IT15 · L1</div>
      </div>
      <div style={{ position: "absolute", top: 1000, right: 70, textAlign: "right", transform: `translateX(${(1 - left) * 600}px)` }}>
        <LogoCard p={promo(14)} size={420} ring={C.gold} />
        <div style={{ ...label(32, C.gold), marginTop: 22 }}>IT14 · Champions</div>
      </div>
      <div style={{ position: "absolute", top: 745, width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ ...title(230), transform: `scale(${interpolate(mark, [0, 1], [3, 1])}) skewX(-6deg)`, opacity: Math.min(1, mark * 2), textShadow: `0 0 50px ${CYAN}` }}>
          VS
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 200, textAlign: "center" }}>
        <div style={{ ...title(84), opacity: line, transform: `translateY(${(1 - line) * 30}px) skewX(-6deg)` }}>
          Les nouveaux
          <br />
          contre <span style={{ color: C.gold }}>les rois.</span>
        </div>
      </AbsoluteFill>
      <Flash cues={[0, 6]} dur={5} peak={0.7} />
    </AbsoluteFill>
  );
}

// ---------- 7. L'échelle ----------

function Ladder() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cuts = local("ladder", Q.ladderCuts);
  const ties = local("ladder", Q.ties);
  const files = [1, 2, 4, 7, 8, 10, 11, 13, 14, 6];
  const montageEnd = ties[0];

  if (f < montageEnd) {
    const i = Math.max(0, cuts.filter((c) => f >= c).length - 1);
    const t = f - cuts[i];
    return (
      <AbsoluteFill style={{ background: "black" }}>
        <AbsoluteFill style={{ transform: shakeAt(f, cuts, 16, 5) }}>
          <Photo file={photo(files[i])} t={t} length={9} from={1.5} to={1.3} gray={i % 2 ? 1 : 0.3} blur={t < 2 ? 6 : 0} />
        </AbsoluteFill>
        <Flash cues={cuts.filter((_, k) => k % 3 === 0)} dur={3} peak={0.6} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Glitch at={0} power={14} style={{ ...title(110), textShadow: "0 8px 40px black" }}>
            Chaque possession.
          </Glitch>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const columns = LEVELS.map((level) => PROMOS.find((p) => p.level === level)!);
  const colX = (k: number) => 108 + k * 216;
  const k = Math.min(4, Math.max(0, ties.filter((c) => f >= c).length - 1));
  const next = Math.min(4, k + 1);
  const hop = k < 4 ? Math.min(1, (f - ties[k]) / (ties[next] - ties[k])) : 0;
  const ballX = k < 4 ? interpolate(hop, [0, 1], [colX(k), colX(next)]) : colX(4);
  const ballY = 620 - (k < 4 ? 4 * 180 * hop * (1 - hop) : Math.abs(Math.sin((f - ties[4]) / 6)) * 60 * Math.max(0, 1 - (f - ties[4]) / 40));
  const text = spring({ frame: f - ties[4] - 8, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.night2} 0%, black 75%)` }}>
      <CourtLines opacity={0.08} />
      {columns.map((p, c) => {
        const s = spring({ frame: f - ties[c], fps, config: { damping: 10, stiffness: 200 } });
        return (
          <div
            key={p.level}
            style={{
              position: "absolute",
              left: colX(c) - 95,
              top: 700,
              width: 190,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 200}px)`,
            }}
          >
            <LogoCard p={p} size={170} ring={p.number === 14 ? C.gold : undefined} />
            <Tie level={p.level} size={190} />
            <div style={title(64)}>{p.level}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: ballX - 45, top: ballY - 45 }}>
        <Ball size={90} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 260, textAlign: "center" }}>
        <div style={{ ...label(36, C.teal), opacity: text }}>De L1 à M2</div>
        <Glitch at={ties[4] + 8} style={{ ...title(116), opacity: text, marginTop: 14 }}>
          Chaque match
          <br />
          compte.
        </Glitch>
      </AbsoluteFill>
      <Flash cues={ties} dur={3} peak={0.35} />
    </AbsoluteFill>
  );
}

// ---------- 8. Prépare-toi ----------

function Ready() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = Q.readySlam - S.ready.start;
  const toi = slam + 12;
  const wave = Q.readyWave - S.ready.start;
  const cut = Q.readyCut - S.ready.start;
  if (f >= cut) return <AbsoluteFill style={{ background: "black" }} />;

  const a = spring({ frame: f - slam, fps, config: { damping: 9, stiffness: 220 } });
  const b = spring({ frame: f - toi, fps, config: { damping: 9, stiffness: 220 } });
  const reveal = interpolate(f, [wave, wave + 30], [0, 120], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tension = interpolate(f, [wave, cut], [0, 1], clamp);
  const jitter = tension * 8;
  const jx = (random(`rx${f}`) - 0.5) * jitter;
  const jy = (random(`ry${f}`) - 0.5) * jitter;

  return (
    <AbsoluteFill style={{ background: "black" }}>
      {f >= wave && (
        <AbsoluteFill style={{ clipPath: `circle(${reveal}% at 50% 50%)` }}>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.teal}66 0%, ${C.night} 70%)` }} />
          <CourtLines opacity={0.25} color={CYAN} />
          <Embers color={CYAN} seed="ready" count={60} />
        </AbsoluteFill>
      )}
      <Shockwave at={wave} color={CYAN} max={2400} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          transform: `${shakeAt(f, [slam, toi], 40, 16)} translate(${jx}px, ${jy}px) scale(${1 + tension * 0.14})`,
        }}
      >
        <div style={{ ...title(200), opacity: Math.min(1, a * 2), transform: `scale(${interpolate(a, [0, 1], [2.4, 1])}) skewX(-6deg)` }}>
          Prépare
        </div>
        <Glitch at={toi} power={30} style={{ ...title(300, CYAN), opacity: Math.min(1, b * 2), transform: `scale(${interpolate(b, [0, 1], [2.4, 1])}) skewX(-6deg)` }}>
          -toi.
        </Glitch>
      </AbsoluteFill>
      <Flash cues={[slam, toi]} dur={5} />
    </AbsoluteFill>
  );
}

// ---------- 9. La date ----------

function DateCard() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = Q.dateHit - S.date.start;
  if (f < hit) return <AbsoluteFill style={{ background: "black" }} />;
  const s = (delay: number, damping = 12) => spring({ frame: f - hit - delay, fps, config: { damping, stiffness: 180 } });
  const day = s(0, 8);
  const year = s(8);
  const tag = s(16, 16);
  const brand = s(46, 16);
  return (
    <AbsoluteFill style={{ background: "black", transform: shakeAt(f, [hit], 46, 20) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${C.teal}40 0%, ${C.night} 55%, black 100%)` }} />
      <CourtLines progress={interpolate(f, [hit, hit + 50], [0, 1], clamp)} opacity={0.16} />
      <Embers color={C.gold} seed="date" count={30} opacity={0.6} />
      <Shockwave at={hit} color="white" max={2200} />
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
            const pop = s(26 + k * 3, 10);
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
      <Flash cues={[hit]} dur={10} />
    </AbsoluteFill>
  );
}

// ---------- Habillage cinéma ----------

export function Grain() {
  const f = useCurrentFrame();
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.14, mixBlendMode: "overlay" }}>
      <filter id="trailer-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#trailer-grain)" />
    </svg>
  );
}

function Letterbox() {
  const f = useCurrentFrame();
  const h =
    f < 26
      ? interpolate(f, [0, 26], [960, 130], { easing: Easing.inOut(Easing.cubic) })
      : interpolate(f, [Q.dateHit, Q.dateHit + 18], [130, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "black" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "black" }} />
    </>
  );
}

export function Trailer() {
  const scenes: [keyof typeof S, () => ReactNode][] = [
    ["open", () => <Open />],
    ["memories", () => <Memories />],
    ["champions", () => <Champions />],
    ["challenge", () => <Challenge />],
    ["contenders", () => <Contenders />],
    ["rookie", () => <Rookie />],
    ["ladder", () => <Ladder />],
    ["ready", () => <Ready />],
    ["date", () => <DateCard />],
  ];
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {scenes.map(([k, render]) => (
        <Sequence key={k} from={S[k].start} durationInFrames={S[k].end - S[k].start}>
          {render()}
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,.7) 100%)" }} />
      <Grain />
      <Letterbox />
      <Audio src={staticFile("trailer.wav")} />
    </AbsoluteFill>
  );
}
