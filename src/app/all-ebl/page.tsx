import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { SIDE_LABEL, electTeam, formatWhen, getAllEbl, getTally, scoreTally, votePhase } from "@/lib/allebl";
import { buildLeague, parseSeason, promoCode, promoName, seasonLabel } from "@/lib/league";
import { currentAdmin, supabaseServer } from "@/lib/supabase-server";
import { AllEblCourt } from "@/components/all-ebl-court";
import { PageTitle, Section } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All-EBL Team", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ saison?: string }> };

const pct = (x: number) => `${Math.round(x * 100)} %`;

export default async function AllEblPage({ searchParams }: Props) {
  const [{ settings, ready }, admin, data] = await Promise.all([getAllEbl(), currentAdmin(), getLeagueData()]);
  if (!ready) notFound();

  // Une saison n'apparaît qu'une fois configurée, et publiée (sauf pour les admins).
  const seasons = settings.filter((s) => votePhase(s) !== "non_configure" && (s.allebl_published || admin));
  if (seasons.length === 0) {
    if (admin && settings[0]) return <NotConfigured year={settings[0].start_year} />;
    notFound();
  }

  const wanted = parseSeason((await searchParams).saison ?? "");
  const s = seasons.find((x) => x.start_year === wanted) ?? seasons[0];
  const phase = votePhase(s);
  const label = seasonLabel(s.start_year);
  const league = buildLeague(data);

  // Les admins voient le décompte en direct ; le public seulement une fois le vote clos et publié.
  const tally = await getTally(s.start_year, admin ? await supabaseServer() : undefined);
  const scored = scoreTally(tally);
  const name = (id: number) => data.players.find((p) => p.id === id)?.full_name ?? "";
  const team = electTeam(scored, name);
  const showResults = phase === "clos" || (admin && scored.some((x) => x.public_ballots || x.captain_ballots));
  const elected = new Set([...team.ext, ...team.int].map((c) => `${c.side}-${c.player_id}`));

  return (
    <>
      <PageTitle
        kicker="L'équipe type de la saison"
        title="All-EBL Team"
        intro="3 extérieurs et 2 intérieurs, élus moitié par le public, moitié par les capitaines de chaque promo."
      />

      {admin && !s.allebl_published && (
        <div className="mx-auto mt-6 max-w-6xl px-4">
          <p className="rounded-xl bg-gold/20 p-3 text-sm font-semibold">
            Aperçu admin : cette saison n&apos;est pas encore publique.
            {phase !== "clos" && " Le décompte affiché est provisoire."}
          </p>
        </div>
      )}

      {seasons.length > 1 && (
        <nav className="mx-auto mt-8 flex max-w-6xl flex-wrap gap-2 px-4" aria-label="Saisons">
          {seasons.map((x) => (
            <Link
              key={x.start_year}
              href={`/all-ebl?saison=${seasonLabel(x.start_year)}`}
              aria-current={x.start_year === s.start_year ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                x.start_year === s.start_year ? "bg-teal text-white" : "border border-line text-ink-soft hover:text-ink"
              }`}
            >
              {seasonLabel(x.start_year)}
            </Link>
          ))}
        </nav>
      )}

      <Section title={`Saison ${label}`}>
        {phase === "a_venir" && <p className="text-ink-soft">Le vote ouvrira {formatWhen(s.allebl_opens_at)}.</p>}
        {phase === "ouvert" && !showResults && (
          <div className="rounded-2xl border border-teal bg-teal-soft p-6 text-center">
            <p className="font-display text-2xl font-bold uppercase">Le vote est ouvert</p>
            <p className="mt-1 text-sm text-ink-soft">Jusqu&apos;au {formatWhen(s.allebl_closes_at)}.</p>
            <Link href="/vote" className="mt-4 inline-block rounded-full bg-teal px-5 py-2 font-semibold text-white">
              Voter →
            </Link>
          </div>
        )}

        {showResults && (
          <div className="space-y-8">
            {team.ext.length + team.int.length > 0 ? (
              <AllEblCourt team={team} players={data.players} promos={data.promos} />
            ) : (
              <p className="text-ink-soft">Aucun vote pour cette saison.</p>
            )}

            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                    <th className="py-3 pl-4 font-semibold">Joueur</th>
                    <th className="py-3 font-semibold">Poste</th>
                    <th className="px-2 py-3 text-right font-semibold">Public</th>
                    <th className="px-2 py-3 text-right font-semibold">Capitaines</th>
                    <th className="py-3 pl-2 pr-4 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...scored]
                    .sort((a, b) => (a.side === b.side ? b.score - a.score : a.side === "ext" ? -1 : 1))
                    .map((c) => {
                      const p = data.players.find((x) => x.id === c.player_id);
                      const pr = p && league.promo(p.promo);
                      const won = elected.has(`${c.side}-${c.player_id}`);
                      return (
                        <tr key={`${c.side}-${c.player_id}`} className={`border-b border-line last:border-0 ${won ? "font-semibold" : ""}`}>
                          <td className="py-2.5 pl-4">
                            {won && "⭐ "}
                            {p?.full_name}
                            {pr && <span className="ml-1 text-xs font-normal text-ink-soft">{promoName(pr)} · {promoCode(pr)}</span>}
                          </td>
                          <td className="py-2.5 text-ink-soft">{SIDE_LABEL[c.side]}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums">{pct(c.publicShare)}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums">{pct(c.captainShare)}</td>
                          <td className="py-2.5 pl-2 pr-4 text-right tabular-nums">{c.score.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              <p className="border-t border-line px-4 py-2 text-xs text-ink-soft">
                {scored[0]?.public_ballots ?? 0} bulletins du public · {scored[0]?.captain_ballots ?? 0} bulletins de
                capitaines. Pourcentage = part des bulletins qui ont choisi le joueur.
              </p>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

function NotConfigured({ year }: { year: number }) {
  return (
    <>
      <PageTitle kicker="Aperçu admin" title="All-EBL Team" />
      <Section title="Pas encore configuré">
        <p className="max-w-xl text-ink-soft">
          Cette page n&apos;est visible que par les admins. Pour l&apos;activer, règle les dates d&apos;ouverture et de
          fermeture du vote et coche les candidats.
        </p>
        <Link
          href={`/admin/editions/${year}/all-ebl`}
          className="mt-4 inline-block rounded-full bg-teal px-5 py-2 font-semibold text-white"
        >
          Configurer l&apos;All-EBL Team →
        </Link>
      </Section>
    </>
  );
}
