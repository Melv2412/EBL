// Tests du classement de poule : `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rankPoule, type PouleMatch } from "./standings.ts";

/** `w` bat `l` sur le score donné. */
function win(w: number, l: number, sw: number, sl: number): PouleMatch {
  return { a: w, b: l, winner: w, scoreA: sw, scoreB: sl, forfeit: null };
}
const order = (teams: number[], matches: PouleMatch[]) => rankPoule(teams, matches).map((r) => r.team);

test("points affichés : victoire 2, défaite 1", () => {
  const rows = rankPoule([1, 2], [win(1, 2, 50, 40)]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.wins, r.points, r.diff]),
    [
      [1, 1, 2, 10],
      [2, 0, 1, -10],
    ],
  );
});

test("forfait : défaite 20-0, 0 point affiché", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: 2, scoreA: 0, scoreB: 20, forfeit: 1 }]);
  const one = rows.find((r) => r.team === 1)!;
  assert.deepEqual([one.losses, one.forfeits, one.points, one.diff], [1, 1, 0, -20]);
  assert.deepEqual(rows.map((r) => r.team), [2, 1]);
});

test("classement au nombre de victoires, même avec moins de matchs joués", () => {
  // 1 : 1 victoire en 1 match (2 pts, +20). 3 : 1 victoire, 1 défaite (3 pts, 0). 2 : 1-1 (3 pts, -15).
  // À victoires égales, la différence passe avant les points : 1 est premier avec moins de points.
  const matches = [win(1, 2, 60, 40), win(3, 4, 45, 40), win(2, 3, 50, 45)];
  assert.deepEqual(order([1, 2, 3, 4], matches), [1, 3, 2, 4]);
});

test("égalité de victoires : différence de points, pas de match direct", () => {
  // 1, 2 et 4 ont 1 victoire. 1 a battu 2, mais 2 a la meilleure différence (+58, 4 : +10, 1 : -8).
  const matches = [win(1, 2, 50, 48), win(2, 3, 80, 20), win(4, 1, 40, 30)];
  assert.deepEqual(order([1, 2, 3, 4], matches), [2, 4, 1, 3]);
});

test("égalité de victoires et de différence : points marqués", () => {
  const matches = [win(1, 3, 50, 40), win(2, 4, 70, 60)];
  // 1 et 2 : 1 victoire, +10 ; 2 a marqué 70 contre 50. 3 et 4 : 0 victoire, -10 ; 4 a marqué 60 contre 40.
  assert.deepEqual(order([1, 2, 3, 4], matches), [2, 1, 4, 3]);
});

test("égalité à 3 en boucle : différence générale", () => {
  const matches = [win(1, 2, 50, 40), win(2, 3, 60, 40), win(3, 1, 45, 40)];
  // 1 : +10 -5 = +5 ; 2 : -10 +20 = +10 ; 3 : -20 +5 = -15.
  assert.deepEqual(order([1, 2, 3], matches), [2, 1, 3]);
});

test("matchs non joués ignorés", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: null, scoreA: null, scoreB: null, forfeit: null }]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.played, r.wins]),
    [
      [1, 0, 0],
      [2, 0, 0],
    ],
  );
});
