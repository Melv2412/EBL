import Image from "next/image";
import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { getHomeSettings } from "@/lib/home-settings";
import { orderedHomeSlides } from "@/lib/home-slides";
import { HomeSlideshow } from "@/components/home-slideshow";
import {
  WHATSAPP_URL,
  LEVEL_TIE,
  buildLeague,
  darkenHex,
  formatTime,
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
import { HowItWorks } from "@/components/how-it-works";
import { openPublishedVote } from "@/lib/allebl";
import { LineIcon, Tie, TieChip } from "@/components/icons";
import { EditionCard, PromoCard } from "@/components/cards";
import { Section, seriesScore } from "@/components/ui";

export const revalidate = 60;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function Home() {
  const data = await getLeagueData();
  const league = buildLeague(data);
  const { settings } = await getHomeSettings();
  const finalEdition = league.editions.find((edition) => edition.final && edition.final.winner === null);
  const championEdition = league.editions.find((edition) => edition.champion);
  const spot = settings.mode === "auto"
    ? league.spotlight()
    : settings.mode === "final" && finalEdition
      ? { kind: "final" as const, edition: finalEdition, series: finalEdition.final! }
      : settings.mode === "champion" && championEdition
        ? { kind: "champion" as const, edition: championEdition }
        : null;
  const next = spot?.kind === "final" ? null : league.nextMatch();
  const voteOpen = await openPublishedVote();
  const known = league.editions.filter((e) => e.known);
  const missing = league.editions.filter((e) => !e.known);

  return (
    <>
      {spot?.kind === "final" && <FinalHero league={league} edition={spot.edition} series={spot.series} />}
      {spot?.kind === "champion" && <ChampionHero edition={spot.edition} />}
      {!spot && (
        <HomeSlideshow
          key={JSON.stringify(settings.slides ?? settings.slide_order)}
          slides={settings.slides ?? orderedHomeSlides(settings.slide_order)}
          primary={voteOpen ? { href: "/vote", label: "Voter pour l'All-Star" } : { href: "/editions", label: "Les éditions" }}
          secondary={{ href: "/promos", label: "Les promos" }}
        />
      )}

      {next && <NextMatchCard league={league} edition={next.edition} series={next.series} />}

      {championEdition && spot?.kind !== "champion" && <ChampionCard edition={championEdition} />}

      <HowItWorks />

      <Ladder league={league} />

      <Section title="Les éditions" kicker="Palmarès" action={{ href: "/editions", label: "Toutes les éditions" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {known.slice(0, 3).map((e, i) => (
            <div key={e.start_year} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
              <EditionCard edition={e} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Les promos" kicker="Une promo, une équipe" action={{ href: "/promos", label: "Toutes les promos" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {league.promos.slice(0, 6).map((p, i) => (
            <div key={p.number} data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
              <PromoCard promo={p} league={league} />
            </div>
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
        <h1 className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-teal">
          Finale EBL {edition.label}
        </h1>
        <p className="mt-2 text-center font-display text-lg uppercase text-white/80">
          {edition.final_date ? (
            <>
              {dateFmt.format(new Date(`${edition.final_date}T00:00:00Z`))}
              {edition.final_time ? ` · ${edition.final_time.slice(0, 5).replace(":", "h")}` : " · heure à confirmer"}
            </>
          ) : (
            "Date à confirmer"
          )}
          {edition.venue ? ` · ${edition.venue}` : ""}
        </p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-8">
          <Finalist promo={a} year={edition.start_year} league={league} className="ebl-in-left" />
          <div className="pt-10 text-center sm:pt-16">
            <p className="ebl-vs font-display text-3xl font-bold text-white/40 sm:text-5xl">VS</p>
            {edition.final_date && (
              <p className="ebl-pulse mt-3 whitespace-nowrap rounded-full bg-teal px-2.5 py-1 font-display text-base font-bold sm:px-3 sm:text-2xl">
                <Countdown date={edition.final_date} />
              </p>
            )}
          </div>
          <Finalist promo={b} year={edition.start_year} league={league} className="ebl-in-right" />
        </div>

        {edition.semis.length > 0 && (
          <div className="mx-auto mt-10 max-w-xl border-t border-white/10 pt-5 text-center text-sm text-white/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Le chemin vers la finale</p>
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

function Finalist({ promo, year, league, className = "" }: { promo: Promo; year: number; league: League; className?: string }) {
  const level = levelOf(promo, year);
  return (
    <Link href={`/promos/${promoSlug(promo)}`} className={`group flex flex-col items-center text-center ${className}`}>
      <PromoBadge
        promo={promo}
        size={160}
        className="h-24 w-24 ring-4 ring-white/10 transition-transform group-hover:scale-105 sm:h-40 sm:w-40"
      />
      <p className="ebl-name mt-4 font-display text-[clamp(0.85rem,4.2vw,1.125rem)] font-bold uppercase leading-tight sm:text-3xl">{promoName(promo)}</p>
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

/** Champion en titre : tout vient de la dernière édition gagnée, rien n'est écrit à la main. */
function ChampionCard({ edition }: { edition: EditionView }) {
  const champ = edition.champion!;
  const level = levelOf(champ, edition.start_year);
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" data-reveal>
      <article className="grid overflow-hidden rounded-3xl bg-night text-white md:grid-cols-[1.1fr_1fr]">
        <div
          className="relative min-h-60 md:min-h-[360px]"
          style={champ.team_photo_url ? undefined : { background: `linear-gradient(140deg, ${champ.color_primary}, ${darkenHex(champ.color_primary)})` }}
        >
          {champ.team_photo_url ? (
            <Image
              src={champ.team_photo_url}
              alt={`L'équipe ${promoName(champ)}, championne ${edition.label}`}
              fill
              sizes="(min-width: 768px) 600px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <PromoBadge promo={champ} size={160} className="!rounded-full opacity-90" />
            </div>
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,var(--night))] md:bg-[linear-gradient(90deg,transparent_50%,var(--night))]"
          />
        </div>
        <div className="flex flex-col justify-center gap-[18px] p-6 md:p-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <LineIcon name="trophy" size={16} />
            Champion en titre · {edition.label}
          </p>
          <div className="flex items-center gap-3.5">
            <PromoBadge promo={champ} size={64} className="!rounded-full border-[3px] border-gold" />
            <div className="min-w-0">
              <h2 className="ebl-name font-display text-[clamp(2.1rem,4.5vw,3.25rem)] font-bold uppercase leading-none">
                {promoName(champ)}
              </h2>
              <TieChip level={level} className="mt-2 bg-night-2 text-white">
                {promoCode(champ)} · {level}
              </TieChip>
            </div>
          </div>
          <div>
            <Link
              href={`/editions/${edition.label}`}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night transition hover:brightness-110"
            >
              Revivre la saison <LineIcon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

/** Prochain match daté de la saison (hors finale, qui a sa propre une). */
function NextMatchCard({ league, edition, series }: { league: League; edition: EditionView; series: Series }) {
  const a = league.promo(series.promo_a)!;
  const b = league.promo(series.promo_b)!;
  const today = new Date().toISOString().slice(0, 10);
  const day = series.match_date === today ? "Aujourd'hui" : dateFmt.format(new Date(`${series.match_date}T00:00:00Z`));
  const time = formatTime(series.match_time);
  const round = series.round === "demi" ? "Demi-finale" : "Poule";
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" data-reveal>
      <Link
        href={`/editions/${edition.label}`}
        className="group relative block overflow-hidden rounded-3xl bg-night text-white"
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background: `linear-gradient(90deg, ${darkenHex(a.color_primary, 0.3)} 0%, transparent 42%, transparent 58%, ${darkenHex(b.color_primary, 0.3)} 100%)`,
          }}
        />
        <div className="relative p-6 md:p-8">
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <LineIcon name="calendar" size={16} />
            Prochain match · {round} {edition.label}
          </p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <NextTeam promo={a} />
            <div className="text-center">
              <p className="font-display text-2xl font-bold uppercase leading-none sm:text-3xl">vs</p>
            </div>
            <NextTeam promo={b} />
          </div>
          <p className="mt-5 text-center text-sm">
            <span className="font-semibold capitalize">{day}</span>
            {time ? ` · ${time}` : ""}
            {edition.venue ? ` · ${edition.venue}` : ""}
          </p>
          <p className="mt-3 text-center text-xs text-white/70 transition group-hover:text-gold">
            Classement et programme de la saison →
          </p>
        </div>
      </Link>
    </section>
  );
}

function NextTeam({ promo }: { promo: Promo }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <PromoBadge promo={promo} size={72} className="!rounded-full border-[3px] border-white/80" />
      <p className="ebl-name line-clamp-2 font-display text-lg font-bold uppercase leading-tight sm:text-2xl">
        {promoName(promo)}
      </p>
      <p className="text-xs text-white/70">{promoCode(promo)}</p>
    </div>
  );
}

function Ladder({ league }: { league: League }) {
  const ladder = league.ladder();
  const slams = league.grandSlams();
  return (
    <Section title="De la L1 au M2" kicker="L'échelle des champions">
      <p className="-mt-3 mb-6 max-w-2xl text-sm text-ink-soft">
        Chaque titre est rangé au niveau où il a été gagné. Une promo a cinq ans pour écrire son histoire, et celle qui
        gagnerait à tous les niveaux réussirait le <strong className="text-ink">Grand Chelem</strong>. Chaque
        niveau porte la couleur de sa cravate. Les anciens revenus jouer après le M2 comptent dans la dernière case.
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
            data-reveal
            style={{ "--reveal-delay": `${i * 120}ms`, borderColor: LEVEL_TIE[level].color } as React.CSSProperties}
            className={`flex min-h-36 flex-col rounded-2xl border-2 p-4 ${
              champions.length ? "bg-surface" : "border-dashed bg-transparent"
            } ${i === ladder.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <p className="flex items-center gap-2 font-display text-3xl font-bold">
              <Tie level={level} size={26} />
              {level === "M2" ? (
                <>
                  M2<span className="text-lg font-semibold text-ink-soft">&nbsp;et&nbsp;+</span>
                </>
              ) : (
                level
              )}
            </p>
            {champions.length === 0 ? (
              <p className="ebl-breathe mt-auto text-sm text-ink-soft">À conquérir</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {champions.map(({ promo, edition, alumni }) => (
                  <li key={edition.start_year} className="ebl-drop">
                    <Link href={`/promos/${promoSlug(promo)}`} className="flex items-center gap-2 hover:text-teal">
                      <PromoBadge promo={promo} size={36} className="rounded-lg" />
                      <span className="min-w-0 text-[0.8rem] leading-tight sm:text-sm">
                        <span className="ebl-name block font-semibold">{promoName(promo)}</span>
                        <span className="text-xs text-ink-soft">
                          {edition.label}
                          {alumni && " · anciens"}
                        </span>
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

