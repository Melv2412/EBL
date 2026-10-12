"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
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

type Placed = { id: number; x: number; y: number };

/** Répartit les titulaires sur les 5 places selon leur poste. */
function initialLineup(players: Player[]): Placed[] {
  const starters = players.filter((p) => p.is_starter).slice(0, 5);
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
  return SPOTS.filter((s) => taken.has(s.key)).map((s) => ({ id: taken.get(s.key)!.id, x: s.x, y: s.y }));
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

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
      draggable={false}
      className="pointer-events-none aspect-square rounded-full object-cover object-top"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="pointer-events-none flex items-center justify-center rounded-full font-display font-bold text-white/85"
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
      className="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold font-display text-[0.65rem] font-bold text-night shadow"
    >
      C
    </span>
  );
}

type Drag = { id: number; from: "court" | "bench"; px: number; py: number; moved: boolean };

/**
 * Demi-terrain interactif : on glisse un joueur pour le déplacer, on dépose un remplaçant
 * sur un titulaire pour les échanger. Rien n'est enregistré : tout repart à zéro au rechargement.
 */
function Court({ players, promo }: { players: Player[]; promo: Promo }) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const start = useMemo(() => initialLineup(players), [players]);
  const [lineup, setLineup] = useState<Placed[]>(start);
  const [drag, setDrag] = useState<Drag | null>(null);
  const court = useRef<HTMLDivElement>(null);

  const onCourt = new Set(lineup.map((l) => l.id));
  const bench = players.filter((p) => !onCourt.has(p.id));
  const changed = JSON.stringify(lineup) !== JSON.stringify(start);

  const begin = (e: React.PointerEvent, id: number, from: Drag["from"]) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id, from, px: e.clientX, py: e.clientY, moved: false });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, px: e.clientX, py: e.clientY, moved: true });
  };

  const end = (e: React.PointerEvent) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (!d.moved) return;

    // Cible sous le doigt : un joueur sur le terrain, un remplaçant, ou le terrain lui-même.
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-drop]");
    const box = court.current?.getBoundingClientRect();
    const inCourt =
      box && e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    const at = box
      ? { x: clamp(((e.clientX - box.left) / box.width) * 100, 8, 92), y: clamp(((e.clientY - box.top) / box.height) * 100, 8, 92) }
      : null;
    const otherId = target ? Number(target.dataset.drop) : null;

    setLineup((cur) => {
      const mine = cur.find((l) => l.id === d.id);
      if (otherId !== null && otherId !== d.id) {
        const other = cur.find((l) => l.id === otherId);
        if (mine && other) {
          // Deux titulaires : ils échangent leurs places.
          return cur.map((l) => (l.id === d.id ? { ...l, x: other.x, y: other.y } : l.id === otherId ? { ...l, x: mine.x, y: mine.y } : l));
        }
        if (!mine && other) {
          // Un remplaçant sur un titulaire : il prend sa place.
          return cur.map((l) => (l.id === otherId ? { ...l, id: d.id } : l));
        }
        if (mine && !other) {
          // Un titulaire sur un remplaçant : le remplaçant entre à sa place.
          return cur.map((l) => (l.id === d.id ? { ...l, id: otherId } : l));
        }
      }
      if (inCourt && at) {
        if (mine) return cur.map((l) => (l.id === d.id ? { ...l, ...at } : l));
        if (cur.length < 5) return [...cur, { id: d.id, ...at }];
        return cur;
      }
      // Lâché hors du terrain : le titulaire sort.
      if (mine) return cur.filter((l) => l.id !== d.id);
      return cur;
    });
  };

  const dragged = drag?.moved ? byId.get(drag.id) : null;

  return (
    <div className="space-y-5 select-none" onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDrag(null)}>
      <div
        ref={court}
        className="relative mx-auto aspect-[15/14] w-full max-w-xl overflow-hidden rounded-2xl border-2 shadow-lg"
        style={{ borderColor: promo.color_secondary, background: "linear-gradient(180deg, #c98f55, #b07440)" }}
      >
        <svg viewBox="0 0 150 140" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
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

        {lineup.map((l) => {
          const p = byId.get(l.id);
          if (!p) return null;
          const isDragged = drag?.moved && drag.id === p.id;
          return (
            <div
              key={p.id}
              data-drop={p.id}
              onPointerDown={(e) => begin(e, p.id, "court")}
              className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none flex-col items-center text-center transition-[left,top] duration-300 ease-out active:cursor-grabbing sm:w-28 ${
                isDragged ? "opacity-30" : ""
              }`}
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
            >
              <span className="relative rounded-full p-0.5 shadow-lg" style={{ background: promo.color_secondary }}>
                <span className="block sm:hidden">
                  <Avatar player={p} promo={promo} size={52} />
                </span>
                <span className="hidden sm:block">
                  <Avatar player={p} promo={promo} size={68} />
                </span>
                {p.is_captain && <CaptainDot />}
              </span>
              <span
                className="pointer-events-none mt-1 max-w-full truncate rounded px-1.5 py-0.5 font-display text-[0.7rem] font-bold uppercase leading-tight text-white shadow sm:text-xs"
                style={{ background: promo.color_primary }}
              >
                {p.full_name}
              </span>
              {p.position && (
                <span className="pointer-events-none text-[0.6rem] font-semibold uppercase tracking-wider text-white drop-shadow sm:text-[0.65rem]">
                  {p.position}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span>Glisse les joueurs pour composer ton équipe.</span>
        {changed && (
          <button type="button" onClick={() => setLineup(start)} className="font-semibold text-teal hover:text-teal-strong">
            ↺ Réinitialiser
          </button>
        )}
      </div>

      {bench.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-3">
          {bench.map((p) => (
            <li
              key={p.id}
              data-drop={p.id}
              onPointerDown={(e) => begin(e, p.id, "bench")}
              className={`flex w-24 cursor-grab touch-none flex-col items-center rounded-xl border border-line bg-surface p-2 text-center active:cursor-grabbing ${
                drag?.moved && drag.id === p.id ? "opacity-30" : ""
              }`}
            >
              <span className="relative">
                <Avatar player={p} promo={promo} size={48} />
                {p.is_captain && <CaptainDot />}
              </span>
              <span className="pointer-events-none mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{p.full_name}</span>
              {p.position && (
                <span className="pointer-events-none text-[0.65rem] uppercase tracking-wider text-teal">{p.position}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Le joueur qui suit le doigt pendant le glissement. */}
      {dragged && drag && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110 rounded-full p-0.5 shadow-2xl"
          style={{ left: drag.px, top: drag.py, background: promo.color_secondary }}
          aria-hidden
        >
          <Avatar player={dragged} promo={promo} size={60} />
        </div>
      )}
    </div>
  );
}

/** Effectif d'une promo : sur le terrain ou en liste. */
export function TeamView({ players, promo }: { players: Player[]; promo: Promo }) {
  const hasStarters = players.some((p) => p.is_starter);
  const [view, setView] = useState<"terrain" | "liste">(hasStarters ? "terrain" : "liste");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Affichage de l'effectif"
        className="mb-5 flex w-full rounded-full border-2 border-line bg-surface p-1 sm:inline-flex sm:w-auto"
      >
        {(["terrain", "liste"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              view === v ? "bg-teal text-white" : "text-ink hover:text-teal"
            }`}
          >
            {v === "terrain" ? "🏀 Terrain" : "☰ Liste"}
          </button>
        ))}
      </div>
      <div key={view} className="ebl-page">
        {view === "terrain" ? <Court players={players} promo={promo} /> : <PlayerRail players={players} promo={promo} />}
      </div>
    </div>
  );
}
