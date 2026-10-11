import Link from "next/link";
import { PromoBadge } from "./promo-badge";
import { LevelTag, PlacementPill } from "./ui";
import {
  WHATSAPP_URL,
  currentSeasonYear,
  levelOf,
  promoCode,
  promoName,
  promoSlug,
  type EditionView,
  type League,
} from "@/lib/league";
import type { Promo } from "@/lib/types";

export function PromoCard({ promo, league }: { promo: Promo; league: League }) {
  const best = league.bestResult(promo);
  const level = levelOf(promo, currentSeasonYear());
  return (
    <Link
      href={`/promos/${promoSlug(promo)}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ background: `linear-gradient(135deg, ${promo.color_primary} 55%, ${promo.color_secondary})` }}
    >
      <PromoBadge promo={promo} size={72} />
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold tracking-widest text-white/70">
          {promoCode(promo)}
          {level && <span className="ml-2 text-white/50">· {level === "Anciens" ? "Anciens" : `en ${level}`}</span>}
        </p>
        <p className="truncate font-display text-2xl font-bold uppercase">{promo.name ?? "Nom à venir"}</p>
        {best && (
          <p className="mt-1 text-xs text-white/80">
            {best.placement === "champion" ? "🏆 " : ""}
            {best.placement === "champion" ? "Champion" : best.placement === "finaliste" ? "Finaliste" : "Demi-finaliste"}{" "}
            {best.editions.map((e) => e.label).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function EditionCard({ edition }: { edition: EditionView }) {
  const mvp = edition.awards.find((a) => a.type === "mvp");

  if (!edition.known) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-dashed border-line bg-surface p-5">
        <div>
          <p className="font-display text-2xl font-bold">{edition.label}</p>
          <p className="mt-2 text-sm text-ink-soft">Cette édition n&apos;est pas encore racontée. Tu y étais ?</p>
        </div>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-block self-start rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-strong"
        >
          Aide-nous à compléter
        </a>
      </div>
    );
  }

  return (
    <Link
      href={`/editions/${edition.label}`}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-teal"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl font-bold">{edition.label}</p>
        {edition.status === "en_cours" && (
          <span className="rounded-full bg-teal px-2 py-0.5 text-xs font-semibold text-white">En cours</span>
        )}
      </div>

      {edition.champion ? (
        <div className="mt-4 flex items-center gap-3">
          <PromoBadge promo={edition.champion} size={52} />
          <div>
            <PlacementPill placement="champion" />
            <p className="font-display text-lg font-bold uppercase leading-tight">{promoName(edition.champion)}</p>
            <p className="text-xs text-ink-soft">
              {promoCode(edition.champion)} <LevelTag level={levelOf(edition.champion, edition.start_year)} />
            </p>
          </div>
        </div>
      ) : edition.final ? (
        <p className="mt-4 text-sm text-ink-soft">
          Finale à venir : <strong className="text-ink">IT{edition.final.promo_a}</strong> contre{" "}
          <strong className="text-ink">IT{edition.final.promo_b}</strong>
        </p>
      ) : null}

      <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
        {edition.finalist && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-soft">Finaliste</dt>
            <dd className="font-medium">{promoName(edition.finalist)}</dd>
          </div>
        )}
        {mvp && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-soft">MVP</dt>
            <dd className="font-medium">
              {mvp.player.full_name} <span className="text-ink-soft">({promoCode(mvp.promo)})</span>
            </dd>
          </div>
        )}
      </dl>
    </Link>
  );
}
