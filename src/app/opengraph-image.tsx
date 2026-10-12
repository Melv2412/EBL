import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getLeagueData } from "@/lib/data";
import { buildLeague, levelOf, promoCode, promoName } from "@/lib/league";
import type { Promo } from "@/lib/types";

// Aperçu affiché quand le lien du site est partagé (WhatsApp, Instagram…).
// Il suit l'accueil : la finale à venir, sinon le dernier champion.

export const alt = "ESATIC Basket League";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

const NIGHT = "#0d1114";
const TEAL = "#2aa7c9";
const GOLD = "#e0b44a";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Logo en data URI : fichier de /public, ou image Supabase Storage. */
async function logoSrc(url: string | null) {
  if (!url) return null;
  try {
    if (url.startsWith("/")) {
      const buf = await readFile(path.join(process.cwd(), "public", url));
      const type = url.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${type};base64,${buf.toString("base64")}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

function Badge({ promo, src, px }: { promo: Promo; src: string | null; px: number }) {
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: px * 0.16,
        background: promo.color_primary,
        border: "6px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={px - 12} height={px - 12} style={{ objectFit: "cover" }} alt="" />
      ) : (
        <span style={{ color: "white", fontSize: px * 0.28, fontWeight: 700 }}>{promoCode(promo)}</span>
      )}
    </div>
  );
}

export default async function OgImage() {
  const league = buildLeague(await getLeagueData());
  const spot = league.spotlight();
  const ebl = await logoSrc("/logos/ebl.jpeg");

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {ebl && <img src={ebl} width={72} height={72} style={{ borderRadius: 36 }} alt="" />}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>ESATIC BASKET LEAGUE</span>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", letterSpacing: 4 }}>LIGUE INTER-PROMOS</span>
      </div>
    </div>
  );

  let body: React.ReactNode;

  if (spot?.kind === "final") {
    const a = league.promo(spot.series.promo_a)!;
    const b = league.promo(spot.series.promo_b)!;
    const [srcA, srcB] = await Promise.all([logoSrc(a.logo_url), logoSrc(b.logo_url)]);
    const when = spot.edition.final_date
      ? dateFmt.format(new Date(`${spot.edition.final_date}T00:00:00Z`)) +
        (spot.edition.final_time ? ` · ${spot.edition.final_time.slice(0, 5).replace(":", "h")}` : "")
      : null;
    const side = (p: Promo, src: string | null) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 400 }}>
        <Badge promo={p} src={src} px={190} />
        <span style={{ marginTop: 18, fontSize: 40, fontWeight: 700, textTransform: "uppercase", textAlign: "center", lineHeight: 1.1 }}>
          {promoName(p)}
        </span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
          {promoCode(p)} · {levelOf(p, spot.edition.start_year)}
        </span>
      </div>
    );
    body = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", marginTop: 8 }}>
        <span style={{ fontSize: 30, color: TEAL, letterSpacing: 8, fontWeight: 700 }}>
          FINALE {spot.edition.label}
        </span>
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 18 }}>
          {side(a, srcA)}
          <span style={{ fontSize: 80, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: "62px 20px 0" }}>VS</span>
          {side(b, srcB)}
        </div>
        {when && (
          <span
            style={{
              marginTop: 22,
              fontSize: 28,
              fontWeight: 700,
              background: TEAL,
              padding: "8px 28px",
              borderRadius: 40,
              textTransform: "uppercase",
            }}
          >
            {when}
          </span>
        )}
      </div>
    );
  } else if (spot?.kind === "champion") {
    const champ = spot.edition.champion!;
    const src = await logoSrc(champ.logo_url);
    const mvp = spot.edition.awards.find((x) => x.type === "mvp");
    body = (
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 56 }}>
        <Badge promo={champ} src={src} px={330} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 30, color: GOLD, letterSpacing: 8, fontWeight: 700 }}>
            CHAMPION {spot.edition.label}
          </span>
          <span style={{ fontSize: 96, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.05 }}>
            {promoName(champ)}
          </span>
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.7)", marginTop: 12 }}>
            {promoCode(champ)}, sacrée en {levelOf(champ, spot.edition.start_year)}
          </span>
          {mvp && (
            <span style={{ fontSize: 32, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>MVP : {mvp.player.full_name}</span>
          )}
        </div>
      </div>
    );
  } else {
    body = (
      <div style={{ display: "flex", flex: 1, alignItems: "center", fontSize: 64, fontWeight: 700 }}>
        Éditions, promos, finales et MVP depuis 2019
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "36px 60px",
          color: "white",
          background: `radial-gradient(circle at 50% 120%, #17323c 0%, ${NIGHT} 60%)`,
          fontFamily: "sans-serif",
        }}
      >
        {header}
        {body}
      </div>
    ),
    size,
  );
}
