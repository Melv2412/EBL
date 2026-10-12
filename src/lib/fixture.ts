import type { LeagueData } from "./types";

// Copie de supabase/seed.sql, utilisée quand Supabase n'est pas configuré
// (développement local sans clés).
const base = { venue: null, summary: null, final_time: null };
const teal = { color_primary: "#1b2a33", color_secondary: "#2aa7c9" };

export const fixture: LeagueData = {
  promos: [
    { number: 7, name: null, entry_year: 2018, logo_url: null, team_photo_url: null, ...teal },
    { number: 8, name: null, entry_year: 2019, logo_url: null, team_photo_url: null, ...teal },
    { number: 9, name: null, entry_year: 2020, logo_url: null, team_photo_url: null, ...teal },
    { number: 10, name: "Eagle", entry_year: 2021, logo_url: "/logos/it10.jpeg", team_photo_url: null, color_primary: "#1d2939", color_secondary: "#c9ac5f" },
    { number: 11, name: "Wolvesonze", entry_year: 2022, logo_url: "/logos/it11.jpeg", team_photo_url: null, color_primary: "#25418a", color_secondary: "#6f93d6" },
    { number: 12, name: "Grizzly", entry_year: 2023, logo_url: "/logos/it12.jpeg", team_photo_url: "/photos/equipes/it12.webp", color_primary: "#3a0a5a", color_secondary: "#b48ee0" },
    { number: 13, name: "Warriors", entry_year: 2024, logo_url: "/logos/it13.webp", team_photo_url: "/photos/equipes/it13.webp", color_primary: "#13213c", color_secondary: "#f2b21b" },
    { number: 14, name: "Les Hecatonchires", entry_year: 2025, logo_url: "/logos/it14.jpeg", team_photo_url: null, color_primary: "#161616", color_secondary: "#d0182f" },
    { number: 15, name: null, entry_year: 2026, logo_url: null, team_photo_url: null, ...teal },
  ],
  editions: [
    { start_year: 2019, status: "a_completer", final_date: null, ...base },
    { start_year: 2020, status: "a_completer", final_date: null, ...base },
    { start_year: 2021, status: "a_completer", final_date: null, ...base },
    { start_year: 2022, status: "a_completer", final_date: null, ...base },
    { start_year: 2023, status: "terminee", final_date: null, ...base },
    { start_year: 2024, status: "terminee", final_date: null, ...base },
    { start_year: 2025, status: "en_cours", final_date: "2026-10-17", ...base },
  ],
  series: [
    { id: 1, edition_year: 2023, round: "finale", promo_a: 10, promo_b: 11, winner: 10, wins_a: null, wins_b: null, best_of: 3, match_date: null },
    { id: 2, edition_year: 2024, round: "finale", promo_a: 12, promo_b: 10, winner: 12, wins_a: null, wins_b: null, best_of: 3, match_date: null },
    { id: 3, edition_year: 2025, round: "demi", promo_a: 14, promo_b: 13, winner: 14, wins_a: 2, wins_b: 0, best_of: 3, match_date: null },
    { id: 4, edition_year: 2025, round: "demi", promo_a: 12, promo_b: 11, winner: 12, wins_a: 2, wins_b: 1, best_of: 3, match_date: null },
    { id: 5, edition_year: 2025, round: "finale", promo_a: 12, promo_b: 14, winner: null, wins_a: null, wins_b: null, best_of: 1, match_date: "2026-10-17" },
  ],
  players: [
    { id: 1, full_name: "Yoan Diebe", promo: 10, position: null, photo_url: null, is_captain: false },
    { id: 2, full_name: "Baki Elysée", promo: 11, position: null, photo_url: null, is_captain: false },
    { id: 3, full_name: "Boni Jean-Elie", promo: 12, position: null, photo_url: "/photos/joueurs/boni-jean-elie.webp", is_captain: false },
    { id: 4, full_name: "Oulé Désiré", promo: 12, position: null, photo_url: null, is_captain: false },
  ],
  awards: [
    { id: 1, edition_year: 2023, type: "mvp", player_id: 1 },
    { id: 2, edition_year: 2023, type: "mention_honorable", player_id: 2 },
    { id: 3, edition_year: 2024, type: "mvp", player_id: 3 },
    { id: 4, edition_year: 2024, type: "mention_honorable", player_id: 4 },
  ],
  games: [],
  editionTeams: [],
  semifinalists: [
    { edition_year: 2023, promo: 12 },
    { edition_year: 2024, promo: 11 },
    { edition_year: 2024, promo: 13 },
  ],
};
