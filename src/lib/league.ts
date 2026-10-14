import type { Award, Edition, Game, LeagueData, Player, Promo, Series } from "./types";

export const LEVELS = ["L1", "L2", "L3", "M1", "M2"] as const;
export type Level = (typeof LEVELS)[number];

/** Couleur de cravate de l'uniforme ESATIC pour chaque niveau. */
export const LEVEL_TIE: Record<Level, { color: string; name: string }> = {
  L1: { color: "#1f2f66", name: "bleu nuit" },
  L2: { color: "#8b949c", name: "grise" },
  L3: { color: "#f0c22e", name: "jaune" },
  M1: { color: "#6ec6ee", name: "bleu ciel" },
  M2: { color: "#2f9e57", name: "verte" },
};

export function isLevel(v: string | null): v is Level {
  return v !== null && (LEVELS as readonly string[]).includes(v);
}

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

/** Une série avec le score de ses manches. */
export type SeriesView = Series & { games: Game[] };

/** Score affichable : « 54-48 » pour un match sec, « 2-1 » pour une série, null si inconnu. */
export function seriesScore(s: Series & { games?: Game[] }, forPromo?: number) {
  const flip = forPromo === s.promo_b;
  const g = s.games?.[0];
  if (s.best_of === 1 && g && g.score_a !== null && g.score_b !== null) {
    return flip ? `${g.score_b}-${g.score_a}` : `${g.score_a}-${g.score_b}`;
  }
  if (s.wins_a === null || s.wins_b === null) return null;
  return flip ? `${s.wins_b}-${s.wins_a}` : `${s.wins_a}-${s.wins_b}`;
}

export type StandingRow = {
  promo: Promo;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
};

/** Nombre de qualifiés pour les demies. */
export const QUALIFIED = 4;

export type EditionView = Edition & {
  label: string;
  final: SeriesView | null;
  semis: SeriesView[];
  /** Promos éliminées en demie, y compris celles dont on ne connaît pas la série. */
  semiLosers: Promo[];
  poule: SeriesView[];
  teams: Promo[];
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
  /** Classement en poule, si la promo y a joué. */
  poulePos: number | null;
};

export function buildLeague(data: LeagueData) {
  const promoBy = new Map(data.promos.map((p) => [p.number, p]));
  const playerBy = new Map(data.players.map((p) => [p.id, p]));
  const promo = (n: number) => promoBy.get(n)!;
  const views: SeriesView[] = data.series.map((s) => ({
    ...s,
    games: data.games.filter((g) => g.series_id === s.id).sort((a, b) => a.game_no - b.game_no),
  }));

  const editions: EditionView[] = data.editions
    .map((e) => {
      const ss = views.filter((s) => s.edition_year === e.start_year);
      const poule = ss.filter((s) => s.round === "poule");
      const registered = data.editionTeams.filter((t) => t.edition_year === e.start_year).map((t) => t.promo);
      const teamNumbers = new Set([...registered, ...poule.flatMap((s) => [s.promo_a, s.promo_b])]);
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
      const semis = ss.filter((s) => s.round === "demi");
      const loserNumbers = new Set([
        ...semis.filter((s) => s.winner !== null).map((s) => (s.winner === s.promo_a ? s.promo_b : s.promo_a)),
        ...data.semifinalists.filter((x) => x.edition_year === e.start_year).map((x) => x.promo),
      ]);
      const semiLosers = [...loserNumbers].filter((n) => promoBy.has(n)).map(promo);
      return {
        ...e,
        label: seasonLabel(e.start_year),
        final,
        semis,
        semiLosers,
        poule,
        teams: [...teamNumbers].filter((n) => promoBy.has(n)).map(promo).sort((a, b) => b.number - a.number),
        champion,
        finalist,
        awards,
        known: ss.length > 0 || awards.length > 0 || teamNumbers.size > 0 || semiLosers.length > 0,
      };
    })
    .sort((a, b) => b.start_year - a.start_year);

  /** Classement de la poule : victoires, puis différence de points, puis points marqués. */
  function standings(e: EditionView): StandingRow[] {
    const rows = new Map<number, StandingRow>(
      e.teams.map((p) => [
        p.number,
        { promo: p, rank: 0, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
      ]),
    );
    for (const s of e.poule) {
      if (s.winner === null) continue;
      const a = rows.get(s.promo_a);
      const b = rows.get(s.promo_b);
      if (!a || !b) continue;
      a.played++;
      b.played++;
      (s.winner === s.promo_a ? a : b).wins++;
      (s.winner === s.promo_a ? b : a).losses++;
      const g = s.games[0];
      if (g && g.score_a !== null && g.score_b !== null) {
        a.pointsFor += g.score_a;
        a.pointsAgainst += g.score_b;
        b.pointsFor += g.score_b;
        b.pointsAgainst += g.score_a;
      }
    }
    const list = [...rows.values()].map((r) => ({ ...r, diff: r.pointsFor - r.pointsAgainst }));
    list.sort(
      (x, y) => y.wins - x.wins || y.diff - x.diff || y.pointsFor - x.pointsFor || x.promo.number - y.promo.number,
    );
    return list.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /** Affiches des demies tirées du classement : 1er–4e et 2e–3e. */
  function proposedSemis(e: EditionView) {
    const top = standings(e).slice(0, QUALIFIED);
    if (top.length < QUALIFIED) return [];
    return [
      [top[0].promo, top[3].promo],
      [top[1].promo, top[2].promo],
    ] as const;
  }

  /** Matchs joués d'une édition, du plus récent au plus ancien. */
  function results(e: EditionView) {
    return [...e.poule, ...e.semis, ...(e.final ? [e.final] : [])]
      .filter((s) => s.winner !== null)
      .sort((a, b) => (b.match_date ?? "").localeCompare(a.match_date ?? "") || b.id - a.id);
  }

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
        else if (e.semiLosers.some((x) => x.number === p.number)) placement = "demi";
        const row = e.poule.length ? standings(e).find((r) => r.promo.number === p.number) : undefined;
        return {
          edition: e,
          level: levelOf(p, e.start_year),
          placement,
          pending,
          poulePos: row && row.played > 0 ? row.rank : null,
        };
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
  /** La dernière case (M2) accueille aussi les titres des anciens revenus jouer après le M2. */
  function ladder() {
    return LEVELS.map((level) => ({
      level,
      champions: editions
        .filter((e) => {
          if (!e.champion) return false;
          const l = levelOf(e.champion, e.start_year);
          return l === level || (level === "M2" && l === "Anciens");
        })
        .map((e) => ({ promo: e.champion!, edition: e, alumni: levelOf(e.champion!, e.start_year) === "Anciens" }))
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

  /**
   * Ce que l'accueil met en avant : la finale à venir, sinon le dernier champion.
   * Le champion reste à l'affiche jusqu'au premier match joué de la saison suivante.
   */
  function spotlight() {
    const upcoming = editions.find((e) => e.final && e.final.winner === null);
    if (upcoming) return { kind: "final" as const, edition: upcoming, series: upcoming.final! };
    const last = editions.find((e) => e.champion);
    const live = editions.find(
      (e) =>
        e.status === "en_cours" &&
        !e.champion &&
        (!last || e.start_year > last.start_year) &&
        e.poule.some((s) => s.winner !== null),
    );
    if (live) return { kind: "season" as const, edition: live };
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
    standings,
    proposedSemis,
    results,
    spotlight,
  };
}

export type League = ReturnType<typeof buildLeague>;
