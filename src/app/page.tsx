import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import {
  WHATSAPP_URL,
  buildLeague,
  levelOf,
  promoCode,
  promoName,
  promoSlug,
  type EditionView,
  type League,
} from "@/lib/league";
import type { Promo, Series } from "@/lib/types";
import { PromoBadge } from "@/components/promo-badge";
import { Countdown } from "@/components/countdown";
import { EditionCard, PromoCard } from "@/components/cards";
import { Section, seriesScore } from "@/components/ui";
import { ResultsList, StandingsTable } from "@/components/season";

export const revalidate = 60;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function Home() {
  const league = buildLeague(await getLeagueData());
  const spot = league.spotlight();
  const known = league.editions.filter((e) => e.known);
  const missing = league.editions.filter((e) => !e.known);

  return (
    <>
      {spot?.kind === "final" && <FinalHero league={league} edition={spot.edition} series={spot.series} />}
      {spot?.kind === "champion" && <ChampionHero edition={spot.edition} />}
      {spot?.kind === "season" && <SeasonHero league={league} edition={spot.edition} />}

      <Ladder league={league} />

      <Section title="Les éditions" kicker="Palmarès" action={{ href: "/editions", label: "Toutes les éditions" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {known.slice(0, 3).map((e) => (
            <EditionCard key={e.start_year} edition={e} />
          ))}
        </div>
      </Section>

      <Section title="Les promos" kicker="Une promo, une équipe" action={{ href: "/promos", label: "Toutes les promos" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {league.promos.slice(0, 6).map((p) => (
            <PromoCard key={p.number} promo={p} league={league} />
          ))}
        </div>
      </Section>

      {missing.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-teal-soft p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase">L&apos;histoire commence en 2019</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Il nous manque les éditions {missing.map((e) => e.label).reverse().join(", ")}. Si tu étais là,
                raconte-nous : vainqueur, finaliste, MVP, photos.
              </p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener"
              className="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-strong"
            >
              Écrire sur WhatsApp
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function FinalHero({ league, edition, series }: { league: League; edition: EditionView; series: Series }) {
  const a = league.promo(series.promo_a)!;
  const b = league.promo(series.promo_b)!;
  return (
    <section className="court-lines relative overflow-hidden bg-night text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-teal">
          Finale EBL {edition.label}
        </p>
        {edition.final_date && (
          <p className="mt-2 text-center font-display text-lg uppercase text-white/80">
            {dateFmt.format(new Date(`${edition.final_date}T00:00:00Z`))}
            {edition.final_time ? ` · ${edition.final_time.slice(0, 5).replace(":", "h")}` : " · heure à confirmer"}
            {edition.venue ? ` · ${edition.venue}` : ""}
          </p>
        )}

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-8">
          <Finalist promo={a} year={edition.start_year} league={league} />
          <div className="pt-10 text-center sm:pt-16">
            <p className="font-display text-3xl font-bold text-white/40 sm:text-5xl">VS</p>
            {edition.final_date && (
              <p className="mt-3 whitespace-nowrap rounded-full bg-teal px-2.5 py-1 font-display text-base font-bold sm:px-3 sm:text-2xl">
                <Countdown date={edition.final_date} />
              </p>
            )}
          </div>
          <Finalist promo={b} year={edition.start_year} league={league} />
        </div>

        {edition.semis.length > 0 && (
          <div className="mx-auto mt-10 max-w-xl border-t border-white/10 pt-5 text-center text-sm text-white/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Le chemin vers la finale</p>
            <ul className="space-y-1">
              {edition.semis.map((s) => (
                <li key={s.id}>
                  <SeriesLine series={s} league={league} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Finalist({ promo, year, league }: { promo: Promo; year: number; league: League }) {
  const level = levelOf(promo, year);
  return (
    <Link href={`/promos/${promoSlug(promo)}`} className="group flex flex-col items-center text-center">
      <PromoBadge
        promo={promo}
        size={160}
        className="h-24 w-24 ring-4 ring-white/10 transition-transform group-hover:scale-105 sm:h-40 sm:w-40"
      />
      <p className="mt-4 font-display text-lg font-bold uppercase leading-tight [overflow-wrap:anywhere] sm:text-3xl">{promoName(promo)}</p>
      <p className="mt-1 font-display text-sm tracking-widest text-white/60">
        {promoCode(promo)} · {level}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-white/75 sm:text-sm">
        {league.stakes(promo, year).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </Link>
  );
}

function SeriesLine({ series, league }: { series: Series; league: League }) {
  const w = series.winner ? league.promo(series.winner)! : null;
  const l = w ? league.promo(w.number === series.promo_a ? series.promo_b : series.promo_a)! : null;
  if (!w || !l) {
    return (
      <span>
        {promoName(league.promo(series.promo_a)!)} contre {promoName(league.promo(series.promo_b)!)}
      </span>
    );
  }
  const score = seriesScore(series, w.number);
  return (
    <span>
      <strong className="text-white">{promoName(w)}</strong> ({promoCode(w)}) bat {promoName(l)} ({promoCode(l)})
      {score && <span className="ml-1 font-display font-semibold text-teal">{score}</span>}
    </span>
  );
}

function ChampionHero({ edition }: { edition: EditionView }) {
  const champ = edition.champion!;
  const mvp = edition.awards.find((a) => a.type === "mvp");
  const score = edition.final ? seriesScore(edition.final, champ.number) : null;
  return (
    <section
      className="court-lines text-white"
      style={{ background: `linear-gradient(135deg, var(--night) 40%, ${champ.color_primary})` }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:flex-row sm:text-left">
        <PromoBadge promo={champ} size={180} className="h-32 w-32 sm:h-44 sm:w-44" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Champion EBL {edition.label}</p>
          <h1 className="font-display text-5xl font-bold uppercase sm:text-7xl">{promoName(champ)}</h1>
          <p className="mt-2 text-white/75">
            {promoCode(champ)}, sacrée en {levelOf(champ, edition.start_year)}
            {edition.finalist && <> face à {promoName(edition.finalist)}</>}
            {score && <> ({score})</>}.
            {mvp && (
              <>
                {" "}
                MVP : <strong className="text-white">{mvp.player.full_name}</strong>.
              </>
            )}
          </p>
          <Link href={`/editions/${edition.label}`} className="mt-4 inline-block text-sm font-semibold text-teal">
            Revivre l&apos;édition →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Ladder({ league }: { league: League }) {
  const ladder = league.ladder();
  const slams = league.grandSlams();
  return (
    <Section title="De la L1 au M2" kicker="L'échelle des champions">
      <p className="-mt-3 mb-6 max-w-2xl text-sm text-ink-soft">
        Chaque titre est rangé au niveau où il a été gagné. Une promo a cinq ans pour écrire son histoire, et celle qui
        gagnerait à tous les niveaux réussirait le <strong className="text-ink">Grand Chelem</strong>.
      </p>
      {slams.length > 0 && (
        <p className="mb-4 rounded-xl bg-gold/20 p-3 text-sm font-semibold">
          🏆 Grand Chelem : {slams.map((p) => `${promoName(p)} (${promoCode(p)})`).join(", ")}
        </p>
      )}
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ladder.map(({ level, champions }, i) => (
          <li
            key={level}
            className={`flex min-h-36 flex-col rounded-2xl border p-4 ${
              champions.length ? "border-line bg-surface" : "border-dashed border-line bg-transparent"
            } ${i === ladder.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <p className="font-display text-3xl font-bold text-teal">{level}</p>
            {champions.length === 0 ? (
              <p className="mt-auto text-sm text-ink-soft">À conquérir</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {champions.map(({ promo, edition }) => (
                  <li key={edition.start_year}>
                    <Link href={`/promos/${promoSlug(promo)}`} className="flex items-center gap-2 hover:text-teal">
                      <PromoBadge promo={promo} size={36} className="rounded-lg" />
                      <span className="text-sm leading-tight">
                        <span className="block font-semibold">{promoName(promo)}</span>
                        <span className="text-xs text-ink-soft">{edition.label}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function SeasonHero({ league, edition }: { league: League; edition: EditionView }) {
  return (
    <>
      <section className="court-lines bg-night text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal">Saison en cours</p>
          <h1 className="font-display text-5xl font-bold uppercase sm:text-7xl">EBL {edition.label}</h1>
          <p className="mt-2 max-w-xl text-white/70">
            {edition.teams.length} équipes dans une poule unique. Les 4 premières vont en demi-finales.
          </p>
          <Link href={`/editions/${edition.label}`} className="mt-4 inline-block text-sm font-semibold text-teal">
            Tout le classement et les résultats →
          </Link>
        </div>
      </section>
      <Section title="Classement" kicker="Poule">
        <StandingsTable edition={edition} league={league} compact />
      </Section>
      <Section title="Derniers résultats" action={{ href: `/editions/${edition.label}`, label: "Tous les résultats" }}>
        <ResultsList edition={edition} league={league} limit={5} />
      </Section>
    </>
  );
}
