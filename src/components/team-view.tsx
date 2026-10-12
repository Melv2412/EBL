"use client";

import Image from "next/image";
import { useState } from "react";
import type { Player, Promo } from "@/lib/types";
import { PlayerRail } from "./player-rail";

/** Les 5 places sur le demi-terrain, en % (le panier est en bas). */
const SPOTS = [
  { key: "meneur", x: 50, y: 18 },
  { key: "aile-g", x: 17, y: 38 },
  { key: "aile-d", x: 83, y: 38 },
  { key: "poste-g", x: 32, y: 68 },
  { key: "poste-d", x: 68, y: 68 },
] as const;
type Spot = (typeof SPOTS)[number]["key"];

/** Places préférées par poste, dans l'ordre. */
const PREFERRED: Record<string, Spot[]> = {
  Meneur: ["meneur", "aile-g", "aile-d"],
  Arrière: ["aile-g", "aile-d", "meneur"],
  Ailier: ["aile-d", "aile-g", "poste-g"],
  "Ailier fort": ["poste-g", "poste-d", "aile-d"],
  Intérieur: ["poste-g", "poste-d", "aile-d"],
  Pivot: ["poste-d", "poste-g", "aile-g"],
};

/** Répartit les titulaires sur les 5 places selon leur poste. */
function placeStarters(starters: Player[]) {
  const taken = new Map<Spot, Player>();
  const left: Player[] = [];
  for (const p of starters) {
    const spot = (PREFERRED[p.position ?? ""] ?? []).find((s) => !taken.has(s));
    if (spot) taken.set(spot, p);
    else left.push(p);
  }
  for (const p of left) {
    const free = SPOTS.find((s) => !taken.has(s.key));
    if (free) taken.set(free.key, p);
  }
  return taken;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

function Avatar({ player, promo, size }: { player: Player; promo: Promo; size: number }) {
  return player.photo_url ? (
    <Image
      src={player.photo_url}
      alt=""
      width={size}
      height={size}
      className="aspect-square rounded-full object-cover object-top"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full font-display font-bold text-white/85"
      style={{ width: size, height: size, background: promo.color_primary, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(player.full_name)}
    </span>
  );
}

function CaptainDot() {
  return (
    <span
      title="Capitaine"
      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold font-display text-[0.65rem] font-bold text-night shadow"
    >
      C
    </span>
  );
}

function Court({ players, promo }: { players: Player[]; promo: Promo }) {
  const starters = players.filter((p) => p.is_starter).slice(0, 5);
  const bench = players.filter((p) => !starters.includes(p));
  const placed = placeStarters(starters);

  return (
    <div className="space-y-6">
      <div
        className="relative mx-auto aspect-[15/14] w-full max-w-xl overflow-hidden rounded-2xl border-2 shadow-lg"
        style={{ borderColor: promo.color_secondary, background: "linear-gradient(180deg, #c98f55, #b07440)" }}
      >
        {/* Lignes du demi-terrain (panier en bas). */}
        <svg viewBox="0 0 150 140" className="absolute inset-0 h-full w-full" aria-hidden>
          <g fill="none" stroke="rgb(255 255 255 / 0.8)" strokeWidth="0.9">
            <rect x="2" y="2" width="146" height="136" />
            <path d="M51 138V80h48v58" fill={promo.color_primary} fillOpacity="0.55" />
            <circle cx="75" cy="80" r="18" />
            <path d="M12 138v-26a63 63 0 0 1 126 0v26" />
            <path d="M57 2a18 18 0 0 0 36 0" />
            <line x1="66" y1="132" x2="84" y2="132" strokeWidth="1.4" />
            <circle cx="75" cy="128" r="3.2" stroke="#e8762b" strokeWidth="1.2" />
          </g>
        </svg>

        {SPOTS.map((spot) => {
          const p = placed.get(spot.key);
          return (
            <div
              key={spot.key}
              className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center sm:w-28"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              {p ? (
                <>
                  <span
                    className="relative rounded-full p-0.5 shadow-lg"
                    style={{ background: promo.color_secondary }}
                  >
                    <span className="block sm:hidden">
                      <Avatar player={p} promo={promo} size={52} />
                    </span>
                    <span className="hidden sm:block">
                      <Avatar player={p} promo={promo} size={68} />
                    </span>
                    {p.is_captain && <CaptainDot />}
                  </span>
                  <span
                    className="mt-1 max-w-full truncate rounded px-1.5 py-0.5 font-display text-[0.7rem] font-bold uppercase leading-tight text-white shadow sm:text-xs"
                    style={{ background: promo.color_primary }}
                  >
                    {p.full_name}
                  </span>
                  {p.position && (
                    <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-white drop-shadow sm:text-[0.65rem]">
                      {p.position}
                    </span>
                  )}
                </>
              ) : (
                <span className="h-12 w-12 rounded-full border-2 border-dashed border-white/60 sm:h-16 sm:w-16" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      {bench.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-3">
          {bench.map((p) => (
            <li key={p.id} className="flex w-24 flex-col items-center rounded-xl border border-line bg-surface p-2 text-center">
              <span className="relative">
                <Avatar player={p} promo={promo} size={48} />
                {p.is_captain && <CaptainDot />}
              </span>
              <span className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{p.full_name}</span>
              {p.position && <span className="text-[0.65rem] uppercase tracking-wider text-teal">{p.position}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Effectif d'une promo : sur le terrain (si des titulaires sont choisis) ou en liste. */
export function TeamView({ players, promo }: { players: Player[]; promo: Promo }) {
  const hasCourt = players.some((p) => p.is_starter);
  const [view, setView] = useState<"terrain" | "liste">(hasCourt ? "terrain" : "liste");

  if (!hasCourt) return <PlayerRail players={players} promo={promo} />;

  return (
    <div>
      <div role="tablist" aria-label="Affichage de l'effectif" className="mb-5 inline-flex rounded-full border border-line bg-surface p-1">
        {(["terrain", "liste"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              view === v ? "bg-teal text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {v === "terrain" ? "Terrain" : "Liste"}
          </button>
        ))}
      </div>
      <div key={view} className="ebl-page">
        {view === "terrain" ? <Court players={players} promo={promo} /> : <PlayerRail players={players} promo={promo} />}
      </div>
    </div>
  );
}
