import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { buildLeague, currentSeasonYear, promoName } from "@/lib/league";
import { saveEdition } from "../actions";
import { ActionForm, inputCls, labelCls } from "../form";

const STATUS_LABEL = { a_completer: "À compléter", en_cours: "En cours", terminee: "Terminée" } as const;

export default async function AdminHome() {
  const league = buildLeague(await getLeagueData());
  const pending = league.editions.find((e) => e.final && e.final.winner === null);
  const nextYear = Math.max(currentSeasonYear(), ...league.editions.map((e) => e.start_year + 1));

  return (
    <div className="space-y-8">
      {pending && (
        <Link
          href={`/admin/editions/${pending.start_year}`}
          className="block rounded-2xl bg-night p-5 text-white hover:ring-2 hover:ring-teal"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Finale {pending.label}</p>
          <p className="mt-1 font-display text-2xl font-bold uppercase">
            {promoName(league.promo(pending.final!.promo_a)!)} vs {promoName(league.promo(pending.final!.promo_b)!)}
          </p>
          <p className="mt-2 text-sm text-white/70">Saisir le résultat →</p>
        </Link>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold uppercase">Éditions</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {league.editions.map((e) => (
            <li key={e.start_year}>
              <Link href={`/admin/editions/${e.start_year}`} className="flex items-center justify-between p-4 hover:bg-surface-2">
                <span className="font-display text-lg font-bold">{e.label}</span>
                <span className="text-sm text-ink-soft">
                  {e.champion ? `🏆 ${promoName(e.champion)} · ` : ""}
                  {STATUS_LABEL[e.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Nouvelle édition</h2>
        <ActionForm action={saveEdition} submit="Créer">
          <input type="hidden" name="mode" value="create" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              <span>Année de début (ex : {nextYear} pour {nextYear}-{String(nextYear + 1).slice(2)})</span>
              <input name="start_year" type="number" defaultValue={nextYear} required className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Statut</span>
              <select name="status" defaultValue="en_cours" className={inputCls}>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="a_completer">À compléter</option>
              </select>
            </label>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
