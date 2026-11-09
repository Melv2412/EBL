import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { electTeam, formatWhen, getAllEbl, getTally, scoreTally, votePhase } from "@/lib/allebl";
import { buildLeague, parseSeason, promoCode, promoName, promoSlug, seasonLabel } from "@/lib/league";
import { currentAdmin, supabaseServer } from "@/lib/supabase-server";
import { AllEblCourt } from "@/components/all-ebl-court";
import { AwardIcon } from "@/components/award-icon";
import { AllEblResults } from "@/components/all-ebl-results";
import { PageTitle, Section } from "@/components/ui";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All-EBL Team", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ saison?: string }> };

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
  const rows = [...scored]
    .sort((a, b) => (a.side === b.side ? b.score - a.score : a.side === "ext" ? -1 : 1))
    .map((candidate) => {
      const player = data.players.find((entry) => entry.id === candidate.player_id);
      const promo = player && league.promo(player.promo);
      return {
        ...candidate,
        name: player?.full_name ?? "Joueur indisponible",
        promoLabel: promo ? `${promoName(promo)} · ${promoCode(promo)}` : "",
        promoHref: promo ? `/promos/${promoSlug(promo)}` : null,
        photoUrl: player?.photo_url ?? null,
        elected: elected.has(`${candidate.side}-${candidate.player_id}`),
      };
    });
  const selectedCount = team.ext.length + team.int.length;
  const publicBallots = scored[0]?.public_ballots ?? 0;
  const captainBallots = scored[0]?.captain_ballots ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.season}><span aria-hidden><AwardIcon type="mvp_finale" size={17} /></span> Saison {label}</p>
          <h1 className={styles.title}>All-EBL Team</h1>
          <p className={styles.intro}>
            3 extérieurs. 2 intérieurs. L&apos;équipe de la saison,
            élue par le public et les capitaines de chaque promo.
          </p>
          <span className={styles.heroRule} aria-hidden />
        </div>
      </header>

      <div className={styles.content}>
      {admin && !s.allebl_published && (
          <p className={styles.notice}>
            Aperçu admin : cette saison n&apos;est pas encore publique.
            {phase !== "clos" && " Le décompte affiché est provisoire."}
          </p>
      )}

      {seasons.length > 1 && (
        <nav className={styles.seasons} aria-label="Saisons">
          {seasons.map((x) => (
            <Link
              key={x.start_year}
              href={`/all-ebl?saison=${seasonLabel(x.start_year)}`}
              aria-current={x.start_year === s.start_year ? "page" : undefined}
            >
              {seasonLabel(x.start_year)}
            </Link>
          ))}
        </nav>
      )}

        {phase === "a_venir" && (
          <section className={styles.status}>
            <p className={styles.eyebrow}>La sélection se prépare</p>
            <h2>À chaque saison, son cinq majeur.</h2>
            <p>Le vote ouvrira {formatWhen(s.allebl_opens_at)}.</p>
          </section>
        )}
        {phase === "ouvert" && !showResults && (
          <section className={styles.status}>
            <p className={styles.eyebrow}><span className={styles.liveDot} aria-hidden /> Vote ouvert</p>
            <h2>Le prochain cinq majeur se joue maintenant.</h2>
            <p>
              {s.allebl_closes_at && <>Vote jusqu&apos;au {formatWhen(s.allebl_closes_at)}. </>}
              L&apos;équipe et le classement seront dévoilés après la clôture.
            </p>
            <Link href="/vote" className={styles.voteButton}>
              Composer mon cinq <span aria-hidden>→</span>
            </Link>
          </section>
        )}

        {showResults && (
          <>
            <AllEblResults
              rows={rows}
              provisional={phase !== "clos"}
              court={selectedCount > 0 ? (
                <AllEblCourt team={team} players={data.players} promos={data.promos} showcase />
              ) : (
                <div className={styles.emptyResults}>
                  <AwardIcon type="mvp_finale" size={36} />
                  <h3>Aucun vote pour cette saison.</h3>
                  <p>Aucune équipe n&apos;a été élue.</p>
                </div>
              )}
            />
            <dl className={styles.summary}>
              <div><dt>Saison</dt><dd>{label}</dd></div>
              <div><dt>Joueurs sélectionnés</dt><dd>{selectedCount}<span> / 5</span></dd></div>
              <div><dt>Bulletins du public</dt><dd>{publicBallots}</dd></div>
              <div><dt>Bulletins des capitaines</dt><dd>{captainBallots}</dd></div>
            </dl>
            <p className={styles.formula}>
              {publicBallots > 0 && captainBallots > 0
                ? "Score sur 100 : 50 % public, 50 % capitaines."
                : publicBallots > 0
                  ? "Score sur 100 : seuls les bulletins du public ont été exprimés, ils comptent pour 100 %."
                  : captainBallots > 0
                    ? "Score sur 100 : seuls les bulletins des capitaines ont été exprimés, ils comptent pour 100 %."
                    : "Score sur 100 : aucun bulletin exprimé."}
            </p>
          </>
        )}
      </div>
    </div>
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
