/**
 * Classement de la poule EBL. Module pur (aucun import) pour être testé avec `npm test`.
 *
 * Ordre : pourcentage de victoires, puis différence de points, puis points marqués.
 * Une équipe qui n'a encore joué aucun match est classée après celles qui ont joué.
 * Pas de match direct. Un forfait compte comme une défaite 20-0.
 */

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
  /** Pourcentage de victoires arrondi (0 à 100), null tant que l'équipe n'a pas joué. */
  pct: number | null;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
};

/** Compare les pourcentages de victoires sans division (x avant y si négatif). */
function byPct(x: PouleRow, y: PouleRow): number {
  if (!x.played || !y.played) return (x.played ? 0 : 1) - (y.played ? 0 : 1);
  return y.wins * x.played - x.wins * y.played;
}

/** Classement complet de la poule, du premier au dernier. */
export function rankPoule(teams: number[], matches: PouleMatch[]): PouleRow[] {
  const rows = new Map<number, PouleRow>(
    teams.map((t) => [t, { team: t, played: 0, wins: 0, losses: 0, forfeits: 0, pct: null, pointsFor: 0, pointsAgainst: 0, diff: 0 }]),
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
    loss.losses++;
    if (m.forfeit === loss.team) loss.forfeits++;
    if (m.scoreA !== null && m.scoreB !== null) {
      a.pointsFor += m.scoreA;
      a.pointsAgainst += m.scoreB;
      b.pointsFor += m.scoreB;
      b.pointsAgainst += m.scoreA;
    }
  }
  for (const r of rows.values()) {
    r.diff = r.pointsFor - r.pointsAgainst;
    r.pct = r.played ? Math.round((100 * r.wins) / r.played) : null;
  }
  return [...rows.values()].sort(
    (x, y) => byPct(x, y) || y.diff - x.diff || y.pointsFor - x.pointsFor || x.team - y.team,
  );
}
