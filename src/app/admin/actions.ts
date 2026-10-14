"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin, supabaseServer } from "@/lib/supabase-server";

export type FormState = { ok?: string; error?: string } | null;

const MAX_UPLOAD = 6 * 1024 * 1024;

// ---------- utilitaires ----------

function text(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function int(fd: FormData, key: string) {
  const v = text(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`« ${key} » doit être un nombre.`);
  return n;
}

async function adminDb() {
  if (!(await currentAdmin())) throw new Error("Session expirée : reconnecte-toi.");
  return supabaseServer();
}

/** Toutes les pages publiques se recalculent après une modification. */
function publish() {
  revalidatePath("/", "layout");
}

async function run(fn: () => Promise<string>): Promise<FormState> {
  try {
    const ok = await fn();
    publish();
    return { ok };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}

function check<T>(res: { error: { message: string } | null; data?: T | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Envoie une image dans le bucket `media` et renvoie son URL publique, ou null si aucun fichier. */
async function upload(db: Awaited<ReturnType<typeof supabaseServer>>, file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Le fichier doit être une image.");
  if (file.size > MAX_UPLOAD) throw new Error("Image trop lourde (6 Mo max).");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  check(await db.storage.from("media").upload(path, file, { contentType: file.type, upsert: false }));
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Aligne une liste « promos d'une édition » sur la sélection : n'ajoute et ne retire que la différence. */
async function syncPromos(
  db: Awaited<ReturnType<typeof supabaseServer>>,
  table: "edition_teams" | "semifinalists",
  year: number,
  chosen: number[],
) {
  const current = check<{ promo: number }[]>(await db.from(table).select("promo").eq("edition_year", year)).map((r) => r.promo);
  const added = chosen.filter((p) => !current.includes(p));
  const removed = current.filter((p) => !chosen.includes(p));
  if (added.length) check(await db.from(table).insert(added.map((promo) => ({ edition_year: year, promo }))));
  if (removed.length) check(await db.from(table).delete().eq("edition_year", year).in("promo", removed));
}

// ---------- session ----------

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const db = await supabaseServer();
  // On se connecte avec un identifiant (« Melv2412 ») : Supabase attend un e-mail,
  // d'où une adresse technique qui ne reçoit jamais de courrier.
  const login = String(fd.get("login") ?? "").trim().toLowerCase();
  const { error } = await db.auth.signInWithPassword({
    email: login.includes("@") ? login : `${login}@admin.ebl.local`,
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "Identifiant ou mot de passe incorrect." };
  if (!(await currentAdmin())) {
    await db.auth.signOut();
    return { error: "Ce compte n'a pas les droits d'administration." };
  }
  redirect("/admin");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await currentAdmin();
  if (!admin?.email) return { error: "Session expirée : reconnecte-toi." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 10) return { error: "Le nouveau mot de passe doit faire au moins 10 caractères." };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  if (next === current) return { error: "Le nouveau mot de passe doit être différent de l'ancien." };

  const db = await supabaseServer();
  // On revérifie l'ancien mot de passe : une session ouverte sur un téléphone prêté ne suffit pas.
  const { error: wrong } = await db.auth.signInWithPassword({ email: admin.email, password: current });
  if (wrong) return { error: "Mot de passe actuel incorrect." };
  const { error } = await db.auth.updateUser({ password: next });
  if (error) return { error: error.message };
  return { ok: "Mot de passe changé." };
}

export async function signOut() {
  const db = await supabaseServer();
  await db.auth.signOut();
  redirect("/admin/connexion");
}

// ---------- éditions ----------

export async function saveEdition(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const start_year = int(fd, "start_year");
    if (!start_year) throw new Error("Année de début obligatoire.");
    const row = {
      start_year,
      status: text(fd, "status") ?? "a_completer",
      final_date: text(fd, "final_date"),
      final_time: text(fd, "final_time"),
      venue: text(fd, "venue"),
      summary: text(fd, "summary"),
    };
    if (fd.get("mode") === "create") {
      const res = await db.from("editions").insert(row);
      if (res.error?.code === "23505") throw new Error(`L'édition ${start_year} existe déjà.`);
      check(res);
      return "Édition créée.";
    }
    check(await db.from("editions").update(row).eq("start_year", start_year));
    return "Édition enregistrée.";
  });
}

export async function deleteEdition(fd: FormData) {
  const db = await adminDb();
  check(await db.from("editions").delete().eq("start_year", int(fd, "start_year")));
  publish();
  redirect("/admin");
}

// ---------- séries (poule, demi, finale) ----------

/** Manches saisies (score_a_1, score_b_1, …) : seules les manches complètes comptent. */
function gamesFrom(fd: FormData, bestOf: number) {
  const games: { game_no: number; score_a: number; score_b: number }[] = [];
  for (let n = 1; n <= bestOf; n++) {
    const a = int(fd, `score_a_${n}`);
    const b = int(fd, `score_b_${n}`);
    if (a === null && b === null) continue;
    if (a === null || b === null) throw new Error(`Manche ${n} : il manque un des deux scores.`);
    if (a < 0 || b < 0) throw new Error(`Manche ${n} : score négatif.`);
    if (a === b) throw new Error(`Manche ${n} : pas de match nul au basket.`);
    games.push({ game_no: n, score_a: a, score_b: b });
  }
  return games;
}

export async function saveSeries(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const id = int(fd, "id");
    const promo_a = int(fd, "promo_a");
    const promo_b = int(fd, "promo_b");
    const best_of = int(fd, "best_of") ?? 1;
    const edition_year = int(fd, "edition_year");
    const round = text(fd, "round");
    const need = Math.ceil(best_of / 2);

    if (!promo_a || !promo_b || promo_a === promo_b) throw new Error("Choisis deux promos différentes.");

    const games = gamesFrom(fd, best_of);
    let winner: number | null;
    let wins_a: number | null;
    let wins_b: number | null;

    if (games.length > 0) {
      // Le résultat se déduit des manches.
      wins_a = 0;
      wins_b = 0;
      for (const g of games) {
        if (wins_a >= need || wins_b >= need) throw new Error("Une manche est saisie après la fin de la série.");
        if (g.score_a > g.score_b) wins_a++;
        else wins_b++;
      }
      winner = wins_a >= need ? promo_a : wins_b >= need ? promo_b : null;
    } else {
      // Pas de score connu (archives) : vainqueur et manches saisis à la main.
      const side = text(fd, "winner_side");
      winner = side === "a" ? promo_a : side === "b" ? promo_b : null;
      wins_a = int(fd, "wins_a");
      wins_b = int(fd, "wins_b");
      if (wins_a !== null && wins_b !== null) {
        if (Math.max(wins_a, wins_b) > need) throw new Error(`Au meilleur des ${best_of}, on gagne au plus ${need} manches.`);
        if (winner !== null && (winner === promo_a ? wins_a <= wins_b : wins_b <= wins_a))
          throw new Error("Les manches ne correspondent pas au vainqueur choisi.");
      }
    }

    const row = { edition_year, round, promo_a, promo_b, winner, wins_a, wins_b, best_of, match_date: text(fd, "match_date") };
    let seriesId = id;
    if (id) check(await db.from("series").update(row).eq("id", id));
    else seriesId = check<{ id: number }>(await db.from("series").insert(row).select("id").single()).id;

    // Seules les manches qui changent sont écrites (le journal reste lisible).
    if (games.length) {
      check(
        await db
          .from("games")
          .upsert(games.map((g) => ({ ...g, series_id: seriesId })), { onConflict: "series_id,game_no" }),
      );
    }
    let stale = db.from("games").delete().eq("series_id", seriesId);
    if (games.length) stale = stale.not("game_no", "in", `(${games.map((g) => g.game_no).join(",")})`);
    check(await stale);

    // Une finale décidée clôt l'édition.
    if (round === "finale" && winner !== null) {
      check(await db.from("editions").update({ status: "terminee" }).eq("start_year", edition_year));
      return "Finale enregistrée : l'édition est terminée et l'accueil affiche le champion.";
    }
    if (winner === null && games.length > 0) return `Enregistré : ${wins_a}-${wins_b}, série en cours.`;
    return "Match enregistré.";
  });
}

export async function deleteSeries(fd: FormData) {
  const db = await adminDb();
  check(await db.from("series").delete().eq("id", int(fd, "id")));
  publish();
}

// ---------- saison : équipes, poule, phase finale ----------

export async function saveTeams(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const chosen = fd.getAll("promo").map((v) => Number(v)).filter(Number.isFinite);
    await syncPromos(db, "edition_teams", year, chosen);
    return `${chosen.length} équipe${chosen.length > 1 ? "s" : ""} inscrite${chosen.length > 1 ? "s" : ""}.`;
  });
}

/** Demi-finalistes connus sans le détail de la série (archives). */
export async function saveSemifinalists(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const chosen = fd.getAll("semi").map((v) => Number(v)).filter(Number.isFinite);
    await syncPromos(db, "semifinalists", year, chosen);
    return "Demi-finalistes enregistrés.";
  });
}

/** Crée les matchs de poule manquants : chaque équipe inscrite contre chacune des autres. */
export async function generatePoule(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const teams = check<{ promo: number }[]>(await db.from("edition_teams").select("promo").eq("edition_year", year))
      .map((t) => t.promo)
      .sort((a, b) => a - b);
    if (teams.length < 2) throw new Error("Inscris au moins deux équipes.");
    const existing = check<{ promo_a: number; promo_b: number }[]>(
      await db.from("series").select("promo_a, promo_b").eq("edition_year", year).eq("round", "poule"),
    );
    const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const done = new Set(existing.map((s) => key(s.promo_a, s.promo_b)));
    const rows = [];
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++)
        if (!done.has(key(teams[i], teams[j])))
          rows.push({ edition_year: year, round: "poule", promo_a: teams[i], promo_b: teams[j], best_of: 1 });
    if (rows.length === 0) return "Tous les matchs de poule existent déjà.";
    check(await db.from("series").insert(rows));
    return `${rows.length} match${rows.length > 1 ? "s" : ""} de poule créé${rows.length > 1 ? "s" : ""}.`;
  });
}

/** Demies au meilleur des 3 : 1er contre 4e, 2e contre 3e (classement passé par le formulaire). */
export async function createSemis(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const seeds = [1, 2, 3, 4].map((n) => int(fd, `seed_${n}`));
    if (seeds.some((s) => s === null) || new Set(seeds).size !== 4) throw new Error("Il faut 4 équipes différentes.");
    const [s1, s2, s3, s4] = seeds as number[];
    const already = check<unknown[]>(await db.from("series").select("id").eq("edition_year", year).eq("round", "demi"));
    if (already.length) throw new Error("Les demies existent déjà.");
    check(
      await db.from("series").insert([
        { edition_year: year, round: "demi", promo_a: s1, promo_b: s4, best_of: 3 },
        { edition_year: year, round: "demi", promo_a: s2, promo_b: s3, best_of: 3 },
      ]),
    );
    return "Demi-finales créées.";
  });
}

/** Finale en match sec entre les vainqueurs des demies. */
export async function createFinal(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const semis = check<{ winner: number | null }[]>(
      await db.from("series").select("winner").eq("edition_year", year).eq("round", "demi").order("id"),
    );
    const winners = semis.map((s) => s.winner).filter((w): w is number => w !== null);
    if (winners.length !== 2) throw new Error("Les deux demies doivent être terminées.");
    const already = check<unknown[]>(await db.from("series").select("id").eq("edition_year", year).eq("round", "finale"));
    if (already.length) throw new Error("La finale existe déjà.");
    check(await db.from("series").insert({ edition_year: year, round: "finale", promo_a: winners[0], promo_b: winners[1], best_of: 1 }));
    return "Finale créée.";
  });
}

// ---------- promos ----------

export async function savePromo(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const number = int(fd, "number");
    const entry_year = int(fd, "entry_year");
    if (!number || !entry_year) throw new Error("Numéro et année d'entrée obligatoires.");
    const logo = await upload(db, fd.get("logo"), `promos/it${number}`);
    const teamPhoto = await upload(db, fd.get("team_photo"), `equipes/it${number}`);
    const row: Record<string, unknown> = {
      number,
      name: text(fd, "name"),
      entry_year,
      color_primary: text(fd, "color_primary") ?? "#1b2a33",
      color_secondary: text(fd, "color_secondary") ?? "#2aa7c9",
    };
    if (logo) row.logo_url = logo;
    if (fd.get("remove_logo") === "on") row.logo_url = null;
    if (teamPhoto) row.team_photo_url = teamPhoto;
    if (fd.get("remove_team_photo") === "on") row.team_photo_url = null;
    if (fd.get("mode") === "create") {
      const res = await db.from("promos").insert(row);
      if (res.error?.code === "23505") throw new Error(`IT${number} existe déjà.`);
      check(res);
      return `IT${number} créée.`;
    }
    check(await db.from("promos").update(row).eq("number", number));
    return `IT${number} enregistrée.`;
  });
}

// ---------- joueurs ----------

export async function savePlayer(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const id = int(fd, "id");
    const promo = int(fd, "promo");
    const full_name = text(fd, "full_name");
    if (!full_name || !promo) throw new Error("Nom et promo obligatoires.");
    const photo = await upload(db, fd.get("photo"), `joueurs/it${promo}`);
    const row: Record<string, unknown> = {
      full_name,
      promo,
      position: text(fd, "position"),
      is_captain: fd.get("is_captain") === "on",
      is_starter: fd.get("is_starter") === "on",
    };
    if (row.is_starter) {
      let q = db.from("players").select("id", { count: "exact", head: true }).eq("promo", promo).eq("is_starter", true);
      if (id) q = q.neq("id", id);
      const { count, error } = await q;
      if (error) throw new Error(error.message);
      if ((count ?? 0) >= 5) throw new Error("Le 5 de départ est déjà complet : retire d'abord un autre joueur.");
    }
    if (photo) row.photo_url = photo;
    if (fd.get("remove_photo") === "on") row.photo_url = null;
    if (id) check(await db.from("players").update(row).eq("id", id));
    else check(await db.from("players").insert(row));
    return `${full_name} enregistré.`;
  });
}

export async function deletePlayer(fd: FormData) {
  const db = await adminDb();
  check(await db.from("players").delete().eq("id", int(fd, "id")));
  publish();
}

// ---------- distinctions ----------

export async function addAward(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const player_id = int(fd, "player_id");
    if (!player_id) throw new Error("Choisis un joueur.");
    check(
      await db.from("awards").insert({ edition_year: int(fd, "edition_year"), type: text(fd, "type"), player_id }),
    );
    return "Distinction ajoutée.";
  });
}

// ---------- historique ----------

/** Ordre parent → enfant : on recrée les parents avant les enfants, et on supprime dans l'autre sens. */
const TABLE_ORDER = ["promos", "editions", "players", "series", "games", "awards", "edition_teams", "semifinalists"];

/** Annule une ou plusieurs lignes du journal (une action entière). */
export async function restoreEntries(fd: FormData) {
  const db = await adminDb();
  const ids = String(fd.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter(Number.isFinite);
  const rows = check<{ id: number; table_name: string; action: string }[]>(
    await db.from("audit_log").select("id, table_name, action").in("id", ids),
  );
  const rank = (t: string) => TABLE_ORDER.indexOf(t);
  const step = { insert: 0, update: 1, delete: 2 } as Record<string, number>;
  rows.sort(
    (a, b) =>
      step[a.action] - step[b.action] ||
      // Ajouts annulés = suppressions : les enfants d'abord. Suppressions annulées = recréations : les parents d'abord.
      (a.action === "insert" ? rank(b.table_name) - rank(a.table_name) : rank(a.table_name) - rank(b.table_name)) ||
      b.id - a.id,
  );
  for (const r of rows) {
    const { error } = await db.rpc("audit_restore", { log_id: r.id });
    if (error && !/Déjà annulée/.test(error.message)) throw new Error(error.message);
  }
  publish();
}

export async function updateAward(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const id = int(fd, "id");
    const player_id = int(fd, "player_id");
    if (!id || !player_id) throw new Error("Choisis un joueur.");
    check(await db.from("awards").update({ type: text(fd, "type"), player_id }).eq("id", id));
    return "Distinction modifiée.";
  });
}

export async function deleteAward(fd: FormData) {
  const db = await adminDb();
  check(await db.from("awards").delete().eq("id", int(fd, "id")));
  publish();
}

// ---------- All-EBL Team ----------

/** Le champ datetime-local est saisi à l'heure d'Abidjan, qui est UTC toute l'année. */
function utc(local: string | null) {
  return local ? new Date(`${local}:00Z`).toISOString() : null;
}

export async function saveAllEblSettings(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const opens = utc(text(fd, "opens_at"));
    const closes = utc(text(fd, "closes_at"));
    if (opens && closes && closes <= opens) throw new Error("La fermeture doit être après l'ouverture.");
    check(
      await db
        .from("editions")
        .update({ allebl_opens_at: opens, allebl_closes_at: closes, allebl_published: fd.get("published") === "on" })
        .eq("start_year", year),
    );
    return "Réglages du vote enregistrés.";
  });
}

export async function saveCandidates(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const year = int(fd, "edition_year")!;
    const wanted = new Set(fd.getAll("cand").map(String)); // « playerId:side »
    const current = check<{ player_id: number; side: string }[]>(
      await db.from("allebl_candidates").select("player_id, side").eq("edition_year", year),
    );
    const have = new Set(current.map((c) => `${c.player_id}:${c.side}`));
    const added = [...wanted].filter((k) => !have.has(k));
    const removed = [...have].filter((k) => !wanted.has(k));
    if (added.length) {
      check(
        await db.from("allebl_candidates").insert(
          added.map((k) => {
            const [player_id, side] = k.split(":");
            return { edition_year: year, player_id: Number(player_id), side };
          }),
        ),
      );
    }
    for (const k of removed) {
      const [player_id, side] = k.split(":");
      check(await db.from("allebl_candidates").delete().eq("edition_year", year).eq("player_id", Number(player_id)).eq("side", side));
    }
    const ext = [...wanted].filter((k) => k.endsWith(":ext")).length;
    const intr = [...wanted].filter((k) => k.endsWith(":int")).length;
    const warn = ext < 3 || intr < 2 ? " Attention : il faut au moins 3 extérieurs et 2 intérieurs." : "";
    return `${ext} extérieurs, ${intr} intérieurs.${warn}`;
  });
}

/** Crée (ou remplace) le lien secret du capitaine d'une promo. L'ancien lien cesse de marcher. */
export async function newCaptainLink(fd: FormData) {
  const db = await adminDb();
  const year = int(fd, "edition_year")!;
  const promo = int(fd, "promo")!;
  const { randomBytes } = await import("node:crypto");
  check(await db.from("allebl_captain_links").delete().eq("edition_year", year).eq("promo", promo));
  check(await db.from("allebl_captain_links").insert({ code: randomBytes(9).toString("base64url"), edition_year: year, promo }));
  publish();
}

/** Annule (ou rétablit) les bulletins du public venant d'une même empreinte réseau. */
export async function voidBallots(fd: FormData) {
  const db = await adminDb();
  const year = int(fd, "edition_year")!;
  const ip = text(fd, "ip_hash");
  const voided = fd.get("voided") === "true";
  let q = db.from("allebl_votes").update({ voided }).eq("edition_year", year);
  q = ip ? q.eq("ip_hash", ip) : q.is("ip_hash", null);
  check(await q);
  publish();
}

/** Efface tous les votes d'une édition (après les tests) et rend leurs liens aux capitaines. */
export async function resetVotes(fd: FormData) {
  const db = await adminDb();
  const year = int(fd, "edition_year")!;
  check(await db.from("allebl_votes").delete().eq("edition_year", year));
  check(await db.from("allebl_captain_votes").delete().eq("edition_year", year));
  check(await db.from("allebl_captain_links").update({ used_at: null }).eq("edition_year", year));
  publish();
}
