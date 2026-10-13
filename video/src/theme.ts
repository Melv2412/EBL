import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

export const display = loadOswald("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const body = loadInter("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

// Couleurs du site (logo EBL).
export const C = {
  night: "#090c0e",
  night2: "#141a1f",
  teal: "#45bddc",
  gold: "#e3b341",
  white: "#eef3f6",
  soft: "#9fb0bc",
};

export const LEVELS = ["L1", "L2", "L3", "M1", "M2"] as const;
export type Level = (typeof LEVELS)[number];

/** Cravates de l'uniforme ESATIC. */
export const TIE: Record<Level, string> = {
  L1: "#1f2f66",
  L2: "#8b949c",
  L3: "#f0c22e",
  M1: "#6ec6ee",
  M2: "#2f9e57",
};
