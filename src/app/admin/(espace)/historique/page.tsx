import { getLeagueData } from "@/lib/data";
import { buildLeague } from "@/lib/league";
import { supabaseServer } from "@/lib/supabase-server";
import { restoreEntries } from "../../actions";
import { DeleteButton } from "../../form";
import { describer, type AuditEntry } from "./describe";

const when = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});

export default async function HistoryPage() {
  const db = await supabaseServer();
  const { data: rows, error } = await db.from("audit_log").select("*").order("id", { ascending: false }).limit(300);

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

  const data = await getLeagueData();
  const describe = describer(buildLeague(data), data);

  // Une action de l'admin = une transaction : on regroupe ses lignes.
  const groups: AuditEntry[][] = [];
  for (const r of (rows ?? []) as AuditEntry[]) {
    const last = groups.at(-1);
    if (last && last[0].tx === r.tx) last.push(r);
    else groups.push([r]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">Historique</h1>
        <p className="text-sm text-ink-soft">
          Les 300 dernières modifications. « Annuler » remet l&apos;ancienne valeur (ou recrée ce qui a été supprimé) ; l&apos;annulation
          apparaît elle-même dans l&apos;historique.
        </p>
      </div>

      {groups.length === 0 && <p className="text-sm text-ink-soft">Aucune modification enregistrée pour l&apos;instant.</p>}

      <ol className="space-y-3">
        {groups.map((g) => {
          const head = g[0];
          const open = g.filter((e) => !e.restored_at);
          return (
            <li key={head.tx} className="rounded-2xl border border-line bg-surface p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <strong>{head.actor_name ?? "Système"}</strong>{" "}
                  <span className="text-ink-soft">· {when.format(new Date(head.at))}</span>
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
                  .filter((e, i, all) => !(e.table_name === "games" && all.some((x) => x.table_name === "series" && x.action === "delete")))
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
    </div>
  );
}
