import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { buildLeague, promoCode } from "@/lib/league";
import { PromoBadge } from "@/components/promo-badge";
import { savePromo } from "../../actions";
import { ActionForm, inputCls, labelCls } from "../../form";

export default async function AdminPromos() {
  const data = await getLeagueData();
  const league = buildLeague(data);
  const next = Math.max(...data.promos.map((p) => p.number)) + 1;
  const lastEntry = Math.max(...data.promos.map((p) => p.entry_year)) + 1;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 font-display text-3xl font-bold uppercase">Promos et joueurs</h1>
        <ul className="grid gap-3 sm:grid-cols-2">
          {league.promos.map((p) => (
            <li key={p.number}>
              <Link
                href={`/admin/promos/${p.number}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-teal"
              >
                <PromoBadge promo={p} size={48} />
                <span>
                  <span className="block font-semibold">
                    {promoCode(p)} · {p.name ?? "Sans nom"}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {data.players.filter((pl) => pl.promo === p.number).length} joueur(s)
                    {p.logo_url ? "" : " · pas de logo"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Nouvelle promo</h2>
        <ActionForm action={savePromo} submit="Créer">
          <input type="hidden" name="mode" value="create" />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelCls}>
              <span>Numéro (IT…)</span>
              <input name="number" type="number" defaultValue={next} required className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Année d&apos;entrée en L1</span>
              <input name="entry_year" type="number" defaultValue={lastEntry} required className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Nom</span>
              <input name="name" placeholder="Optionnel" className={inputCls} />
            </label>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
