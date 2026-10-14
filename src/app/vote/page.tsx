import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { ballotCandidates, formatWhen, getAllEbl, votePhase } from "@/lib/allebl";
import { seasonLabel } from "@/lib/league";
import { currentAdmin } from "@/lib/supabase-server";
import { Ballot } from "@/components/ballot";
import { PageTitle, Section } from "@/components/ui";
import { hasVoted, publicVote } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vote All-EBL Team", robots: { index: false, follow: false } };

export default async function VotePage() {
  const [{ settings, candidates, ready }, admin, data] = await Promise.all([getAllEbl(), currentAdmin(), getLeagueData()]);
  if (!ready) notFound();

  // L'édition dont le vote est ouvert, sinon la plus récente configurée.
  const visible = settings.filter((s) => s.allebl_published || admin);
  const s = visible.find((x) => votePhase(x) === "ouvert") ?? visible.find((x) => votePhase(x) !== "non_configure");
  if (!s) notFound();

  const phase = votePhase(s);
  const label = seasonLabel(s.start_year);
  const list = ballotCandidates(s.start_year, candidates, data.players, data.promos);
  const voted = await hasVoted(s.start_year);

  return (
    <>
      <PageTitle
        kicker={`All-EBL Team ${label}`}
        title="Élis le 5 de la saison"
        intro="3 extérieurs et 2 intérieurs. Ton vote compte pour moitié, celui des capitaines de chaque promo pour l'autre moitié."
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
            <Link href={`/all-ebl?saison=${label}`} className="font-semibold text-teal">
              Voir l&apos;All-EBL Team {label} →
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
            <Ballot action={publicVote} hidden={{ edition_year: s.start_year }} candidates={list} />
          </>
        )}
      </Section>
    </>
  );
}
