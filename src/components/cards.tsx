import Link from "next/link";
import { LineIcon, Medal, TieChip } from "./icons";
import { PromoBadge } from "./promo-badge";
import { LevelTag, PlacementPill, seriesScore } from "./ui";
import {
  WHATSAPP_URL,
  currentSeasonYear,
  darkenHex,
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
      className="group relative isolate flex h-[236px] flex-col gap-3 overflow-hidden rounded-[18px] p-[22px] text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1"
      style={{ background: `linear-gradient(140deg, ${promo.color_primary}, ${darkenHex(promo.color_primary)})` }}
    >
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_30%,rgb(0_0_0/0.45))]" />
      {promo.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={promo.logo_url}
          alt=""
          aria-hidden
          className="absolute -right-[30px] -top-[30px] -z-10 h-[170px] w-[170px] rounded-full object-cover opacity-[0.16] grayscale"
        />
      )}
      <span aria-hidden className="ebl-shine" />
      <PromoBadge
        promo={promo}
        size={72}
        className="!rounded-full border-[3px] border-white/85 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
      />
      <p className="flex flex-wrap items-center gap-2 font-display text-[13px] font-bold tracking-[0.08em]">
        {promoCode(promo)}
        {level && (
          <TieChip level={level} className="bg-black/30 text-white">
            {level === "Anciens" ? "Anciens" : `En ${level}`}
          </TieChip>
        )}
      </p>
      <p className="ebl-name mt-auto overflow-hidden whitespace-nowrap font-display text-[26px] font-bold uppercase leading-tight [mask-image:linear-gradient(90deg,#000_calc(100%-48px),transparent)]">
        {promo.name ?? "Nom à venir"}
      </p>
      {best ? (
        <p className="flex min-h-5 items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm font-semibold [mask-image:linear-gradient(90deg,#000_calc(100%-48px),transparent)]">
          {best.placement === "champion" ? (
            <LineIcon name="trophy" size={16} className="text-gold" />
          ) : best.placement === "finaliste" ? (
            <Medal size={14} />
          ) : null}
          {best.placement === "champion" ? "Champion" : best.placement === "finaliste" ? "Finaliste" : "Demi-finaliste"}{" "}
          {best.editions.map((e) => e.label).join(", ")}
        </p>
      ) : (
        <p aria-hidden className="min-h-5" />
      )}
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
        {edition.cancelled && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Annulée</span>
        )}
      </div>

      {edition.cancelled ? (
        <p className="mt-4 text-sm text-ink-soft">Saison annulée : aucun titre décerné.</p>
      ) : edition.champion ? (
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
            <dt className="inline-flex items-center gap-1 text-ink-soft">
              <Medal size={14} /> Finaliste
            </dt>
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

/** Frise verticale des éditions, la plus récente en haut. */
export function EditionTimeline({ editions }: { editions: EditionView[] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-0 before:left-[27px] before:top-0 before:w-0.5 before:bg-line">
      {editions.map((e, i) => (
        <li
          key={e.start_year}
          data-reveal
          style={{ "--reveal-delay": `${Math.min(i, 6) * 60}ms` } as React.CSSProperties}
          className="relative grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 sm:gap-5"
        >
          <TimelineDot edition={e} />
          <TimelineCard edition={e} />
        </li>
      ))}
    </ol>
  );
}

function TimelineDot({ edition }: { edition: EditionView }) {
  const gold = !edition.cancelled && edition.champion;
  return (
    <span
      className={`relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 ${
        gold ? "border-gold bg-gold text-night" : "border-line bg-surface text-ink-soft"
      }`}
    >
      <LineIcon name={gold ? "trophy" : edition.known && !edition.cancelled ? "calendar" : "info"} size={22} />
    </span>
  );
}

const TL_CARD = "grid items-center gap-3 rounded-2xl border p-5 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-5 sm:px-[22px]";

function TimelineCard({ edition }: { edition: EditionView }) {
  const year = <span className="font-display text-[28px] font-bold leading-none">{edition.label}</span>;

  if (!edition.known) {
    return (
      <div className={`${TL_CARD} border-dashed border-line`}>
        <span className="font-display text-[28px] font-bold leading-none text-ink-soft">{edition.label}</span>
        <div>
          <strong>Cette édition n&apos;est pas encore racontée.</strong>
          <p className="text-sm text-ink-soft">Tu y étais ? Vainqueur, finaliste, MVP, photos.</p>
        </div>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-teal hover:text-teal-strong"
        >
          Compléter <LineIcon name="arrow" size={16} />
        </a>
      </div>
    );
  }

  const champ = edition.cancelled ? null : edition.champion;
  const mvp = edition.awards.find((a) => a.type === "mvp");
  const score = champ && edition.final ? seriesScore(edition.final, champ.number) : null;
  const live = edition.status === "en_cours";

  return (
    <Link
      href={`/editions/${edition.label}`}
      className={`group ${TL_CARD} bg-surface transition duration-200 hover:translate-x-[3px] hover:border-teal ${
        live ? "border-dashed border-line" : "border-line"
      }`}
    >
      {year}
      <div className="min-w-0">
        {edition.cancelled ? (
          <>
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">Annulée</span>
            <p className="mt-1 text-sm text-ink-soft">Saison annulée : aucun titre décerné.</p>
          </>
        ) : champ ? (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex min-w-0 items-center gap-2.5">
                <PromoBadge promo={champ} size={44} className="!rounded-full" />
                <strong className="ebl-name font-display text-xl font-bold uppercase leading-tight">{promoName(champ)}</strong>
              </span>
              <TieChip level={levelOf(champ, edition.start_year)} className="bg-surface-2">
                {promoCode(champ)} · {levelOf(champ, edition.start_year)}
              </TieChip>
              {edition.finalist && (
                <span className="text-sm text-ink-soft">
                  bat {promoName(edition.finalist)}
                  {score && <span className="ml-1 font-display text-base font-semibold text-ink">{score}</span>}
                </span>
              )}
            </div>
            {mvp && (
              <p className="mt-2 text-sm text-ink-soft">
                MVP : {mvp.player.full_name} ({promoCode(mvp.promo)})
              </p>
            )}
          </>
        ) : live ? (
          <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs font-semibold text-white">En cours</span>
        ) : edition.final ? (
          <p className="text-sm text-ink-soft">
            Finale : <strong className="text-ink">IT{edition.final.promo_a}</strong> contre{" "}
            <strong className="text-ink">IT{edition.final.promo_b}</strong>
          </p>
        ) : null}
      </div>
      <LineIcon name="arrow" size={20} className="hidden text-ink-soft transition-colors group-hover:text-teal sm:block" />
    </Link>
  );
}
