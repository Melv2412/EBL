/**
 * Classement de la poule EBL. Module pur (aucun import) pour être testé avec `npm test`.
 *
 * Points : victoire 2, défaite 1, défaite par forfait 0. Un forfait compte 20-0.
 * À égalité de points :
 *  1. mini-classement entre les seules équipes à égalité, sur leurs matchs entre elles
 *     (points, puis différence, puis points marqués), uniquement si elles se sont toutes
 *     déjà affrontées. S'il ne sépare qu'une partie des équipes, on recommence l'étape 1
 *     avec celles qui restent à égalité ;
 *  2. différence de points générale ;
 *  3. points marqués au total.
 */

export const WIN_POINTS = 2;
export const LOSS_POINTS = 1;
export const FORFEIT_POINTS = 0;

/** Un match de poule décidé ou non. Scores null : résultat connu sans le score (archives). */
export type PouleMatch = {
  a: number;
  b: number;
  winner: number | null;
  scoreA: number | null;
  scoreB: number | null;
  /** Équipe qui a déclaré forfait, le cas échéant. */
  forfeit: number | null;
};

export type PouleRow = {
  team: number;
  played: number;
  wins: number;
  losses: number;
  forfeits: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
};

type Tally = { points: number; pointsFor: number; diff: number };

function tally(teams: number[], matches: PouleMatch[]) {
  const rows = new Map<number, PouleRow>(
    teams.map((t) => [t, { team: t, played: 0, wins: 0, losses: 0, forfeits: 0, points: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 }]),
  );
  for (const m of matches) {
    if (m.winner === null) continue;
    const a = rows.get(m.a);
    const b = rows.get(m.b);
    if (!a || !b) continue;
    const [win, loss] = m.winner === m.a ? [a, b] : [b, a];
    a.played++;
    b.played++;
    win.wins++;
    win.points += WIN_POINTS;
    loss.losses++;
    if (m.forfeit === loss.team) {
      loss.forfeits++;
      loss.points += FORFEIT_POINTS;
    } else loss.points += LOSS_POINTS;
    if (m.scoreA !== null && m.scoreB !== null) {
      a.pointsFor += m.scoreA;
      a.pointsAgainst += m.scoreB;
      b.pointsFor += m.scoreB;
      b.pointsAgainst += m.scoreA;
    }
  }
  for (const r of rows.values()) r.diff = r.pointsFor - r.pointsAgainst;
  return rows;
}

const byTally = (x: Tally, y: Tally) => y.points - x.points || y.diff - x.diff || y.pointsFor - x.pointsFor;

/** Regroupe une liste déjà triée en paquets d'éléments égaux pour `same`. */
function groups<T>(list: T[], same: (x: T, y: T) => boolean) {
  const out: T[][] = [];
  for (const item of list) {
    const last = out.at(-1);
    if (last && same(last[0], item)) last.push(item);
    else out.push([item]);
  }
  return out;
}

/** Toutes les équipes du groupe se sont-elles déjà affrontées (match décidé) ? */
function allMet(group: number[], matches: PouleMatch[]) {
  const met = new Set(
    matches.filter((m) => m.winner !== null).map((m) => (m.a < m.b ? `${m.a}-${m.b}` : `${m.b}-${m.a}`)),
  );
  for (let i = 0; i < group.length; i++)
    for (let j = i + 1; j < group.length; j++) {
      const [x, y] = group[i] < group[j] ? [group[i], group[j]] : [group[j], group[i]];
      if (!met.has(`${x}-${y}`)) return false;
    }
  return true;
}

/** Ordonne des équipes à égalité de points (voir l'en-tête du fichier). */
function breakTie(group: number[], matches: PouleMatch[], general: Map<number, PouleRow>): number[] {
  if (group.length < 2) return group;
  if (allMet(group, matches)) {
    const inside = new Set(group);
    const mini = tally(
      group,
      matches.filter((m) => inside.has(m.a) && inside.has(m.b)),
    );
    const sorted = [...group].sort((x, y) => byTally(mini.get(x)!, mini.get(y)!));
    const parts = groups(sorted, (x, y) => byTally(mini.get(x)!, mini.get(y)!) === 0);
    // Le mini-classement sépare au moins une équipe : on recommence avec chaque paquet encore à égalité.
    if (parts.length > 1) return parts.flatMap((p) => breakTie(p, matches, general));
  }
  // Sinon : différence générale, puis points marqués, puis numéro de promo (ordre stable).
  return [...group].sort((x, y) => {
    const gx = general.get(x)!;
    const gy = general.get(y)!;
    return gy.diff - gx.diff || gy.pointsFor - gx.pointsFor || x - y;
  });
}

/** Classement complet de la poule, du premier au dernier. */
export function rankPoule(teams: number[], matches: PouleMatch[]): PouleRow[] {
  const general = tally(teams, matches);
  const byPoints = [...general.values()].sort((x, y) => y.points - x.points || x.team - y.team);
  return groups(byPoints, (x, y) => x.points === y.points)
    .flatMap((g) => breakTie(g.map((r) => r.team), matches, general))
    .map((t) => general.get(t)!);
}
