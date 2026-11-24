// Tests du classement de poule : `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rankPoule, type PouleMatch } from "./standings.ts";

/** `w` bat `l` sur le score donné. */
function win(w: number, l: number, sw: number, sl: number): PouleMatch {
  return { a: w, b: l, winner: w, scoreA: sw, scoreB: sl, forfeit: null };
}
const order = (teams: number[], matches: PouleMatch[]) => rankPoule(teams, matches).map((r) => r.team);

test("victoire 2 pts, défaite 1 pt", () => {
  const rows = rankPoule([1, 2], [win(1, 2, 50, 40)]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.points, r.diff]),
    [
      [1, 2, 10],
      [2, 1, -10],
    ],
  );
});

test("forfait : 20-0 et aucun point pour l'équipe forfait", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: 2, scoreA: 0, scoreB: 20, forfeit: 1 }]);
  const one = rows.find((r) => r.team === 1)!;
  assert.equal(one.points, 0);
  assert.equal(one.forfeits, 1);
  assert.equal(one.diff, -20);
  assert.deepEqual(order([1, 2], [{ a: 1, b: 2, winner: 2, scoreA: 0, scoreB: 20, forfeit: 1 }]), [2, 1]);
});

test("égalité à 2 avec match direct : le vainqueur du duel passe devant malgré une moins bonne différence", () => {
  const matches = [win(1, 2, 50, 48), win(2, 3, 80, 20), win(4, 1, 40, 30)];
  // 1 et 2 ont 3 pts ; 2 a +58 de différence, 1 a -8, mais 1 a battu 2.
  assert.deepEqual(order([1, 2, 3, 4], matches), [1, 2, 4, 3]);
});

test("égalité à 2 sans match direct : différence générale", () => {
  const matches = [win(1, 3, 50, 40), win(2, 4, 70, 40)];
  assert.deepEqual(order([1, 2, 3, 4], matches), [2, 1, 3, 4]);
});

test("égalité à 3 en boucle : mini-classement à la différence entre elles", () => {
  const matches = [win(1, 2, 50, 40), win(2, 3, 60, 40), win(3, 1, 45, 40)];
  // Entre elles : 2 à +10, 1 à +5, 3 à -15.
  assert.deepEqual(order([1, 2, 3], matches), [2, 1, 3]);
});

test("égalité à 3 en boucle, mini-classement sans effet : différence générale", () => {
  const matches = [
    win(1, 2, 50, 40),
    win(2, 3, 50, 40),
    win(3, 1, 50, 40),
    win(1, 4, 100, 0),
    win(2, 4, 60, 50),
    win(3, 4, 55, 50),
  ];
  assert.deepEqual(order([1, 2, 3, 4], matches), [1, 2, 3, 4]);
});

test("égalité à 3 : le mini-classement en isole une, on recommence avec les deux autres", () => {
  const matches = [
    win(1, 2, 55, 45),
    win(2, 3, 55, 40),
    win(3, 1, 60, 40),
    win(1, 4, 41, 40),
    win(2, 4, 41, 40),
    win(3, 4, 70, 40),
  ];
  // Entre elles : 1 à -10, 2 et 3 à +5 avec 100 pts marqués chacune. On rejoue l'étape 1 entre 2 et 3 :
  // 2 a battu 3, alors que 3 a la meilleure différence générale.
  assert.deepEqual(order([1, 2, 3, 4], matches), [2, 3, 1, 4]);
});

test("égalité à 3 en cours de poule : pas de mini-classement tant qu'elles ne se sont pas toutes affrontées", () => {
  const matches = [
    win(1, 2, 51, 50),
    win(5, 1, 60, 40),
    win(2, 4, 80, 40),
    win(3, 4, 60, 50),
    win(5, 3, 55, 50),
  ];
  // 1, 2 et 3 ont 3 pts. 1 a battu 2, mais 3 n'a joué ni 1 ni 2 : différence générale (2 : +39, 3 : +5, 1 : -19).
  assert.deepEqual(order([1, 2, 3, 4, 5], matches), [5, 2, 3, 1, 4]);
});

test("matchs non joués ignorés", () => {
  const rows = rankPoule([1, 2], [{ a: 1, b: 2, winner: null, scoreA: null, scoreB: null, forfeit: null }]);
  assert.deepEqual(
    rows.map((r) => [r.team, r.played, r.points]),
    [
      [1, 0, 0],
      [2, 0, 0],
    ],
  );
});
