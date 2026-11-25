// Tests du classement de poule : `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rankPoule, type PouleMatch } from "./standings.ts";

/** `w` bat `l` sur le score donné. */
function win(w: number, l: number, sw: number, sl: number): PouleMatch {
  return { a: w, b: l, winner: w, scoreA: sw, scoreB: sl, forfeit: null };
}
const order = (teams: number[], matches: PouleMatch[]) => rankPoule(teams, matches).map((r) => r.team);

test("pourcentage de victoires et différence", () => {
  const rows = rankPoule([1, 2], [win(1, 2, 50, 40)]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.wins, r.pct, r.diff]),
    [
      [1, 1, 100, 10],
      [2, 0, 0, -10],
    ],
  );
});

test("forfait : défaite 20-0", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: 2, scoreA: 0, scoreB: 20, forfeit: 1 }]);
  const one = rows.find((r) => r.team === 1)!;
  assert.deepEqual([one.losses, one.forfeits, one.pct, one.diff], [1, 1, 0, -20]);
  assert.deepEqual(rows.map((r) => r.team), [2, 1]);
});

test("1 sur 1 passe devant 1 victoire et 1 défaite, même avec une moins bonne différence", () => {
  // 1 : 1-0 (100 %, +5). 2 : 1-1 (50 %, +30). 3 : 0-1. 4 : 0-1.
  const matches = [win(1, 3, 45, 40), win(2, 4, 80, 40), win(4, 2, 50, 40)];
  assert.deepEqual(order([1, 2, 3, 4], matches), [1, 2, 4, 3]);
});

test("une équipe sans match est classée derrière celles qui ont perdu", () => {
  const matches = [win(1, 2, 62, 9), win(3, 4, 47, 18)];
  assert.deepEqual(order([1, 2, 3, 4, 5], matches), [1, 3, 4, 2, 5]);
  assert.equal(rankPoule([5], []).at(0)!.pct, null);
});

test("même pourcentage : différence de points, pas de match direct", () => {
  // Boucle : chacun 1 sur 2. 1 a battu 2, mais 2 a la meilleure différence (2 : +58, 1 : -8, 3 : -50).
  const matches = [win(1, 2, 50, 48), win(2, 3, 80, 20), win(3, 1, 40, 30)];
  assert.deepEqual(order([1, 2, 3], matches), [2, 1, 3]);
});

test("même pourcentage et même différence : points marqués", () => {
  // 1 et 2 : 100 %, +10 ; 2 a marqué 70 contre 50. 3 et 4 : 0 %, -10 ; 4 a marqué 60 contre 40.
  const matches = [win(1, 3, 50, 40), win(2, 4, 70, 60)];
  assert.deepEqual(order([1, 2, 3, 4], matches), [2, 1, 4, 3]);
});

test("matchs non joués ignorés", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: null, scoreA: null, scoreB: null, forfeit: null }]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.played, r.wins, r.pct]),
    [
      [1, 0, 0, null],
      [2, 0, 0, null],
    ],
  );
});
