import Link from "next/link";
import type { Series } from "@/lib/types";
import { PLACEMENT_LABEL, type Placement } from "@/lib/league";

export function Section({
  title,
  kicker,
  action,
  children,
  className = "",
}: {
  title: string;
  kicker?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-6xl px-4 pt-14 ${className}`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {kicker && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{kicker}</p>}
          <h2 className="font-display text-3xl font-bold uppercase sm:text-4xl">{title}</h2>
        </div>
        {action && (
          <Link href={action.href} className="shrink-0 text-sm font-medium text-teal hover:text-teal-strong">
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PageTitle({ kicker, title, intro }: { kicker?: string; title: string; intro?: React.ReactNode }) {
  return (
    <div className="court-lines bg-night text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {kicker && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{kicker}</p>}
        <h1 className="font-display text-4xl font-bold uppercase sm:text-6xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-white/70">{intro}</p>}
      </div>
    </div>
  );
}

const PLACEMENT_STYLE: Record<Placement, string> = {
  champion: "bg-gold text-night",
  finaliste: "bg-teal-soft text-teal-strong",
  demi: "bg-surface-2 text-ink-soft",
};

export function PlacementPill({ placement }: { placement: Placement }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLACEMENT_STYLE[placement]}`}>
      {PLACEMENT_LABEL[placement]}
    </span>
  );
}

export function LevelTag({ level }: { level: string | null }) {
  if (!level) return null;
  return (
    <span className="inline-block rounded border border-line px-1.5 py-px font-display text-xs font-semibold text-ink-soft">
      {level}
    </span>
  );
}

/** « 2-1 », ou rien si le score n'est pas connu. */
export function seriesScore(s: Series, forPromo?: number) {
  if (s.wins_a === null || s.wins_b === null) return null;
  if (forPromo === s.promo_b) return `${s.wins_b}-${s.wins_a}`;
  return `${s.wins_a}-${s.wins_b}`;
}
