export type EditionStatus = "a_completer" | "en_cours" | "terminee";
export type SeriesRound = "poule" | "demi" | "finale" | "troisieme";
export type AwardType =
  | "mvp"
  | "mvp_finale"
  | "dpoy"
  | "top_scorer"
  | "revelation"
  | "mention_honorable"
  | "three_point"
  | "dunk";

export type Promo = {
  number: number;
  name: string | null;
  entry_year: number;
  logo_url: string | null;
  color_primary: string;
  color_secondary: string;
  team_photo_url: string | null;
};

export type Edition = {
  start_year: number;
  status: EditionStatus;
  final_date: string | null;
  final_time: string | null;
  venue: string | null;
  summary: string | null;
};

export type Series = {
  id: number;
  edition_year: number;
  round: SeriesRound;
  promo_a: number;
  promo_b: number;
  winner: number | null;
  wins_a: number | null;
  wins_b: number | null;
  best_of: number;
  match_date: string | null;
};

/** Score d'une manche (un match sec n'a qu'une manche). */
export type Game = {
  id: number;
  series_id: number;
  game_no: number;
  score_a: number | null;
  score_b: number | null;
};

export type EditionTeam = {
  edition_year: number;
  promo: number;
};

export type Player = {
  id: number;
  full_name: string;
  promo: number;
  position: string | null;
  photo_url: string | null;
  is_captain: boolean;
  /** Dans le 5 de départ (affiché sur le terrain, sans mention). */
  is_starter: boolean;
};

export type Award = {
  id: number;
  edition_year: number;
  type: AwardType;
  player_id: number;
  /** Meilleur scoreur : total de points et nombre de matchs (facultatifs). */
  points?: number | null;
  games?: number | null;
};

export type LeagueData = {
  promos: Promo[];
  editions: Edition[];
  series: Series[];
  players: Player[];
  awards: Award[];
  games: Game[];
  editionTeams: EditionTeam[];
  /** Demi-finalistes connus sans le détail de leur série (archives). */
  semifinalists: EditionTeam[];
};
