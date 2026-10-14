import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getLeagueData } from "@/lib/data";
import { ballotCandidates, formatWhen, getAllEbl, votePhase } from "@/lib/allebl";
import { buildLeague, promoName, seasonLabel } from "@/lib/league";
import { Ballot } from "@/components/ballot";
import { PageTitle, Section } from "@/components/ui";
import { captainVote } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vote capitaine", robots: { index: false, follow: false } };

type Props = { params: Promise<{ code: string }> };

export default async function CaptainVotePage({ params }: Props) {
  const { code } = await params;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: link } = await db.rpc("allebl_captain_link", { c: code }).maybeSingle<{
    edition_year: number;
    promo: number;
    used: boolean;
  }>();
  if (!link) notFound();

  const [{ settings, candidates }, data] = await Promise.all([getAllEbl(), getLeagueData()]);
  const s = settings.find((x) => x.start_year === link.edition_year);
  const promo = buildLeague(data).promo(link.promo);
  if (!s || !promo) notFound();

  const phase = votePhase(s);
  const label = seasonLabel(s.start_year);

  return (
    <>
      <PageTitle
        kicker={`Vote capitaine · ${promoName(promo)}`}
        title={`All-EBL Team ${label}`}
        intro="Ton bulletin compte dans la moitié « capitaines » du vote. Tu ne peux pas voter pour un joueur de ta promo, et ce lien ne sert qu'une fois."
      />
      <Section title="Ton bulletin">
        {link.used && <p className="text-ink-soft">Ce lien a déjà servi : ton vote est enregistré. Merci !</p>}
        {!link.used && phase === "a_venir" && <p className="text-ink-soft">Le vote ouvrira {formatWhen(s.allebl_opens_at)}.</p>}
        {!link.used && (phase === "clos" || phase === "non_configure") && <p className="text-ink-soft">Le vote est fermé.</p>}
        {!link.used && phase === "ouvert" && (
          <Ballot
            action={captainVote}
            hidden={{ code }}
            candidates={ballotCandidates(s.start_year, candidates, data.players, data.promos)}
            lockedPromo={link.promo}
          />
        )}
      </Section>
    </>
  );
}
