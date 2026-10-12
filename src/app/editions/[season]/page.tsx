import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildLeague, parseSeason, promoCode, promoName, seasonLabel } from "@/lib/league";
import { PromoBadge } from "@/components/promo-badge";
import { PageTitle, Section } from "@/components/ui";
import { ProposedSemis, ResultsList, SeriesCard, StandingsTable } from "@/components/season";

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

      {e.teams.length > 0 && (
        <Section title="La poule" kicker={`${e.teams.length} équipes · chacune joue une fois contre les autres`}>
          <StandingsTable edition={e} league={league} />
        </Section>
      )}

      {e.semis.length === 0 && e.poule.length > 0 && !e.final && (
        <Section title="Demi-finales" kicker="Au meilleur des 3">
          <ProposedSemis edition={e} league={league} />
        </Section>
      )}

      {e.final && (
        <Section title="La finale" kicker={e.final.winner ? undefined : "À venir"}>
          <SeriesCard series={e.final} league={league} year={e.start_year} big />
        </Section>
      )}

      {e.semis.length > 0 && (
        <Section title="Demi-finales" kicker="Au meilleur des 3">
          <div className="grid gap-4 sm:grid-cols-2">
            {e.semis.map((s) => (
              <SeriesCard key={s.id} series={s} league={league} year={e.start_year} />
            ))}
          </div>
        </Section>
      )}

      {e.poule.length > 0 && (
        <Section title="Résultats">
          <ResultsList edition={e} league={league} />
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
