import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { ballotCandidates, formatWhen, getAllEbl, publicWeight, votePhase } from "@/lib/allebl";
import { seasonLabel } from "@/lib/league";
import { currentAdmin } from "@/lib/supabase-server";
import { Ballot } from "@/components/ballot";
import { PageTitle, Section } from "@/components/ui";
import { hasVoted, publicVote } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vote All-Star EBL Team", robots: { index: false, follow: false } };

export default async function VotePage() {
  const [{ settings, candidates, ready }, admin, data] = await Promise.all([getAllEbl(), currentAdmin(), getLeagueData()]);
  if (!ready) notFound();

  const visible = settings.filter((s) => s.allebl_published || admin);
  const upcoming = visible
    .filter((season) => votePhase(season) === "a_venir")
    .sort((first, second) => Date.parse(first.allebl_opens_at!) - Date.parse(second.allebl_opens_at!));
  const s = visible.find((season) => votePhase(season) === "ouvert")
    ?? upcoming[0]
    ?? (admin ? visible.find((season) => votePhase(season) === "clos") : undefined);
  if (!s) {
    if (admin && settings[0]) return <NotConfigured year={settings[0].start_year} />;
    return (
      <>
        <PageTitle kicker="All-Star EBL Team" title="Vote All-Star" />
        <Section title="Aucun vote ouvert">
          <p className="text-ink-soft">Aucun vote public n&apos;est ouvert ou annoncé pour le moment.</p>
          <Link href="/all-star" className="mt-4 inline-block font-semibold text-teal">Voir les équipes élues</Link>
        </Section>
      </>
    );
  }

  const phase = votePhase(s);
  const label = seasonLabel(s.start_year);
  const list = ballotCandidates(s.start_year, candidates, data.players, data.promos);
  const voted = await hasVoted(s.start_year);
  const publicPct = Math.round(publicWeight(s.start_year) * 100);

  return (
    <>
      <PageTitle
        kicker={`All-Star EBL Team ${label}`}
        title="Élis le 5 de la saison"
        intro={`3 extérieurs et 2 intérieurs. Le vote du public compte pour ${publicPct} %, celui des capitaines de chaque promo pour ${100 - publicPct} %.`}
      />
      {!s.allebl_published && (
        <div className="mx-auto mt-6 max-w-6xl px-4">
          <p className="rounded-xl bg-gold/20 p-3 text-sm font-semibold">
            Aperçu admin : cette page n&apos;est pas encore publique. Les votes de test comptent : efface-les dans
            l&apos;admin avant la publication.
          </p>
        </div>
      )}
      <Section title={phase === "ouvert" ? "Ton bulletin" : "Le vote"}>
        {phase === "a_venir" && <p className="text-ink-soft">Le vote ouvrira {formatWhen(s.allebl_opens_at)}.</p>}
        {phase === "clos" && (
          <p className="text-ink-soft">
            Le vote est terminé.{" "}
            <Link href={`/all-star?saison=${label}`} className="font-semibold text-teal">
              Voir l&apos;All-Star EBL Team {label} →
            </Link>
          </p>
        )}
        {phase === "ouvert" && voted && (
          <p className="rounded-2xl border border-teal bg-teal-soft p-6 text-center font-semibold">
            Tu as déjà voté depuis cet appareil. Résultats {formatWhen(s.allebl_closes_at) ? `le ${formatWhen(s.allebl_closes_at)}` : "à la fin du vote"}.
          </p>
        )}
        {phase === "ouvert" && !voted && (
          <>
            {s.allebl_closes_at && (
              <p className="-mt-3 mb-6 text-sm text-ink-soft">Fin du vote : {formatWhen(s.allebl_closes_at)}.</p>
            )}
            <Ballot action={publicVote} hidden={{ edition_year: s.start_year }} candidates={list} season={label} />
          </>
        )}
      </Section>
    </>
  );
}

function NotConfigured({ year }: { year: number }) {
  return (
    <>
      <PageTitle kicker="Aperçu admin" title="All-Star EBL Team" />
      <Section title="Pas encore configuré">
        <p className="max-w-xl text-ink-soft">
          Cette page n&apos;est visible que par les admins. Pour l&apos;activer, règle les dates d&apos;ouverture et de
          fermeture du vote et coche les candidats.
        </p>
        <Link
          href={`/admin/editions/${year}/all-ebl`}
          className="mt-4 inline-block rounded-full bg-teal px-5 py-2 font-semibold text-white"
        >
          Configurer l&apos;All-Star EBL Team →
        </Link>
      </Section>
    </>
  );
}
