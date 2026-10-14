import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildLeague, levelOf, promoCode, promoName, seriesScore, type League, type SeriesView } from "@/lib/league";
import { StandingsTable } from "@/components/season";
import { ALLEBL_FIRST_YEAR } from "@/lib/allebl";
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
          ⭐ All-EBL Team {e.label} : candidats, vote, liens des capitaines →
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
          <SeriesForm series={e.final} year={year} league={league} options={promoOptions} />
        </Card>
      )}

      {e.semis.length > 0 && (
        <Card title="Demi-finales · au meilleur des 3">
          <div className="space-y-4">
            {e.semis.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-4">
                <p className="mb-3 font-semibold">{matchTitle(s, league)}</p>
                <SeriesForm series={s} year={year} league={league} options={promoOptions} />
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
                    <span className={s.winner ? "font-display font-bold tabular-nums" : "text-xs text-teal"}>
                      {s.winner ? (seriesScore(s) ?? "joué") : "Saisir le score"}
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-line p-4">
                    <SeriesForm series={s} year={year} league={league} options={promoOptions} />
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
                      <strong>{a.type === "mvp" ? "MVP" : "Mention honorable"}</strong> : {a.player.full_name} (
                      {promoCode(a.promo)})
                    </span>
                    <span className="text-xs text-teal">Modifier</span>
                  </summary>
                  <div className="mt-3 space-y-3 rounded-lg bg-surface-2 p-3">
                    <ActionForm action={updateAward}>
                      <input type="hidden" name="id" value={a.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={labelCls}>
                          <span>Distinction</span>
                          <select name="type" defaultValue={a.type} className={inputCls}>
                            <option value="mvp">MVP du tournoi</option>
                            <option value="mention_honorable">Mention honorable</option>
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
              <select name="type" className={inputCls}>
                <option value="mvp">MVP du tournoi</option>
                <option value="mention_honorable">Mention honorable</option>
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
            <span>Résumé de l&apos;édition (affiché sur la page de l&apos;édition)</span>
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
}: {
  series?: SeriesView;
  year: number;
  league: League;
  options?: { value: number; label: string }[];
}) {
  const bestOf = series?.best_of ?? 3;
  const nameA = series ? promoName(league.promo(series.promo_a)!) : "Équipe A";
  const nameB = series ? promoName(league.promo(series.promo_b)!) : "Équipe B";
  const game = (n: number) => series?.games.find((g) => g.game_no === n);
  const side = series?.winner == null ? "" : series.winner === series.promo_a ? "a" : "b";
  const hasScores = (series?.games.length ?? 0) > 0;

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
      </div>

      <label className={labelCls}>
        <span>Date du match</span>
        <input name="match_date" type="date" defaultValue={series?.match_date ?? ""} className={inputCls} />
      </label>

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
