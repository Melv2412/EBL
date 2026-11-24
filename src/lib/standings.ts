/**
 * Classement de la poule EBL. Module pur (aucun import) pour être testé avec `npm test`.
 *
 * Ordre : nombre de victoires, puis différence de points, puis points marqués.
 * Pas de match direct. Un forfait compte comme une défaite 20-0.
 * Les points (victoire 2, défaite 1, forfait 0) sont affichés mais ne servent pas à classer.
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

/** Classement complet de la poule, du premier au dernier. */
export function rankPoule(teams: number[], matches: PouleMatch[]): PouleRow[] {
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
  return [...rows.values()].sort(
    (x, y) => y.wins - x.wins || y.diff - x.diff || y.pointsFor - x.pointsFor || x.team - y.team,
  );
}
