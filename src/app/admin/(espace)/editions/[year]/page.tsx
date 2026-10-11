import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildLeague, levelOf, promoCode, promoName, type League } from "@/lib/league";
import type { Series } from "@/lib/types";
import { addAward, deleteAward, deleteEdition, deleteSeries, saveEdition, saveSeries } from "../../../actions";
import { ActionForm, DeleteButton, inputCls, labelCls } from "../../../form";

type Props = { params: Promise<{ year: string }> };

const ROUND_LABEL = { finale: "Finale", demi: "Demi-finale", troisieme: "3e place" } as const;

export default async function AdminEdition({ params }: Props) {
  const year = Number((await params).year);
  const data = await getLeagueData();
  const league = buildLeague(data);
  const e = league.edition(year);
  if (!e) notFound();

  const series = data.series.filter((s) => s.edition_year === year);
  const promoOptions = league.promos
    .filter((p) => levelOf(p, year) !== null)
    .map((p) => ({ value: p.number, label: `${promoCode(p)} ${p.name ?? ""} (${levelOf(p, year)})` }));
  const players = [...data.players].sort((a, b) => b.promo - a.promo || a.full_name.localeCompare(b.full_name));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase">Édition {e.label}</h1>
        <Link href={`/editions/${e.label}`} className="text-sm text-teal" target="_blank">
          Voir sur le site ↗
        </Link>
      </div>

      <Card title="Matchs">
        <div className="space-y-4">
          {series
            .sort((a, b) => (a.round === "finale" ? -1 : b.round === "finale" ? 1 : a.id - b.id))
            .map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">
                    {ROUND_LABEL[s.round]} : {promoName(league.promo(s.promo_a)!)} vs {promoName(league.promo(s.promo_b)!)}
                  </p>
                  <DeleteButton
                    action={deleteSeries}
                    fields={{ id: s.id }}
                    confirmText="Supprimer ce match et son résultat ?"
                  />
                </div>
                <SeriesForm series={s} year={year} options={promoOptions} league={league} />
              </div>
            ))}
          <details className="rounded-xl border border-dashed border-line p-4">
            <summary className="cursor-pointer font-semibold text-teal">+ Ajouter un match</summary>
            <div className="mt-3">
              <SeriesForm year={year} options={promoOptions} league={league} />
            </div>
          </details>
        </div>
      </Card>

      <Card title="Distinctions">
        {e.awards.length > 0 && (
          <ul className="mb-4 divide-y divide-line">
            {e.awards.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <strong>{a.type === "mvp" ? "MVP" : "Mention honorable"}</strong> : {a.player.full_name} (
                  {promoCode(a.promo)})
                </span>
                <DeleteButton action={deleteAward} fields={{ id: a.id }} label="Retirer" confirmText="Retirer cette distinction ?" />
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

      <DeleteButton
        action={deleteEdition}
        fields={{ start_year: year }}
        label="Supprimer cette édition"
        confirmText={`Supprimer l'édition ${e.label}, ses matchs et ses distinctions ? C'est définitif.`}
      />
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

function SeriesForm({
  series,
  year,
  options,
  league,
}: {
  series?: Series;
  year: number;
  options: { value: number; label: string }[];
  league: League;
}) {
  const side = series?.winner == null ? "" : series.winner === series.promo_a ? "a" : "b";
  const nameA = series ? promoName(league.promo(series.promo_a)!) : "Équipe A";
  const nameB = series ? promoName(league.promo(series.promo_b)!) : "Équipe B";
  return (
    <ActionForm action={saveSeries}>
      {series && <input type="hidden" name="id" value={series.id} />}
      <input type="hidden" name="edition_year" value={year} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={labelCls}>
          <span>Tour</span>
          <select name="round" defaultValue={series?.round ?? "demi"} className={inputCls}>
            <option value="finale">Finale</option>
            <option value="demi">Demi-finale</option>
            <option value="troisieme">3e place</option>
          </select>
        </label>
        <label className={labelCls}>
          <span>Équipe A</span>
          <select name="promo_a" defaultValue={series?.promo_a ?? ""} required className={inputCls}>
            <option value="" disabled>
              Choisir…
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          <span>Équipe B</span>
          <select name="promo_b" defaultValue={series?.promo_b ?? ""} required className={inputCls}>
            <option value="" disabled>
              Choisir…
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Vainqueur</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "", l: "Pas encore joué" },
            { v: "a", l: nameA },
            { v: "b", l: nameB },
          ].map((o) => (
            <label
              key={o.v}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal-soft"
            >
              <input type="radio" name="winner_side" value={o.v} defaultChecked={side === o.v} />
              {o.l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-3">
        <label className={labelCls}>
          <span>Manches A</span>
          <input name="wins_a" type="number" min={0} max={3} inputMode="numeric" defaultValue={series?.wins_a ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Manches B</span>
          <input name="wins_b" type="number" min={0} max={3} inputMode="numeric" defaultValue={series?.wins_b ?? ""} className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Format</span>
          <select name="best_of" defaultValue={series?.best_of ?? 3} className={inputCls}>
            <option value={1}>Match sec</option>
            <option value={3}>Au meilleur des 3</option>
            <option value={5}>Au meilleur des 5</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-ink-soft">Laisse les manches vides si le score n&apos;est pas connu.</p>
    </ActionForm>
  );
}
