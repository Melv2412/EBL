import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import data from "./data.json";
import T from "./timeline.json";
import { C, LEVELS, TIE, body, display, type Level } from "./theme";

type PromoData = (typeof data.promos)[number];

const src = (logo: string) => (/^https?:/.test(logo) ? logo : staticFile(logo));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Couleur lisible sur fond sombre : une couleur trop foncée est remplacée par l'or EBL. */
function readable(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 90 ? C.gold : hex;
}

/** Fondu d'entrée et de sortie d'une scène. */
function useSceneFade(length: number, edge = 8) {
  const f = useCurrentFrame();
  return interpolate(f, [0, edge, length - edge, length], [0, 1, 1, 0], clamp);
}

// ---------- Décor commun ----------

function Court({ tint = C.teal, opacity = 0.08 }: { tint?: string; opacity?: number }) {
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 110%, ${tint}55 0%, ${C.night} 55%)` }} />
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity }}>
        <g fill="none" stroke="white" strokeWidth="6">
          <line x1="0" y1="960" x2="1080" y2="960" />
          <circle cx="540" cy="960" r="180" />
          <path d="M120 1920v-280a420 420 0 0 1 840 0v280" />
          <path d="M120 0v280a420 420 0 0 0 840 0V0" />
        </g>
      </svg>
    </AbsoluteFill>
  );
}

function Tie({ level, size }: { level: Level; size: number }) {
  return (
    <svg viewBox="0 0 16 28" width={size * (16 / 28)} height={size}>
      <path d="M4 1h8l-1.6 4.2H5.6z" fill={TIE[level]} stroke="rgba(255,255,255,.4)" strokeWidth="0.6" />
      <path d="M5.6 5.6h4.8L13 21l-5 6-5-6z" fill={TIE[level]} stroke="rgba(255,255,255,.4)" strokeWidth="0.6" />
      <path d="M6.2 9l5.4 4M5.4 14l6.6 5" stroke="rgba(255,255,255,.2)" strokeWidth="1.1" />
    </svg>
  );
}

function Logo({ promo, size }: { promo: PromoData; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.14,
        overflow: "hidden",
        background: promo.logo ? "white" : promo.primary,
        border: `${Math.max(4, size * 0.025)}px solid ${promo.secondary}`,
        boxShadow: "0 30px 80px rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {promo.logo ? (
        <Img src={src(promo.logo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontFamily: display, fontWeight: 700, color: "white", fontSize: size * 0.3 }}>IT{promo.number}</span>
      )}
    </div>
  );
}

// ---------- 1. Intro : le logo tombe et rebondit ----------

/** Hauteur du logo (0 = au sol) : chute, puis rebonds aux images T.bounces. */
function bounceY(f: number) {
  const [b1, b2, b3] = T.bounces;
  if (f <= b1) return interpolate(f, [0, b1], [-1300, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const hop = (a: number, b: number, h: number) => {
    const t = (f - a) / (b - a);
    return -4 * h * t * (1 - t);
  };
  if (f <= b2) return hop(b1, b2, 240);
  if (f <= b3) return hop(b2, b3, 90);
  if (f <= b3 + 6) return hop(b3, b3 + 6, 18);
  return 0;
}

function Intro() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const length = T.scenes.intro.end - T.scenes.intro.start;
  const y = bounceY(f);
  const contact = T.bounces.some((b) => Math.abs(f - b) <= 1);
  const squash = contact ? 0.86 : 1;
  const air = Math.min(1, Math.abs(y) / 600);
  const title = spring({ frame: f - 44, fps, config: { damping: 14 } });
  const since = spring({ frame: f - 58, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ opacity: useSceneFade(length) }}>
      <Court />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -160 }}>
        <div style={{ transform: `translateY(${y}px) scale(${2 - squash}, ${squash})`, transformOrigin: "50% 100%" }}>
          <Img
            src={staticFile("logos/ebl.jpeg")}
            style={{ width: 460, height: 460, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 0 10px rgba(255,255,255,.08)" }}
          />
        </div>
        <div
          style={{
            width: 360 * (1 - air * 0.6),
            height: 36,
            marginTop: 24,
            borderRadius: "50%",
            background: "rgba(0,0,0,.6)",
            filter: "blur(10px)",
            opacity: 1 - air * 0.7,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 430, textAlign: "center" }}>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 108,
            lineHeight: 1,
            color: C.white,
            letterSpacing: 2,
            opacity: title,
            transform: `translateY(${(1 - title) * 60}px)`,
          }}
        >
          ESATIC
          <br />
          BASKET LEAGUE
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: body,
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: 12,
            color: C.teal,
            opacity: since,
          }}
        >
          DEPUIS {data.since}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 2. Le concept : une promo, une équipe, 5 cravates ----------

function Concept() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const length = T.scenes.concept.end - T.scenes.concept.start;
  const lines = ["Une promo.", "Une équipe.", "5 ans pour écrire", "son histoire."];
  const starts = [0, 18, 38, 46];

  return (
    <AbsoluteFill style={{ opacity: useSceneFade(length) }}>
      <Court />
      <AbsoluteFill style={{ padding: "300px 90px 0", gap: 6 }}>
        {lines.map((l, i) => {
          const s = spring({ frame: f - starts[i], fps, config: { damping: 15 } });
          return (
            <div
              key={l}
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: i < 2 ? 130 : 96,
                lineHeight: 1.05,
                textTransform: "uppercase",
                color: i < 2 ? C.white : C.teal,
                opacity: s,
                transform: `translateX(${(1 - s) * -120}px)`,
              }}
            >
              {l}
            </div>
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 300 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 46 }}>
          {LEVELS.map((level, i) => {
            const at = T.ties[i] - T.scenes.concept.start;
            const s = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 160 } });
            return (
              <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, s * 1.5) }}>
                <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -25}deg)` }}>
                  <Tie level={level} size={220} />
                </div>
                <span style={{ marginTop: 18, fontFamily: display, fontWeight: 700, fontSize: 54, color: C.white }}>{level}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 50,
            textAlign: "center",
            fontFamily: body,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: 8,
            color: C.soft,
            opacity: interpolate(f, [T.ties[4] - T.scenes.concept.start + 10, T.ties[4] - T.scenes.concept.start + 22], [0, 1], clamp),
          }}
        >
          UNE CRAVATE PAR NIVEAU
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 3. Les promos, une par une ----------

function PromoCard({ promo, length }: { promo: PromoData; length: number }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 140 } });
  const name = spring({ frame: f - 8, fps, config: { damping: 15 } });
  const exit = interpolate(f, [length - 8, length], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.night} 25%, ${promo.primary} 70%, ${promo.secondary})` }} />
      <Court tint={promo.secondary} opacity={0.07} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
        <div style={{ transform: `scale(${0.4 + 0.6 * enter}) rotate(${(1 - enter) * -14}deg) translateX(${exit * -300}px)` }}>
          <Logo promo={promo} size={620} />
        </div>
        <div style={{ textAlign: "center", opacity: name, transform: `translateY(${(1 - name) * 50}px)` }}>
          <div style={{ fontFamily: body, fontWeight: 700, fontSize: 46, letterSpacing: 14, color: readable(promo.secondary) }}>
            IT{promo.number}
          </div>
          <div
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: promo.name.length > 12 ? 104 : 140,
              lineHeight: 1.05,
              textTransform: "uppercase",
              color: "white",
              textShadow: "0 8px 30px rgba(0,0,0,.5)",
              maxWidth: 980,
            }}
          >
            {promo.name}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Promos() {
  const f = useCurrentFrame();
  const per = Math.floor((T.scenes.promos.end - T.scenes.promos.start) / Math.max(1, data.promos.length));
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {data.promos.map((p, i) => (
        <Sequence key={p.number} from={i * per} durationInFrames={per}>
          <PromoCard promo={p} length={per} />
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: body,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: 16,
          color: "rgba(255,255,255,.75)",
          opacity: interpolate(f, [0, 10], [0, 1], clamp),
        }}
      >
        UNE PROMO · UNE ÉQUIPE
      </div>
    </AbsoluteFill>
  );
}

// ---------- 4. Le palmarès : l'échelle L1 → M2 ----------

function Palmares() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const length = T.scenes.palmares.end - T.scenes.palmares.start;
  const byNumber = new Map(data.promos.map((p) => [p.number, p]));
  const title = spring({ frame: f, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ opacity: useSceneFade(length) }}>
      <Court />
      <AbsoluteFill style={{ padding: "190px 80px 0" }}>
        <div style={{ opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
          <div style={{ fontFamily: body, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: C.teal }}>L&apos;ÉCHELLE DES CHAMPIONS</div>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 120, lineHeight: 1, color: C.white }}>DE LA L1 AU M2</div>
        </div>

        <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 26 }}>
          {LEVELS.map((level, i) => {
            const row = spring({ frame: f - 8 - i * 7, fps, config: { damping: 16 } });
            const champs = data.champions.map((c, k) => ({ ...c, k })).filter((c) => c.level === level);
            return (
              <div
                key={level}
                style={{
                  height: 200,
                  borderRadius: 28,
                  border: `5px ${champs.length ? "solid" : "dashed"} ${TIE[level]}`,
                  background: champs.length ? C.night2 : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 34,
                  padding: "0 40px",
                  opacity: row,
                  transform: `translateX(${(1 - row) * 160}px)`,
                }}
              >
                <Tie level={level} size={110} />
                <span style={{ fontFamily: display, fontWeight: 700, fontSize: 80, color: C.white, width: 110 }}>{level}</span>
                {champs.length === 0 ? (
                  <span
                    style={{
                      fontFamily: body,
                      fontWeight: 500,
                      fontSize: 40,
                      color: C.soft,
                      opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(f / 9)),
                    }}
                  >
                    À conquérir
                  </span>
                ) : (
                  champs.map((c) => {
                    const p = byNumber.get(c.number);
                    if (!p) return null;
                    const drop = spring({ frame: f - T.dropDelay - c.k * T.dropStep, fps, config: { damping: 8, stiffness: 120 } });
                    return (
                      <div
                        key={c.season}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 24,
                          opacity: Math.min(1, drop * 2),
                          transform: `translateY(${(1 - drop) * -260}px)`,
                        }}
                      >
                        <Logo promo={p} size={130} />
                        <div>
                          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 56, color: C.white, lineHeight: 1 }}>
                            {p.name.toUpperCase()}
                          </div>
                          <div style={{ fontFamily: body, fontWeight: 700, fontSize: 34, color: C.gold }}>🏆 {c.season}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 5. Outro ----------

function Outro() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(f, [0, 10], [0.9, 0], clamp);
  const q = spring({ frame: f - 4, fps, config: { damping: 13 } });
  const logo = spring({ frame: f - 22, fps, config: { damping: 10 } });
  const url = spring({ frame: f - 38, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill>
      <Court tint={C.gold} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 80, gap: 70 }}>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1.04,
            textTransform: "uppercase",
            color: C.white,
            opacity: q,
            transform: `scale(${0.8 + 0.2 * q})`,
          }}
        >
          Quelle promo
          <br />
          écrira <span style={{ color: C.gold }}>la suite</span>{" "}?
        </div>
        <Img
          src={staticFile("logos/ebl.jpeg")}
          style={{ width: 300, height: 300, borderRadius: "50%", objectFit: "cover", transform: `scale(${logo})` }}
        />
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: 46,
            color: C.night,
            background: C.teal,
            padding: "22px 50px",
            borderRadius: 999,
            opacity: url,
            transform: `translateY(${(1 - url) * 40}px)`,
          }}
        >
          {data.site}
        </div>
        <div style={{ display: "flex", gap: 22, opacity: url }}>
          {data.promos.map((p) => (
            <Logo key={p.number} promo={p} size={110} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </AbsoluteFill>
  );
}

// ---------- Montage ----------

export function EblVideo() {
  const s = T.scenes;
  const len = (k: keyof typeof s) => s[k].end - s[k].start;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Sequence from={s.intro.start} durationInFrames={len("intro")}>
        <Intro />
      </Sequence>
      <Sequence from={s.concept.start} durationInFrames={len("concept")}>
        <Concept />
      </Sequence>
      <Sequence from={s.promos.start} durationInFrames={len("promos")}>
        <Promos />
      </Sequence>
      <Sequence from={s.palmares.start} durationInFrames={len("palmares")}>
        <Palmares />
      </Sequence>
      <Sequence from={s.outro.start} durationInFrames={len("outro")}>
        <Outro />
      </Sequence>
      <Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
}
