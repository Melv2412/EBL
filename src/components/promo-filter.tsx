"use client";

import { useState } from "react";

type Kind = "jeu" | "anciens" | "autre";
type Item = { key: number; kind: Kind; card: React.ReactNode };

const FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "jeu", label: "En jeu cette saison" },
  { id: "anciens", label: "Anciens" },
] as const;

export function PromoFilter({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("toutes");
  const count = (id: string) => (id === "toutes" ? items.length : items.filter((i) => i.kind === id).length);
  const visible = filter === "toutes" ? items : items.filter((i) => i.kind === filter);

  return (
    <>
      <div role="group" aria-label="Filtrer les promos" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors ${
                active ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-teal"
              }`}
            >
              {f.label}
              <span className={active ? "opacity-70" : "text-ink-soft"}>· {count(f.id)}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((i) => (
          <div key={i.key}>{i.card}</div>
        ))}
      </div>
    </>
  );
}
