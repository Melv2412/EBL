import Link from "next/link";
import {
  QUALIFIED,
  levelOf,
  promoCode,
  promoName,
  promoSlug,
  seriesScore,
  type EditionView,
  type League,
  type SeriesView,
} from "@/lib/league";
import { PromoBadge } from "./promo-badge";
import { LevelTag } from "./ui";

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function formatDay(date: string | null) {
  return date ? dayFmt.format(new Date(`${date}T00:00:00Z`)) : null;
}

const ROUND_LABEL = { poule: "Poule", demi: "Demi-finale", finale: "Finale", troisieme: "3e place" } as const;

/** Classement de la poule, avec la ligne des qualifiés. */
export function StandingsTable({ edition, league, compact }: { edition: EditionView; league: League; compact?: boolean }) {
  const rows = league.standings(edition);
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[22rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
            <th className="w-10 py-3 pl-4 font-semibold">#</th>
            <th className="py-3 font-semibold">Équipe</th>
            <th className="px-2 py-3 text-center font-semibold" title="Matchs joués">
              J
            </th>
            <th className="px-2 py-3 text-center font-semibold" title="Victoires">
              V
            </th>
            <th className="px-2 py-3 text-center font-semibold" title="Défaites">
              D
            </th>
            {!compact && (
              <th className="hidden px-2 py-3 text-center font-semibold sm:table-cell" title="Points marqués / encaissés">
                Pts
              </th>
            )}
            <th className="py-3 pl-2 pr-4 text-right font-semibold" title="Différence de points">
              +/-
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.promo.number}
              className={`border-b border-line last:border-0 ${r.rank === QUALIFIED && rows.length > QUALIFIED ? "border-b-2 border-b-teal" : ""}`}
            >
              <td className={`py-2.5 pl-4 font-display text-base font-bold ${r.rank <= QUALIFIED ? "text-teal" : "text-ink-soft"}`}>
                {r.rank}
              </td>
              <td className="py-2.5">
                <Link href={`/promos/${promoSlug(r.promo)}`} className="flex items-center gap-2.5 hover:text-teal">
                  <PromoBadge promo={r.promo} size={30} className="rounded-md" />
                  <span className="font-semibold">{promoName(r.promo)}</span>
                  <span className="hidden text-xs text-ink-soft sm:inline">
                    {promoCode(r.promo)} <LevelTag level={levelOf(r.promo, edition.start_year)} />
                  </span>
                </Link>
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">{r.played}</td>
              <td className="px-2 py-2.5 text-center font-semibold tabular-nums">{r.wins}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{r.losses}</td>
              {!compact && (
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-ink-soft sm:table-cell">
                  {r.pointsFor}/{r.pointsAgainst}
                </td>
              )}
              <td className="py-2.5 pl-2 pr-4 text-right font-semibold tabular-nums">
                {r.diff > 0 ? `+${r.diff}` : r.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > QUALIFIED && (
        <p className="border-t border-line px-4 py-2 text-xs text-ink-soft">
          Les {QUALIFIED} premiers vont en demi-finales (1er contre 4e, 2e contre 3e).
        </p>
      )}
    </div>
  );
}

/** Liste des matchs joués, du plus récent au plus ancien. */
export function ResultsList({ edition, league, limit }: { edition: EditionView; league: League; limit?: number }) {
  const all = league.results(edition);
  const list = limit ? all.slice(0, limit) : all;
  if (list.length === 0) return <p className="text-sm text-ink-soft">Aucun match joué pour l&apos;instant.</p>;
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {list.map((s) => {
        const a = league.promo(s.promo_a)!;
        const b = league.promo(s.promo_b)!;
        const score = seriesScore(s);
        return (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="w-20 shrink-0 text-xs text-ink-soft">
              {formatDay(s.match_date) ?? ROUND_LABEL[s.round]}
              {s.match_date && s.round !== "poule" && <span className="block">{ROUND_LABEL[s.round]}</span>}
            </span>
            <span className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${s.winner === a.number ? "font-semibold" : "text-ink-soft"}`}>
              <span className="truncate">{promoName(a)}</span>
              <PromoBadge promo={a} size={26} className="rounded-md" />
            </span>
            <span className="w-16 shrink-0 text-center font-display text-base font-bold tabular-nums">{score ?? "–"}</span>
            <span className={`flex min-w-0 flex-1 items-center gap-2 ${s.winner === b.number ? "font-semibold" : "text-ink-soft"}`}>
              <PromoBadge promo={b} size={26} className="rounded-md" />
              <span className="truncate">{promoName(b)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Carte d'une confrontation (demie, finale). */
export function SeriesCard({ series, league, year, big }: { series: SeriesView; league: League; year: number; big?: boolean }) {
  const decided = series.winner !== null;
  const games = series.games.filter((g) => g.score_a !== null && g.score_b !== null);
  const side = (n: number) => {
    const p = league.promo(n)!;
    const won = series.winner === p.number;
    return (
      <Link
        href={`/promos/${promoSlug(p)}`}
        className={`flex flex-col items-center gap-2 text-center ${decided && !won ? "opacity-55" : ""}`}
      >
        <PromoBadge promo={p} size={big ? 112 : 64} />
        <span className={`font-display font-bold uppercase leading-tight [overflow-wrap:anywhere] ${big ? "text-xl sm:text-2xl" : "text-lg"}`}>
          {promoName(p)}
        </span>
        <span className="text-xs text-ink-soft">
          {promoCode(p)} <LevelTag level={levelOf(p, year)} />
        </span>
        {won && <span className="text-xs font-semibold text-gold">Vainqueur</span>}
      </Link>
    );
  };
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        {side(series.promo_a)}
        <div className="text-center">
          <p className={`font-display font-bold ${big ? "text-4xl" : "text-2xl"}`}>{seriesScore(series) ?? "VS"}</p>
          <p className="text-xs text-ink-soft">
            {series.best_of > 1 ? `au meilleur des ${series.best_of}` : "match sec"}
          </p>
          {series.best_of > 1 && games.length > 0 && (
            <p className="mt-1 text-xs tabular-nums text-ink-soft">
              {games.map((g) => `${g.score_a}-${g.score_b}`).join(" · ")}
            </p>
          )}
          {!decided && series.match_date && <p className="mt-1 text-xs font-semibold text-teal">{formatDay(series.match_date)}</p>}
        </div>
        {side(series.promo_b)}
      </div>
    </div>
  );
}

/** Affiches de demies proposées tant qu'elles ne sont pas créées. */
export function ProposedSemis({ edition, league }: { edition: EditionView; league: League }) {
  const pairs = league.proposedSemis(edition);
  if (pairs.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {pairs.map(([a, b], i) => (
        <div key={i} className="rounded-2xl border border-dashed border-line p-4 text-center text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {i === 0 ? "1er contre 4e" : "2e contre 3e"} · si le classement reste ainsi
          </p>
          <p className="mt-2 font-display text-lg font-bold uppercase">
            {promoName(a)} <span className="text-ink-soft">vs</span> {promoName(b)}
          </p>
        </div>
      ))}
    </div>
  );
}
