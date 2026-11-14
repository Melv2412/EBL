import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { buildLeague } from "@/lib/league";
import { supabaseServer } from "@/lib/supabase-server";
import { restoreEntries } from "../../actions";
import { DeleteButton, inputCls } from "../../form";
import { CATEGORIES, categoryOf, describer, type AuditEntry, type Category } from "./describe";

const TZ = "Africa/Abidjan";
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const dayKey = new Intl.DateTimeFormat("fr-CA", { timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

const LIMIT = 500;

type Props = { searchParams: Promise<{ cat?: string; admin?: string; q?: string }> };

/** Retire accents et majuscules pour une recherche tolérante. */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default async function HistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const cat = params.cat && params.cat in CATEGORIES ? (params.cat as Category) : null;
  const adminFilter = params.admin?.trim() || null;
  const q = params.q?.trim() || "";

  const db = await supabaseServer();
  let query = db.from("audit_log").select("*").order("id", { ascending: false }).limit(LIMIT);
  if (cat) query = query.in("table_name", [...CATEGORIES[cat].tables]);
  if (adminFilter) query = query.eq("actor_name", adminFilter);
  const [{ data: rows, error }, { data: actorRows }] = await Promise.all([
    query,
    db.from("audit_log").select("actor_name").not("actor_name", "is", null).order("id", { ascending: false }).limit(1000),
  ]);

  if (error) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h1 className="mb-2 font-display text-2xl font-bold uppercase">Historique</h1>
        <p className="text-sm text-ink-soft">
          Le journal des modifications n&apos;est pas encore activé dans la base (migration{" "}
          <code>supabase/migrations/0006_audit_log.sql</code>).
        </p>
      </section>
    );
  }

  const actors = [...new Set((actorRows ?? []).map((r) => r.actor_name as string))].sort();
  const data = await getLeagueData();
  const describe = describer(buildLeague(data), data);

  // Une action de l'admin = une transaction : on regroupe ses lignes.
  let groups: AuditEntry[][] = [];
  for (const r of (rows ?? []) as AuditEntry[]) {
    const last = groups.at(-1);
    if (last && last[0].tx === r.tx) last.push(r);
    else groups.push([r]);
  }
  if (q) {
    const needle = fold(q);
    groups = groups.filter((g) =>
      g.some((e) => {
        const d = describe(e);
        return fold([d.sentence, ...d.changes.flatMap((c) => [c.before, c.after])].join(" ")).includes(needle);
      }),
    );
  }

  // Puis par jour, pour s'y retrouver d'un coup d'œil.
  const days: { key: string; label: string; groups: AuditEntry[][] }[] = [];
  for (const g of groups) {
    const date = new Date(g[0].at);
    const key = dayKey.format(date);
    const last = days.at(-1);
    if (last?.key === key) last.groups.push(g);
    else days.push({ key, label: dayFmt.format(date), groups: [g] });
  }

  const href = (next: { cat?: string | null; admin?: string | null }) => {
    const sp = new URLSearchParams();
    const c = next.cat === undefined ? cat : next.cat;
    const a = next.admin === undefined ? adminFilter : next.admin;
    if (c) sp.set("cat", c);
    if (a) sp.set("admin", a);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/admin/historique${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "border-teal bg-teal text-white" : "border-line bg-surface text-ink-soft hover:border-teal hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">Historique</h1>
        <p className="text-sm text-ink-soft">
          « Annuler » remet l&apos;ancienne valeur (ou recrée ce qui a été supprimé) ; l&apos;annulation apparaît elle-même dans
          l&apos;historique.
        </p>
      </div>

      <nav aria-label="Catégories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Link href={href({ cat: null })} className={chip(!cat)} aria-current={!cat ? "page" : undefined}>
          Tout
        </Link>
        {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([key, c]) => (
          <Link key={key} href={href({ cat: key })} className={chip(cat === key)} aria-current={cat === key ? "page" : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap gap-2" action="/admin/historique">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Chercher un joueur, une promo, une saison…"
          className={`${inputCls} min-w-0 flex-1`}
        />
        {actors.length > 1 && (
          <select name="admin" defaultValue={adminFilter ?? ""} className={`${inputCls} w-auto`} aria-label="Admin">
            <option value="">Tous les admins</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
        <button className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-strong">Filtrer</button>
        {(q || adminFilter || cat) && (
          <Link href="/admin/historique" className="self-center text-sm text-ink-soft underline hover:text-ink">
            Tout effacer
          </Link>
        )}
      </form>

      {days.length === 0 && <p className="text-sm text-ink-soft">Aucune modification ne correspond.</p>}

      {days.map((day) => (
        <section key={day.key} className="space-y-3">
          <h2 className="sticky top-[61px] z-10 -mx-4 bg-bg/95 px-4 py-2 font-display text-sm font-bold uppercase tracking-widest text-ink-soft backdrop-blur">
            {day.label} <span className="font-sans font-normal normal-case tracking-normal">· {day.groups.length}</span>
          </h2>
          <ol className="space-y-3">
            {day.groups.map((g) => {
              const head = g[0];
              const open = g.filter((e) => !e.restored_at);
              const cats = [...new Set(g.map((e) => categoryOf(e.table_name)).filter((c): c is Category => c !== null))];
              return (
                <li key={head.tx} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <strong>{head.actor_name ?? "Système"}</strong>
                      <span className="text-ink-soft">{timeFmt.format(new Date(head.at))}</span>
                      {cats.map((c) => (
                        <Link
                          key={c}
                          href={href({ cat: c })}
                          className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal hover:bg-teal/20"
                        >
                          {CATEGORIES[c].label}
                        </Link>
                      ))}
                    </p>
                    {open.length > 0 && (
                      <DeleteButton
                        action={restoreEntries}
                        fields={{ ids: open.map((e) => e.id).join(",") }}
                        label={g.length > 1 ? "Annuler toute l'action" : "Annuler"}
                        confirmText="Annuler cette modification et revenir à l'état précédent ?"
                      />
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {g
                      .filter(
                        (e, _, all) => !(e.table_name === "games" && all.some((x) => x.table_name === "series" && x.action === "delete")),
                      )
                      .map((e) => {
                        const d = describe(e);
                        return (
                          <li key={e.id} className={e.restored_at ? "opacity-50" : ""}>
                            <p>
                              {d.sentence}
                              {e.restored_at && <span className="ml-2 text-xs font-semibold text-teal">annulé</span>}
                            </p>
                            {d.changes.length > 0 && (
                              <ul className="mt-1 space-y-0.5 border-l-2 border-line pl-3 text-xs text-ink-soft">
                                {d.changes.map((c) => (
                                  <li key={c.label}>
                                    {c.label} : <span className="line-through">{c.before}</span> →{" "}
                                    <span className="font-semibold text-ink">{c.after}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {(rows?.length ?? 0) === LIMIT && (
        <p className="text-center text-xs text-ink-soft">
          Seules les {LIMIT} dernières modifications sont parcourues : choisis une catégorie pour remonter plus loin.
        </p>
      )}
    </div>
  );
}
