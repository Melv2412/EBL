import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import {
  buildLeague,
  levelOf,
  parseSeason,
  promoCode,
  promoName,
  promoSlug,
  seasonLabel,
  type League,
} from "@/lib/league";
import type { Series } from "@/lib/types";
import { PromoBadge } from "@/components/promo-badge";
import { LevelTag, PageTitle, Section, seriesScore } from "@/components/ui";

export const revalidate = 60;

type Props = { params: Promise<{ season: string }> };

export async function generateStaticParams() {
  const data = await getLeagueData();
  return data.editions.map((e) => ({ season: seasonLabel(e.start_year) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  const year = parseSeason(season);
  if (year === null) return {};
  const e = buildLeague(await getLeagueData()).edition(year);
  if (!e) return {};
  const description = e.champion
    ? `${promoName(e.champion)} (${promoCode(e.champion)}) champion de l'EBL ${e.label}.`
    : `L'édition ${e.label} de l'ESATIC Basket League.`;
  return { title: `Édition ${e.label}`, description, openGraph: { title: `EBL ${e.label}`, description } };
}

export default async function EditionPage({ params }: Props) {
  const { season } = await params;
  const year = parseSeason(season);
  const league = buildLeague(await getLeagueData());
  const e = year === null ? null : league.edition(year);
  if (!e) notFound();

  const mvps = e.awards.filter((a) => a.type === "mvp");
  const mentions = e.awards.filter((a) => a.type === "mention_honorable");

  return (
    <>
      <PageTitle
        kicker={e.status === "en_cours" ? "Édition en cours" : "Édition"}
        title={`EBL ${e.label}`}
        intro={e.summary ?? undefined}
      />

      {!e.known && (
        <Section title="À raconter">
          <p className="text-ink-soft">
            On ne connaît pas encore le palmarès de cette édition. Si tu y étais, écris-nous sur WhatsApp (lien en bas
            de page).
          </p>
        </Section>
      )}

      {e.final && (
        <Section title="La finale" kicker={e.final.winner ? undefined : "À venir"}>
          <SeriesCard series={e.final} league={league} year={e.start_year} big />
        </Section>
      )}

      {e.semis.length > 0 && (
        <Section title="Demi-finales">
          <div className="grid gap-4 sm:grid-cols-2">
            {e.semis.map((s) => (
              <SeriesCard key={s.id} series={s} league={league} year={e.start_year} />
            ))}
          </div>
        </Section>
      )}

      {(mvps.length > 0 || mentions.length > 0) && (
        <Section title="Distinctions">
          <ul className="grid gap-4 sm:grid-cols-2">
            {[...mvps, ...mentions].map((a) => (
              <li key={a.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                <PromoBadge promo={a.promo} size={48} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal">
                    {a.type === "mvp" ? "MVP du tournoi" : "Mention honorable"}
                  </p>
                  <p className="font-display text-xl font-bold">{a.player.full_name}</p>
                  <p className="text-sm text-ink-soft">
                    {promoName(a.promo)} · {promoCode(a.promo)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <Link href="/editions" className="text-sm font-medium text-teal">
          ← Toutes les éditions
        </Link>
      </div>
    </>
  );
}

function SeriesCard({ series, league, year, big }: { series: Series; league: League; year: number; big?: boolean }) {
  const decided = series.winner !== null;
  const side = (n: number) => {
    const p = league.promo(n)!;
    const won = series.winner === p.number;
    return (
      <Link
        href={`/promos/${promoSlug(p)}`}
        className={`flex flex-col items-center gap-2 text-center ${decided && !won ? "opacity-55" : ""}`}
      >
        <PromoBadge promo={p} size={big ? 112 : 64} />
        <span className={`font-display font-bold uppercase leading-tight [overflow-wrap:anywhere] ${big ? "text-xl sm:text-2xl" : "text-lg"}`}>
          {promoName(p)}
        </span>
        <span className="text-xs text-ink-soft">
          {promoCode(p)} <LevelTag level={levelOf(p, year)} />
        </span>
        {won && <span className="text-xs font-semibold text-gold">Vainqueur</span>}
      </Link>
    );
  };
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        {side(series.promo_a)}
        <div className="text-center">
          <p className={`font-display font-bold ${big ? "text-4xl" : "text-2xl"}`}>{seriesScore(series) ?? "VS"}</p>
          {series.best_of > 1 && <p className="text-xs text-ink-soft">au meilleur des {series.best_of}</p>}
        </div>
        {side(series.promo_b)}
      </div>
    </div>
  );
}
