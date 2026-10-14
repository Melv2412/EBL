import type { AwardType } from "./types";

export type AwardCategory = "tournoi" | "concours";

/** Catalogue des distinctions, dans l'ordre d'affichage. */
export const AWARDS: Record<AwardType, { label: string; short: string; category: AwardCategory; many?: boolean }> = {
  mvp: { label: "MVP du tournoi", short: "MVP", category: "tournoi" },
  mvp_finale: { label: "MVP de la finale", short: "MVP finale", category: "tournoi" },
  dpoy: { label: "Défenseur de l'année", short: "DPOY", category: "tournoi" },
  top_scorer: { label: "Meilleur scoreur", short: "Meilleur scoreur", category: "tournoi" },
  revelation: { label: "Révélation de l'année", short: "Révélation", category: "tournoi" },
  mention_honorable: { label: "Mention honorable", short: "Mention", category: "tournoi", many: true },
  three_point: { label: "Concours à 3 points", short: "3 points", category: "concours" },
  dunk: { label: "Concours de dunk", short: "Dunk", category: "concours" },
};

export const AWARD_ORDER = Object.keys(AWARDS) as AwardType[];

export const awardRank = (t: AwardType) => AWARD_ORDER.indexOf(t);

export function isAwardType(v: string | null): v is AwardType {
  return v !== null && v in AWARDS;
}

/** « 87 pts » ou « 87 pts en 6 matchs » pour le meilleur scoreur. */
export function awardDetail(a: { type: AwardType; points?: number | null; games?: number | null }) {
  if (a.type !== "top_scorer" || a.points == null) return null;
  return a.games ? `${a.points} pts en ${a.games} matchs` : `${a.points} pts`;
}
