import { promoCode, promoName, seasonLabel, type League } from "@/lib/league";
import type { LeagueData } from "@/lib/types";
import { AWARDS } from "@/lib/awards";

export type AuditEntry = {
  id: number;
  at: string;
  tx: number;
  actor_name: string | null;
  table_name: string;
  action: "insert" | "update" | "delete";
  row_key: Record<string, unknown>;
  old_row: Record<string, unknown> | null;
  new_row: Record<string, unknown> | null;
  restored_at: string | null;
};

type Row = Record<string, unknown>;

const FIELD: Record<string, Record<string, string>> = {
  series: {
    promo_a: "équipe A",
    promo_b: "équipe B",
    winner: "vainqueur",
    wins_a: "manches A",
    wins_b: "manches B",
    best_of: "format",
    match_date: "date",
    round: "tour",
  },
  games: { score_a: "score A", score_b: "score B" },
  players: {
    full_name: "nom",
    position: "poste",
    photo_url: "photo",
    is_captain: "capitaine",
    is_starter: "5 de départ",
    promo: "promo",
  },
  promos: {
    name: "nom",
    logo_url: "logo",
    team_photo_url: "photo d'équipe",
    color_primary: "couleur principale",
    color_secondary: "couleur secondaire",
    entry_year: "année d'entrée",
  },
  editions: {
    status: "statut",
    final_date: "date de la finale",
    final_time: "heure de la finale",
    venue: "lieu",
    summary: "résumé",
  },
  awards: { type: "distinction", player_id: "joueur", points: "points", games: "matchs" },
};

const ROUND: Record<string, string> = { poule: "Poule", demi: "Demi-finale", finale: "Finale", troisieme: "3e place" };
const STATUS: Record<string, string> = { a_completer: "À compléter", en_cours: "En cours", terminee: "Terminée" };
const AWARD: Record<string, string> = Object.fromEntries(Object.entries(AWARDS).map(([k, v]) => [k, v.label]));

/** Rend les fiches du journal lisibles : noms des promos, joueurs, matchs. */
export function describer(league: League, data: LeagueData) {
  const promo = (n: unknown) => {
    const p = league.promo(Number(n));
    return p ? `${promoName(p)} (${promoCode(p)})` : `IT${n}`;
  };
  const player = (id: unknown) => data.players.find((p) => p.id === Number(id))?.full_name ?? `joueur n°${id}`;
  const series = (id: unknown) => data.series.find((s) => s.id === Number(id));
  const match = (s: Row | undefined) =>
    s ? `${ROUND[String(s.round)] ?? "Match"} ${seasonLabel(Number(s.edition_year))} : ${promo(s.promo_a)} vs ${promo(s.promo_b)}` : "un match supprimé";

  function value(table: string, field: string, v: unknown): string {
    if (v === null || v === undefined || v === "") return "vide";
    if (typeof v === "boolean") return v ? "oui" : "non";
    if (["promo_a", "promo_b", "winner", "promo"].includes(field)) return promo(v);
    if (field === "player_id") return player(v);
    if (field === "best_of") return Number(v) === 1 ? "match sec" : `au meilleur des ${v}`;
    if (field === "round") return ROUND[String(v)] ?? String(v);
    if (field === "status") return STATUS[String(v)] ?? String(v);
    if (field === "type" && table === "awards") return AWARD[String(v)] ?? String(v);
    if (field.endsWith("_url")) return "image";
    const s = String(v);
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  }

  /** De quoi parle la fiche. */
  function subject(e: AuditEntry): string {
    const r = (e.new_row ?? e.old_row ?? {}) as Row;
    switch (e.table_name) {
      case "series":
        return `le match ${match(r)}`;
      case "games": {
        const s = series(r.series_id);
        return `le score (manche ${r.game_no}) de ${match(s as unknown as Row)}`;
      }
      case "players":
        return `le joueur ${r.full_name ?? player(r.id)} (${promo(r.promo)})`;
      case "promos":
        return `la promo ${promo(r.number)}`;
      case "editions":
        return `l'édition ${seasonLabel(Number(r.start_year))}`;
      case "awards":
        return `la distinction ${AWARD[String(r.type)] ?? ""} ${seasonLabel(Number(r.edition_year))} de ${player(r.player_id)}`;
      case "edition_teams":
        return `l'inscription de ${promo(r.promo)} à l'édition ${seasonLabel(Number(r.edition_year))}`;
      case "semifinalists":
        return `${promo(r.promo)} demi-finaliste ${seasonLabel(Number(r.edition_year))}`;
      default:
        return e.table_name;
    }
  }

  /** Phrase et détail des champs modifiés. */
  return function describe(e: AuditEntry) {
    const verb = e.action === "insert" ? "a ajouté" : e.action === "delete" ? "a supprimé" : "a modifié";
    const changes: { label: string; before: string; after: string }[] = [];
    if (e.action === "update" && e.old_row && e.new_row) {
      const labels = FIELD[e.table_name] ?? {};
      for (const [field, label] of Object.entries(labels)) {
        const a = e.old_row[field];
        const b = e.new_row[field];
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          changes.push({ label, before: value(e.table_name, field, a), after: value(e.table_name, field, b) });
        }
      }
    }
    return { sentence: `${verb} ${subject(e)}`, changes };
  };
}
