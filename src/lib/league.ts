import type { Award, Edition, LeagueData, Player, Promo, Series } from "./types";

export const LEVELS = ["L1", "L2", "L3", "M1", "M2"] as const;
export type Level = (typeof LEVELS)[number];

export const WHATSAPP_URL = "https://wa.me/2250788045849";

/** 2025 → « 2025-26 » */
export function seasonLabel(startYear: number) {
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

/** L'année universitaire commence en septembre : octobre 2026 → 2026 (saison 2026-27). */
export function currentSeasonYear(now = new Date()) {
  return now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/** « 2025-26 » ou « 2025 » → 2025 */
export function parseSeason(slug: string) {
  const year = Number.parseInt(slug.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function promoCode(p: Pick<Promo, "number">) {
  return `IT${p.number}`;
}

export function promoName(p: Promo) {
  return p.name ?? promoCode(p);
}

export function promoSlug(p: Pick<Promo, "number">) {
  return `it${p.number}`;
}

/** Niveau d'une promo pendant une saison : null avant son entrée, « Anciens » après le M2. */
export function levelOf(promo: Promo, startYear: number): Level | "Anciens" | null {
  const i = startYear - promo.entry_year;
  if (i < 0) return null;
  return LEVELS[i] ?? "Anciens";
}

export type Placement = "champion" | "finaliste" | "demi";

export const PLACEMENT_LABEL: Record<Placement, string> = {
  champion: "Champion",
  finaliste: "Finaliste",
  demi: "Demi-finaliste",
};

const PLACEMENT_RANK: Record<Placement, number> = { champion: 0, finaliste: 1, demi: 2 };

export type AwardView = Award & { player: Player; promo: Promo };

export type EditionView = Edition & {
  label: string;
  final: Series | null;
  semis: Series[];
  champion: Promo | null;
  finalist: Promo | null;
  awards: AwardView[];
  /** Le résultat est-il au moins partiellement connu ? */
  known: boolean;
};

export type JourneyEntry = {
  edition: EditionView;
  level: ReturnType<typeof levelOf>;
  placement: Placement | null;
  /** Série en cours non décidée (ex : finale à venir). */
  pending: Series | null;
};

export function buildLeague(data: LeagueData) {
  const promoBy = new Map(data.promos.map((p) => [p.number, p]));
  const playerBy = new Map(data.players.map((p) => [p.id, p]));
  const promo = (n: number) => promoBy.get(n)!;

  const editions: EditionView[] = data.editions
    .map((e) => {
      const ss = data.series.filter((s) => s.edition_year === e.start_year);
      const final = ss.find((s) => s.round === "finale") ?? null;
      const champion = final?.winner ? promo(final.winner) : null;
      const finalist =
        final?.winner ? promo(final.winner === final.promo_a ? final.promo_b : final.promo_a) : null;
      const awards = data.awards
        .filter((a) => a.edition_year === e.start_year && playerBy.has(a.player_id))
        .map((a) => {
          const player = playerBy.get(a.player_id)!;
          return { ...a, player, promo: promo(player.promo) };
        });
      return {
        ...e,
        label: seasonLabel(e.start_year),
        final,
        semis: ss.filter((s) => s.round === "demi"),
        champion,
        finalist,
        awards,
        known: ss.length > 0 || awards.length > 0,
      };
    })
    .sort((a, b) => b.start_year - a.start_year);

  /** Ce qu'a fait une promo à chaque édition où elle apparaît. */
  function journey(p: Promo): JourneyEntry[] {
    return editions
      .filter((e) => levelOf(p, e.start_year) !== null)
      .map((e) => {
        let placement: Placement | null = null;
        let pending: Series | null = null;
        const inFinal = e.final && (e.final.promo_a === p.number || e.final.promo_b === p.number);
        if (inFinal && e.final!.winner === null) pending = e.final;
        else if (inFinal) placement = e.final!.winner === p.number ? "champion" : "finaliste";
        else if (e.semis.some((s) => s.promo_a === p.number || s.promo_b === p.number)) placement = "demi";
        return { edition: e, level: levelOf(p, e.start_year), placement, pending };
      })
      .sort((a, b) => a.edition.start_year - b.edition.start_year);
  }

  function bestResult(p: Promo) {
    const placed = journey(p).filter((j) => j.placement);
    if (placed.length === 0) return null;
    const best = Math.min(...placed.map((j) => PLACEMENT_RANK[j.placement!]));
    const hits = placed.filter((j) => PLACEMENT_RANK[j.placement!] === best);
    return { placement: hits[0].placement!, editions: hits.map((h) => h.edition) };
  }

  /** Échelle L1 → M2 : les titres rangés par niveau auquel ils ont été gagnés. */
  function ladder() {
    return LEVELS.map((level) => ({
      level,
      champions: editions
        .filter((e) => e.champion && levelOf(e.champion, e.start_year) === level)
        .map((e) => ({ promo: e.champion!, edition: e }))
        .sort((a, b) => a.edition.start_year - b.edition.start_year),
    }));
  }

  /** Promos championnes à tous les niveaux L1 → M2. */
  function grandSlams() {
    return data.promos.filter((p) =>
      LEVELS.every((l) => editions.some((e) => e.champion?.number === p.number && levelOf(p, e.start_year) === l)),
    );
  }

  /** Ce qu'une promo joue dans une finale : phrases courtes pour l'accueil. */
  function stakes(p: Promo, year: number) {
    const lines: string[] = [];
    const level = levelOf(p, year);

    let streak = 0;
    for (let y = year - 1; editions.find((e) => e.start_year === y)?.champion?.number === p.number; y--) streak++;
    const titles = editions.filter((e) => e.start_year < year && e.champion?.number === p.number).length;

    if (streak > 0) lines.push(`Champion en titre, vise ${streak === 1 ? "le doublé" : streak === 2 ? "le triplé" : `un ${streak + 1}e titre de suite`}`);
    else if (titles === 0) lines.push("Vise son premier titre");

    if (level && level !== "Anciens") {
      const levelWon = editions.some(
        (e) => e.start_year < year && e.champion && levelOf(e.champion, e.start_year) === level,
      );
      if (!levelWon) lines.push(`Aucun champion en ${level} dans nos archives`);
    }
    return lines;
  }

  /** Ce que l'accueil met en avant : la finale à venir, sinon le dernier champion. */
  function spotlight() {
    const upcoming = editions.find((e) => e.final && e.final.winner === null);
    if (upcoming) return { kind: "final" as const, edition: upcoming, series: upcoming.final! };
    const last = editions.find((e) => e.champion);
    if (last) return { kind: "champion" as const, edition: last };
    return null;
  }

  return {
    promos: [...data.promos].sort((a, b) => b.number - a.number),
    editions,
    promo: (n: number) => promoBy.get(n) ?? null,
    edition: (year: number) => editions.find((e) => e.start_year === year) ?? null,
    playersOf: (p: Promo) => data.players.filter((pl) => pl.promo === p.number),
    awardsOf: (p: Promo) => editions.flatMap((e) => e.awards.filter((a) => a.promo.number === p.number)),
    journey,
    bestResult,
    ladder,
    grandSlams,
    stakes,
    spotlight,
  };
}

export type League = ReturnType<typeof buildLeague>;
