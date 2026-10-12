import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { fixture } from "./fixture";
import type { LeagueData } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Toute la ligue tient en quelques dizaines de lignes : on charge tout d'un
// coup et on calcule le reste côté serveur (voir league.ts).
export const getLeagueData = cache(async (): Promise<LeagueData> => {
  if (!url || !anonKey) return fixture;

  const db = createClient(url, anonKey, { auth: { persistSession: false } });
  const [promos, editions, series, players, awards, games, editionTeams] = await Promise.all([
    db.from("promos").select("*").order("number"),
    db.from("editions").select("*").order("start_year"),
    db.from("series").select("*").order("id"),
    db.from("players").select("*").order("full_name"),
    db.from("awards").select("*").order("id"),
    db.from("games").select("id, series_id, game_no, score_a, score_b").order("game_no"),
    db.from("edition_teams").select("*"),
  ]);

  const error =
    promos.error ?? editions.error ?? series.error ?? players.error ?? awards.error ?? games.error ?? editionTeams.error;
  if (error) throw new Error(`Supabase : ${error.message}`);

  return {
    promos: promos.data ?? [],
    editions: editions.data ?? [],
    series: series.data ?? [],
    players: players.data ?? [],
    awards: awards.data ?? [],
    games: games.data ?? [],
    editionTeams: editionTeams.data ?? [],
  };
});
