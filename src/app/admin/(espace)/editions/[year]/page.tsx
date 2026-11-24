import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildLeague, formatTime, levelOf, promoCode, promoName, seriesScore, type League, type SeriesView } from "@/lib/league";
import { StandingsTable, formatDay } from "@/components/season";
import { ALLEBL_FIRST_YEAR } from "@/lib/allebl";
import { AWARDS, AWARD_ORDER } from "@/lib/awards";
import {
  addAward,
  createFinal,
  createSemis,
  deleteAward,
  updateAward,
  deleteEdition,
  deleteSeries,
  generatePoule,
  saveEdition,
  saveSeries,
  saveSemifinalists,
  saveTeams,
} from "../../../actions";
import { ActionForm, DeleteButton, inputCls, labelCls } from "../../../form";
import { MATCH_STATS, MAX_MATCH_STATS, type Game, type MatchStatKey, type Player, type Series } from "@/lib/types";

type Props = { params: Promise<{ year: string }> };

export default async function AdminEdition({ params }: Props) {
  const year = Number((await params).year);
  const data = await getLeagueData();
  const league = buildLeague(data);
  const e = league.edition(year);
  if (!e) notFound();

  const eligible = league.promos.filter((p) => levelOf(p, year) !== null);
  const registered = new Set(e.teams.map((p) => p.number));
  const semiOnly = new Set(data.semifinalists.filter((x) => x.edition_year === year).map((x) => x.promo));
  const promoOptions = eligible.map((p) => ({
    value: p.number,
    label: `${promoCode(p)} ${p.name ?? ""} (${levelOf(p, year)})`,
  }));
  const players = [...data.players].sort((a, b) => b.promo - a.promo || a.full_name.localeCompare(b.full_name));
  const standings = league.standings(e);
  // Les matchs à jouer d'abord.
  const poule = [...e.poule].sort((a, b) => Number(a.winner !== null) - Number(b.winner !== null) || a.id - b.id);
  const pouleDone = e.poule.length > 0 && e.poule.every((s) => s.winner !== null);
  const semisDone = e.semis.length === 2 && e.semis.every((s) => s.winner !== null);
  const pairs = (registered.size * (registered.size - 1)) / 2;

  return (
    <div className="space-y-8">
      {year >= ALLEBL_FIRST_YEAR && (
        <Link
          href={`/admin/editions/${year}/all-ebl`}
          className="block rounded-2xl border-2 border-gold bg-gold/10 p-4 font-semibold hover:bg-gold/20"
        >
          ⭐ All-Star EBL Team {e.label} : candidats, vote, liens des capitaines →
        </Link>
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase">Édition {e.label}</h1>
        <Link href={`/editions/${e.label}`} className="text-sm text-teal" target="_blank">
          Voir sur le site ↗
        </Link>
      </div>

      {e.final && (
        <Card title={e.final.winner ? "Finale (terminée)" : "Finale · match sec"}>
          <p className="mb-3 font-semibold">{matchTitle(e.final, league)}</p>
          <SeriesForm series={e.final} year={year} league={league} options={promoOptions} players={data.players} />
        </Card>
      )}

      {e.semis.length > 0 && (
        <Card title="Demi-finales · au meilleur des 3">
          <div className="space-y-4">
            {e.semis.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-4">
                <p className="mb-3 font-semibold">{matchTitle(s, league)}</p>
                <SeriesForm series={s} year={year} league={league} options={promoOptions} players={data.players} />
              </div>
            ))}
          </div>
          {semisDone && !e.final && (
            <div className="mt-4 border-t border-line pt-4">
              <ActionForm action={createFinal} submit="Créer la finale">
                <input type="hidden" name="edition_year" value={year} />
                <p className="text-sm text-ink-soft">
                  Finale en match sec :{" "}
                  <strong className="text-ink">{e.semis.map((s) => promoName(league.promo(s.winner!)!)).join(" vs ")}</strong>
                </p>
              </ActionForm>
            </div>
          )}
        </Card>
      )}

      <Card title="Équipes inscrites">
        <ActionForm action={saveTeams} submit="Enregistrer les équipes">
          <input type="hidden" name="edition_year" value={year} />
          <div className="grid gap-2 sm:grid-cols-2">
            {eligible.map((p) => (
              <label
                key={p.number}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal-soft"
              >
                <input type="checkbox" name="promo" value={p.number} defaultChecked={registered.has(p.number)} />
                <span className="font-medium">{promoCode(p)}</span> {p.name ?? ""}
                <span className="ml-auto text-xs text-ink-soft">{levelOf(p, year)}</span>
              </label>
            ))}
          </div>
        </ActionForm>
        {registered.size >= 2 && (
          <div className="mt-4 border-t border-line pt-4">
            <ActionForm action={generatePoule} submit="Générer les matchs de poule">
              <input type="hidden" name="edition_year" value={year} />
              <p className="text-sm text-ink-soft">
                Chaque équipe inscrite contre chacune des autres : {pairs} matchs au total. Seuls les matchs manquants
                sont créés.
              </p>
            </ActionForm>
          </div>
        )}
      </Card>

      {e.poule.length > 0 && (
        <Card title={`Poule · ${e.poule.filter((s) => s.winner !== null).length}/${e.poule.length} matchs joués`}>
          <StandingsTable edition={e} league={league} compact />
          <ul className="mt-4 space-y-2">
            {poule.map((s) => (
              <li key={s.id}>
                <details className="rounded-xl border border-line">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-medium">{matchTitle(s, league)}</span>
                    <span className={s.winner ? "font-display font-bold tabular-nums" : "text-right text-xs text-teal"}>
                      {s.winner
                        ? (seriesScore(s) ?? "joué")
                        : s.match_date
                          ? `${formatDay(s.match_date)}${s.match_time ? ` · ${formatTime(s.match_time)}` : ""} · saisir le score`
                          : "Saisir le score"}
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-line p-4">
                    <SeriesForm series={s} year={year} league={league} options={promoOptions} players={data.players} />
                    <DeleteButton action={deleteSeries} fields={{ id: s.id }} confirmText="Supprimer ce match ?" />
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {e.semis.length === 0 && standings.length >= 4 && (
            <div className="mt-4 border-t border-line pt-4">
              <ActionForm action={createSemis} submit="Créer les demi-finales">
                <input type="hidden" name="edition_year" value={year} />
                {standings.slice(0, 4).map((r, i) => (
                  <input key={r.promo.number} type="hidden" name={`seed_${i + 1}`} value={r.promo.number} />
                ))}
                <p className="text-sm text-ink-soft">
                  {pouleDone ? "" : "⚠️ Tous les matchs de poule ne sont pas encore joués. "}
                  Selon le classement actuel :{" "}
                  <strong className="text-ink">
                    {promoName(standings[0].promo)} vs {promoName(standings[3].promo)}
                  </strong>{" "}
                  et{" "}
                  <strong className="text-ink">
                    {promoName(standings[1].promo)} vs {promoName(standings[2].promo)}
                  </strong>
                  .
                </p>
              </ActionForm>
            </div>
          )}
        </Card>
      )}

      <Card title="Demi-finalistes (archives)">
        <p className="mb-3 text-sm text-ink-soft">
          Pour une édition passée dont on sait qui a perdu en demi-finale, sans connaître l&apos;adversaire ni le score.
          Inutile si les demies sont saisies comme matchs.
        </p>
        <ActionForm action={saveSemifinalists}>
          <input type="hidden" name="edition_year" value={year} />
          <div className="grid gap-2 sm:grid-cols-2">
            {eligible.map((p) => (
              <label
                key={p.number}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal-soft"
              >
                <input type="checkbox" name="semi" value={p.number} defaultChecked={semiOnly.has(p.number)} />
                <span className="font-medium">{promoCode(p)}</span> {p.name ?? ""}
              </label>
            ))}
          </div>
        </ActionForm>
      </Card>

      <details className="rounded-2xl border border-dashed border-line p-5">
        <summary className="cursor-pointer font-semibold text-teal">+ Ajouter un match à la main (archives, cas particulier)</summary>
        <div className="mt-4">
          <SeriesForm year={year} league={league} options={promoOptions} />
        </div>
      </details>

      <Card title="Distinctions">
        {e.awards.length > 0 && (
          <ul className="mb-4 divide-y divide-line">
            {e.awards.map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <details>
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span>
                      <strong>{AWARDS[a.type].label}</strong> : {a.player.full_name} (
                      {promoCode(a.promo)})
                    </span>
                    <span className="text-xs text-teal">Modifier</span>
                  </summary>
                  <div className="mt-3 space-y-3 rounded-lg bg-surface-2 p-3">
                    <ActionForm action={updateAward}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="edition_year" value={year} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={labelCls}>
                          <span>Distinction</span>
                          <select name="type" defaultValue={a.type} className={inputCls}>
                            <AwardOptions />
                          </select>
                        </label>
                        <label className={labelCls}>
                          <span>Joueur</span>
                          <select name="player_id" defaultValue={a.player_id} className={inputCls}>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>
                                IT{p.promo} · {p.full_name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <ScorerFields points={a.points} games={a.games} />
                    </ActionForm>
                    <DeleteButton action={deleteAward} fields={{ id: a.id }} label="Retirer cette distinction" confirmText="Retirer cette distinction ?" />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addAward} submit="Ajouter">
          <input type="hidden" name="edition_year" value={year} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              <span>Distinction</span>
              <select name="type" required defaultValue="" className={inputCls}>
                <option value="" disabled>
                  Choisir…
                </option>
                <AwardOptions />
              </select>
            </label>
            <label className={labelCls}>
              <span>Joueur</span>
              <select name="player_id" required className={inputCls} defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    IT{p.promo} · {p.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ScorerFields />
          <p className="text-xs text-ink-soft">
            Joueur absent de la liste ? Ajoute-le d&apos;abord dans{" "}
            <Link href="/admin/promos" className="text-teal">
              Promos et joueurs
            </Link>
            .
          </p>
        </ActionForm>
      </Card>

      <Card title="Infos de l'édition">
        <ActionForm action={saveEdition}>
          <input type="hidden" name="start_year" value={year} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              <span>Statut</span>
              <select name="status" defaultValue={e.status} className={inputCls}>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="a_completer">À compléter</option>
                <option value="annulee">Annulée</option>
              </select>
            </label>
            <label className={labelCls}>
              <span>Date de la finale</span>
              <input name="final_date" type="date" defaultValue={e.final_date ?? ""} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Heure de la finale</span>
              <input name="final_time" type="time" defaultValue={e.final_time?.slice(0, 5) ?? ""} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Lieu</span>
              <input name="venue" defaultValue={e.venue ?? ""} placeholder="Terrain de l'ESATIC" className={inputCls} />
            </label>
          </div>
          <label className={labelCls}>
            <span>Résumé de l&apos;édition (affiché sur sa page ; si elle est annulée, explique pourquoi)</span>
            <textarea name="summary" rows={4} defaultValue={e.summary ?? ""} className={inputCls} />
          </label>
        </ActionForm>
      </Card>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6">
        {e.final && (
          <DeleteButton
            action={deleteSeries}
            fields={{ id: e.final.id }}
            label="Supprimer la finale"
            confirmText="Supprimer la finale et son résultat ?"
          />
        )}
        {e.semis.map((s) => (
          <DeleteButton
            key={s.id}
            action={deleteSeries}
            fields={{ id: s.id }}
            label={`Supprimer la demie ${matchTitle(s, league)}`}
            confirmText="Supprimer cette demie et ses scores ?"
          />
        ))}
        <DeleteButton
          action={deleteEdition}
          fields={{ start_year: year }}
          label="Supprimer cette édition"
          confirmText={`Supprimer l'édition ${e.label}, ses matchs et ses distinctions ? C'est définitif.`}
        />
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-xl font-bold uppercase">{title}</h2>
      {children}
    </section>
  );
}

function matchTitle(s: SeriesView, league: League) {
  return `${promoName(league.promo(s.promo_a)!)} vs ${promoName(league.promo(s.promo_b)!)}`;
}

/**
 * Saisie d'un match : les scores des manches décident du vainqueur.
 * Sans série existante, on choisit aussi le tour et les équipes (archives).
 */
function SeriesForm({
  series,
  year,
  league,
  options,
  players = [],
}: {
  series?: SeriesView;
  year: number;
  league: League;
  options?: { value: number; label: string }[];
  players?: Player[];
}) {
  const bestOf = series?.best_of ?? 3;
  const nameA = series ? promoName(league.promo(series.promo_a)!) : "Équipe A";
  const nameB = series ? promoName(league.promo(series.promo_b)!) : "Équipe B";
  const game = (n: number) => series?.games.find((g) => g.game_no === n);
  const side = series?.winner == null ? "" : series.winner === series.promo_a ? "a" : "b";
  const hasScores = (series?.games.length ?? 0) > 0;
  const matchPlayers = series
    ? players
        .filter((p) => p.promo === series.promo_a || p.promo === series.promo_b)
        .sort((x, y) => (x.promo === y.promo ? x.full_name.localeCompare(y.full_name) : x.promo === series.promo_a ? -1 : 1))
    : [];

  return (
    <ActionForm action={saveSeries}>
      <input type="hidden" name="edition_year" value={year} />
      {series ? (
        <>
          <input type="hidden" name="id" value={series.id} />
          <input type="hidden" name="round" value={series.round} />
          <input type="hidden" name="best_of" value={series.best_of} />
          <details className="rounded-lg border border-line p-3 text-sm">
            <summary className="cursor-pointer text-ink-soft">Changer les équipes</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["promo_a", "promo_b"] as const).map((field, i) => (
                <label key={field} className={labelCls}>
                  <span>Équipe {i === 0 ? "A (scores de gauche)" : "B (scores de droite)"}</span>
                  <select name={field} defaultValue={series[field]} required className={inputCls}>
                    {options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </details>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            <span>Tour</span>
            <select name="round" defaultValue="poule" className={inputCls}>
              <option value="poule">Poule</option>
              <option value="demi">Demi-finale</option>
              <option value="finale">Finale</option>
            </select>
          </label>
          <label className={labelCls}>
            <span>Format</span>
            <select name="best_of" defaultValue={1} className={inputCls}>
              <option value={1}>Match sec</option>
              <option value={3}>Au meilleur des 3</option>
            </select>
          </label>
          {(["promo_a", "promo_b"] as const).map((field, i) => (
            <label key={field} className={labelCls}>
              <span>Équipe {i === 0 ? "A" : "B"}</span>
              <select name={field} defaultValue="" required className={inputCls}>
                <option value="" disabled>
                  Choisir…
                </option>
                {options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: bestOf }, (_, i) => i + 1).map((n) => (
          <div key={n} className="grid grid-cols-[4.5rem_1fr_1fr] items-end gap-2">
            <span className="pb-3 text-sm text-ink-soft">{series && bestOf === 1 ? "Score" : `Manche ${n}`}</span>
            <label className={labelCls}>
              <span className="block truncate text-xs">{nameA}</span>
              <input
                name={`score_a_${n}`}
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={game(n)?.score_a ?? ""}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              <span className="block truncate text-xs">{nameB}</span>
              <input
                name={`score_b_${n}`}
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={game(n)?.score_b ?? ""}
                className={inputCls}
              />
            </label>
          </div>
        ))}
        {!series && <p className="text-xs text-ink-soft">Pour un match sec, ne remplis que la manche 1.</p>}
        {!series && <p className="text-xs text-ink-soft">Le MVP et ses stats se saisissent une fois le match créé.</p>}
        {series &&
          Array.from({ length: bestOf }, (_, i) => i + 1).map((n) => (
            <div key={n} className="space-y-2">
              <ForfeitField n={n} single={bestOf === 1} game={game(n)} nameA={nameA} nameB={nameB} series={series} />
              <MvpFields n={n} single={bestOf === 1} game={game(n)} players={matchPlayers} league={league} />
            </div>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>
          <span>Date du match</span>
          <input name="match_date" type="date" defaultValue={series?.match_date ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Heure (facultative)</span>
          <input name="match_time" type="time" defaultValue={series?.match_time?.slice(0, 5) ?? ""} className={inputCls} />
        </label>
      </div>
      {series?.match_time && <input type="hidden" name="had_time" value="1" />}

      <details open={!hasScores && side !== ""} className="rounded-lg bg-surface-2 p-3 text-sm">
        <summary className="cursor-pointer text-ink-soft">Score inconnu ? Indiquer seulement le vainqueur</summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { v: "", l: "Pas encore joué" },
              { v: "a", l: nameA },
              { v: "b", l: nameB },
            ].map((o) => (
              <label
                key={o.v}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 has-[:checked]:border-teal"
              >
                <input type="radio" name="winner_side" value={o.v} defaultChecked={side === o.v} />
                {o.l}
              </label>
            ))}
          </div>
          {bestOf > 1 && (
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span>Manches gagnées A</span>
                <input name="wins_a" type="number" min={0} max={3} defaultValue={hasScores ? "" : (series?.wins_a ?? "")} className={inputCls} />
              </label>
              <label className={labelCls}>
                <span>Manches gagnées B</span>
                <input name="wins_b" type="number" min={0} max={3} defaultValue={hasScores ? "" : (series?.wins_b ?? "")} className={inputCls} />
              </label>
            </div>
          )}
          <p className="text-xs text-ink-soft">Ignoré si des scores sont saisis plus haut.</p>
        </div>
      </details>
    </ActionForm>
  );
}

/** MVP d'une manche et jusqu'à 3 stats au choix (ex. points, passes, rebonds). */
function MvpFields({
  n,
  single,
  game,
  players,
  league,
}: {
  n: number;
  single: boolean;
  game?: Game;
  players: Player[];
  league: League;
}) {
  const stats = game?.mvp_stats ?? [];
  const byPromo = new Map<number, Player[]>();
  for (const p of players) byPromo.set(p.promo, [...(byPromo.get(p.promo) ?? []), p]);
  return (
    <details open={Boolean(game?.mvp_player_id)} className="rounded-lg border border-line p-3 text-sm">
      <summary className="cursor-pointer text-ink-soft">MVP et stats{single ? "" : ` · manche ${n}`}</summary>
      <div className="mt-3 space-y-3">
        <label className={labelCls}>
          <span>MVP</span>
          <select name={`mvp_${n}`} defaultValue={game?.mvp_player_id ?? ""} className={inputCls}>
            <option value="">Pas de MVP</option>
            {[...byPromo].map(([promo, list]) => (
              <optgroup key={promo} label={promoName(league.promo(promo)!)}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {players.length === 0 && <p className="text-xs text-ink-soft">Aucun joueur dans l&apos;effectif de ces deux promos.</p>}
        <div className="space-y-2">
          {Array.from({ length: MAX_MATCH_STATS }, (_, i) => i + 1).map((k) => (
            <div key={k} className="grid grid-cols-[1fr_6rem] gap-2">
              <select name={`stat_${n}_${k}`} defaultValue={stats[k - 1]?.stat ?? ""} aria-label={`Stat ${k}`} className={inputCls}>
                <option value="">Stat {k} (facultative)</option>
                {(Object.keys(MATCH_STATS) as MatchStatKey[]).map((key) => (
                  <option key={key} value={key}>
                    {MATCH_STATS[key].label}
                  </option>
                ))}
              </select>
              <input
                name={`val_${n}_${k}`}
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={`Valeur de la stat ${k}`}
                defaultValue={stats[k - 1]?.value ?? ""}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft">3 stats au plus, au choix : par exemple points, passes et rebonds.</p>
      </div>
    </details>
  );
}

/** Liste des distinctions, rangée en Tournoi puis Concours. */
function AwardOptions() {
  return (
    <>
      <optgroup label="Tournoi">
        {AWARD_ORDER.filter((t) => AWARDS[t].category === "tournoi").map((t) => (
          <option key={t} value={t}>
            {AWARDS[t].label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Concours">
        {AWARD_ORDER.filter((t) => AWARDS[t].category === "concours").map((t) => (
          <option key={t} value={t}>
            {AWARDS[t].label}
          </option>
        ))}
      </optgroup>
    </>
  );
}

/** Total de points du meilleur scoreur (ignoré pour les autres distinctions). */
function ScorerFields({ points, games }: { points?: number | null; games?: number | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className={labelCls}>
        <span>Points (meilleur scoreur)</span>
        <input name="points" type="number" min={0} inputMode="numeric" defaultValue={points ?? ""} className={inputCls} />
      </label>
      <label className={labelCls}>
        <span>Matchs joués (facultatif)</span>
        <input name="games" type="number" min={1} inputMode="numeric" defaultValue={games ?? ""} className={inputCls} />
      </label>
    </div>
  );
}

/** Forfait d'une manche : l'équipe forfait perd 20-0 et ne prend aucun point ; scores et MVP saisis sont ignorés. */
function ForfeitField({
  n,
  single,
  game,
  nameA,
  nameB,
  series,
}: {
  n: number;
  single: boolean;
  game?: Game;
  nameA: string;
  nameB: string;
  series: Series;
}) {
  const current = game?.forfeit_promo == null ? "" : game.forfeit_promo === series.promo_a ? "a" : "b";
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span>Forfait{single ? "" : ` · manche ${n}`}</span>
      <select name={`forfeit_${n}`} defaultValue={current} className={`${inputCls} w-auto`}>
        <option value="">Aucun</option>
        <option value="a">{nameA} déclare forfait</option>
        <option value="b">{nameB} déclare forfait</option>
      </select>
      {current && <input type="hidden" name={`had_forfeit_${n}`} value="1" />}
    </label>
  );
}
