import { AWARDS } from "@/lib/awards";
import type { AwardType } from "@/lib/types";

const GOLD = "#e3b341";
const SILVER = "#b8c0c8";

/** Petits pictogrammes vectoriels des distinctions (identiques sur tous les téléphones). */
const PATHS: Record<AwardType, { d: string; fill: string; stroke?: boolean }> = {
  // Couronne.
  mvp: { d: "M3 17h18l1.5-10-5.5 4L12 4 7 11 1.5 7z M3 19h18v2H3z", fill: GOLD },
  // Étoile.
  mvp_finale: { d: "M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8z", fill: GOLD },
  // Bouclier.
  dpoy: { d: "M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5z", fill: "#45bddc" },
  // Cible.
  top_scorer: {
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
    fill: "#e8762b",
  },
  // Éclair.
  revelation: { d: "M13.5 2 4 13.5h6.5L9 22l11-12.5h-6.8z", fill: "#7ad37a" },
  // Médaille.
  mention_honorable: { d: "M7 2h4l1 5H8zM17 2h-4l-1 5h4z M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", fill: SILVER },
  // Ballon.
  three_point: {
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2v20M5 4.5c3.5 3 3.5 12 0 15M19 4.5c-3.5 3-3.5 12 0 15",
    fill: "#e8762b",
    stroke: true,
  },
  // Panier.
  dunk: { d: "M4 6h16v2H4zM6 8l2 12h8l2-12M9 8l1 12M15 8l-1 12M6.7 12h10.6M7.4 16h9.2", fill: "#e8762b", stroke: true },
};

export function AwardIcon({ type, size = 18, className = "" }: { type: AwardType; size?: number; className?: string }) {
  const p = PATHS[type];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      role="img"
      aria-label={AWARDS[type].label}
    >
      <title>{AWARDS[type].label}</title>
      {p.stroke ? (
        <path d={p.d} fill="none" stroke={p.fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={p.d} fill={p.fill} fillRule="evenodd" />
      )}
    </svg>
  );
}
