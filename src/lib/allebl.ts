import { createClient } from "@supabase/supabase-js";
import type { Player, Promo } from "./types";

/** Saison de lancement de l'All-EBL Team. */
export const ALLEBL_FIRST_YEAR = 2025;
export const EXT_COUNT = 3;
export const INT_COUNT = 2;

export type Side = "ext" | "int";
export const SIDE_LABEL: Record<Side, string> = { ext: "Extérieur", int: "Intérieur" };

export type AllEblSettings = {
  start_year: number;
  allebl_opens_at: string | null;
  allebl_closes_at: string | null;
  allebl_published: boolean;
};

export type Candidate = { edition_year: number; player_id: number; side: Side };

export type TallyRow = {
  player_id: number;
  side: Side;
  public_votes: number;
  captain_votes: number;
  public_ballots: number;
  captain_ballots: number;
};

export type VotePhase = "a_venir" | "ouvert" | "clos" | "non_configure";

export function votePhase(s: AllEblSettings | undefined, now = new Date()): VotePhase {
  if (!s?.allebl_opens_at) return "non_configure";
  if (now < new Date(s.allebl_opens_at)) return "a_venir";
  if (s.allebl_closes_at && now > new Date(s.allebl_closes_at)) return "clos";
  return "ouvert";
}

const when = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});
export const formatWhen = (iso: string | null) => (iso ? when.format(new Date(iso)) : "");

function publicDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Réglages et candidats All-EBL. Si la migration n'est pas encore appliquée,
 * renvoie des listes vides au lieu de casser le site.
 */
export async function getAllEbl() {
  const db = publicDb();
  if (!db) return { settings: [] as AllEblSettings[], candidates: [] as Candidate[], ready: false };
  const [settings, candidates] = await Promise.all([
    db
      .from("editions")
      .select("start_year, allebl_opens_at, allebl_closes_at, allebl_published")
      .gte("start_year", ALLEBL_FIRST_YEAR)
      .order("start_year", { ascending: false }),
    db.from("allebl_candidates").select("*"),
  ]);
  if (settings.error || candidates.error) return { settings: [], candidates: [], ready: false };
  return { settings: settings.data as AllEblSettings[], candidates: candidates.data as Candidate[], ready: true };
}

/** Totaux du vote (le public ne reçoit rien tant que le vote n'est pas clos et publié). */
export async function getTally(year: number, db = publicDb()) {
  if (!db) return [] as TallyRow[];
  const { data, error } = await db.rpc("allebl_tally", { y: year });
  if (error) return [];
  return (data ?? []) as TallyRow[];
}

export type ScoredCandidate = TallyRow & { score: number; publicShare: number; captainShare: number };

/**
 * Score = 50 % part des bulletins du public + 50 % part des bulletins des capitaines.
 * S'il n'y a aucun bulletin d'un côté, l'autre compte pour 100 %.
 */
export function scoreTally(rows: TallyRow[]): ScoredCandidate[] {
  const pb = rows[0]?.public_ballots ?? 0;
  const cb = rows[0]?.captain_ballots ?? 0;
  const wp = pb && cb ? 0.5 : pb ? 1 : 0;
  const wc = pb && cb ? 0.5 : cb ? 1 : 0;
  return rows.map((r) => {
    const publicShare = pb ? r.public_votes / pb : 0;
    const captainShare = cb ? r.captain_votes / cb : 0;
    return { ...r, publicShare, captainShare, score: 100 * (wp * publicShare + wc * captainShare) };
  });
}

/** Les élus : 3 meilleurs extérieurs, puis 2 meilleurs intérieurs parmi les joueurs restants. */
export function electTeam(scored: ScoredCandidate[], playerName: (id: number) => string) {
  if (!scored.some((s) => s.public_ballots || s.captain_ballots)) return { ext: [], int: [] };
  const rank = (a: ScoredCandidate, b: ScoredCandidate) =>
    b.score - a.score || b.public_votes - a.public_votes || playerName(a.player_id).localeCompare(playerName(b.player_id));
  const ext = scored.filter((s) => s.side === "ext").sort(rank).slice(0, EXT_COUNT);
  const taken = new Set(ext.map((s) => s.player_id));
  const int = scored
    .filter((s) => s.side === "int" && !taken.has(s.player_id))
    .sort(rank)
    .slice(0, INT_COUNT);
  return { ext, int };
}

export type BallotPlayer = Pick<Player, "id" | "full_name" | "position" | "photo_url"> & {
  promo: Pick<Promo, "number" | "name" | "logo_url" | "color_primary" | "color_secondary">;
};

/** Candidats d'une édition, prêts pour le bulletin (avec la promo de chaque joueur). */
export function ballotCandidates(year: number, candidates: Candidate[], players: Player[], promos: Promo[]) {
  const promoBy = new Map(promos.map((p) => [p.number, p]));
  const playerBy = new Map(players.map((p) => [p.id, p]));
  const out: Record<Side, BallotPlayer[]> = { ext: [], int: [] };
  for (const c of candidates) {
    if (c.edition_year !== year) continue;
    const pl = playerBy.get(c.player_id);
    const pr = pl && promoBy.get(pl.promo);
    if (!pl || !pr) continue;
    out[c.side].push({ id: pl.id, full_name: pl.full_name, position: pl.position, photo_url: pl.photo_url, promo: pr });
  }
  for (const side of ["ext", "int"] as const) out[side].sort((a, b) => a.full_name.localeCompare(b.full_name));
  return out;
}

/** Saison (« 2025-26 ») dont le vote est ouvert et publié, sinon null. Pour le bandeau de l'accueil. */
export async function openPublishedVote() {
  const { settings } = await getAllEbl();
  const s = settings.find((x) => x.allebl_published && votePhase(x) === "ouvert");
  return s ? `${s.start_year}-${String(s.start_year + 1).slice(2)}` : null;
}

/** L'équipe élue d'une saison, seulement si son vote est clos et publié. */
export async function publishedTeam(year: number, data: { players: Player[] }) {
  if (year < ALLEBL_FIRST_YEAR) return null;
  const { settings } = await getAllEbl();
  const s = settings.find((x) => x.start_year === year);
  if (!s?.allebl_published || votePhase(s) !== "clos") return null;
  const name = (id: number) => data.players.find((p) => p.id === id)?.full_name ?? "";
  const team = electTeam(scoreTally(await getTally(year)), name);
  return team.ext.length + team.int.length > 0 ? team : null;
}
