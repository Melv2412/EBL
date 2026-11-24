import Link from "next/link";
import {
  LOSS_POINTS,
  QUALIFIED,
  WIN_POINTS,
  formatTime,
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
import { MATCH_STATS, type Game } from "@/lib/types";

/** « MVP Koné Sidick (IT13) · 18 pts · 9 reb · 6 pass » pour une manche, si le MVP est connu. */
function MvpLine({ game, league, prefix, className = "" }: { game: Game; league: League; prefix?: string; className?: string }) {
  const player = game.mvp_player_id ? league.player(game.mvp_player_id) : null;
  if (!player) return null;
  const promo = league.promo(player.promo);
  const stats = (game.mvp_stats ?? []).filter((s) => s.stat in MATCH_STATS);
  return (
    <p className={`text-xs text-ink-soft ${className}`}>
      {prefix && <span className="mr-1">{prefix}</span>}
      <span className="font-semibold text-gold">MVP</span>{" "}
      <span className="font-semibold text-ink">{player.full_name}</span>
      {promo && <> ({promoCode(promo)})</>}
      {stats.map((s) => (
        <span key={s.stat}>
          {" · "}
          <span className="font-semibold tabular-nums text-ink">{s.value}</span> {MATCH_STATS[s.stat].short}
        </span>
      ))}
    </p>
  );
}

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
                P/C
              </th>
            )}
            <th className="px-2 py-3 text-center font-semibold" title="Différence de points">
              +/-
            </th>
            <th className="py-3 pl-2 pr-4 text-right font-semibold" title={`Points au classement : ${WIN_POINTS} par victoire, ${LOSS_POINTS} par défaite, 0 par forfait`}>
              Pts
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
              <td className="px-2 py-2.5 text-center tabular-nums">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="py-2.5 pl-2 pr-4 text-right font-display text-base font-bold tabular-nums">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > QUALIFIED && (
        <p className="border-t border-line px-4 py-2 text-xs text-ink-soft">
          Classement au nombre de victoires, puis à la différence de points, puis aux points marqués. Pts : victoire{" "}
          {WIN_POINTS}, défaite {LOSS_POINTS}, forfait 0 (perdu 20-0). Les {QUALIFIED} premiers vont en demi-finales
          (1er contre 4e, 2e contre 3e).
        </p>
      )}
    </div>
  );
}

/** Matchs de poule à jouer : date et heure, puis les deux équipes. */
export function UpcomingList({ edition, league }: { edition: EditionView; league: League }) {
  const list = league.upcoming(edition);
  if (list.length === 0) return null;
  const dated = list.filter((s) => s.match_date);
  const undated = list.length - dated.length;
  return (
    <div>
      {dated.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {dated.map((s) => {
            const a = league.promo(s.promo_a)!;
            const b = league.promo(s.promo_b)!;
            return (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-20 shrink-0 text-xs">
                  <span className="block font-semibold capitalize text-teal">{formatDay(s.match_date)}</span>
                  {s.match_time && <span className="text-ink-soft">{formatTime(s.match_time)}</span>}
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right font-semibold">
                  <span className="ebl-name line-clamp-2">{promoName(a)}</span>
                  <PromoBadge promo={a} size={26} className="rounded-md" />
                </span>
                <span className="w-10 shrink-0 text-center text-xs font-semibold uppercase text-ink-soft">vs</span>
                <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
                  <PromoBadge promo={b} size={26} className="rounded-md" />
                  <span className="ebl-name line-clamp-2">{promoName(b)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {undated > 0 && (
        <p className="mt-3 text-sm text-ink-soft">
          {dated.length > 0 ? "Et " : ""}
          {undated} match{undated > 1 ? "s" : ""} de poule {undated > 1 ? "restent" : "reste"} à programmer.
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
          <li key={s.id} className="px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-ink-soft">
              {formatDay(s.match_date) ?? ROUND_LABEL[s.round]}
              {s.match_date && s.round !== "poule" && <span className="block">{ROUND_LABEL[s.round]}</span>}
            </span>
            <span className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${s.winner === a.number ? "font-semibold" : "text-ink-soft"}`}>
              <span className="ebl-name line-clamp-2">{promoName(a)}</span>
              <PromoBadge promo={a} size={26} className="rounded-md" />
            </span>
            <span className="w-16 shrink-0 text-center font-display text-base font-bold tabular-nums">{score ?? "–"}</span>
            <span className={`flex min-w-0 flex-1 items-center gap-2 ${s.winner === b.number ? "font-semibold" : "text-ink-soft"}`}>
              <PromoBadge promo={b} size={26} className="rounded-md" />
              <span className="ebl-name line-clamp-2">{promoName(b)}</span>
            </span>
            </div>
            {s.games.map((g) => {
              const prefix = s.best_of > 1 ? `Manche ${g.game_no} ·` : undefined;
              const forfeit = g.forfeit_promo ? league.promo(g.forfeit_promo) : null;
              return (
                <div key={g.id}>
                  {forfeit ? (
                    <p className="mt-1.5 text-center text-xs text-ink-soft">
                      {prefix && <span className="mr-1">{prefix}</span>}
                      Forfait de {promoName(forfeit)} (20-0)
                    </p>
                  ) : (
                    <MvpLine game={g} league={league} prefix={prefix} className="mt-1.5 text-center" />
                  )}
                </div>
              );
            })}
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
  // Le vainqueur est toujours affiché à gauche.
  const flip = decided && series.winner === series.promo_b;
  const [left, right] = flip ? [series.promo_b, series.promo_a] : [series.promo_a, series.promo_b];
  const side = (n: number) => {
    const p = league.promo(n)!;
    const won = series.winner === p.number;
    return (
      <Link
        href={`/promos/${promoSlug(p)}`}
        className={`flex flex-col items-center gap-2 text-center ${decided && !won ? "opacity-55" : ""}`}
      >
        <PromoBadge promo={p} size={big ? 112 : 64} />
        <span className={`ebl-name font-display font-bold uppercase leading-tight ${big ? "text-[clamp(0.85rem,4.2vw,1.25rem)] sm:text-2xl" : "text-[clamp(0.8rem,3.8vw,1.125rem)] sm:text-lg"}`}>
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
        {side(left)}
        <div className="text-center">
          <p className={`font-display font-bold ${big ? "text-4xl" : "text-2xl"}`}>{seriesScore(series, left) ?? "VS"}</p>
          <p className="text-xs text-ink-soft">
            {series.best_of > 1 ? `au meilleur des ${series.best_of}` : "match sec"}
          </p>
          {series.best_of > 1 && games.length > 0 && (
            <p className="mt-1 text-xs tabular-nums text-ink-soft">
              {games.map((g) => (flip ? `${g.score_b}-${g.score_a}` : `${g.score_a}-${g.score_b}`)).join(" · ")}
            </p>
          )}
          {!decided && series.match_date && <p className="mt-1 text-xs font-semibold text-teal">{formatDay(series.match_date)}</p>}
        </div>
        {side(right)}
      </div>
      {games.some((g) => g.mvp_player_id) && (
        <div className="mt-4 space-y-1 border-t border-line pt-3 text-center">
          {games.map((g) => (
            <MvpLine key={g.id} game={g} league={league} prefix={series.best_of > 1 ? `Manche ${g.game_no} ·` : undefined} />
          ))}
        </div>
      )}
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
