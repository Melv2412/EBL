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

function check<T>(res: { error: { message: string } | null; data?: T }) {
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

// ---------- session ----------

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "E-mail ou mot de passe incorrect." };
  if (!(await currentAdmin())) {
    await db.auth.signOut();
    return { error: "Ce compte n'a pas les droits d'administration." };
  }
  redirect("/admin");
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

// ---------- séries (demi, finale) ----------

export async function saveSeries(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const id = int(fd, "id");
    const promo_a = int(fd, "promo_a");
    const promo_b = int(fd, "promo_b");
    const side = text(fd, "winner_side");
    const winner = side === "a" ? promo_a : side === "b" ? promo_b : null;
    const wins_a = int(fd, "wins_a");
    const wins_b = int(fd, "wins_b");
    const best_of = int(fd, "best_of") ?? 3;
    const edition_year = int(fd, "edition_year");
    const round = text(fd, "round");

    if (!promo_a || !promo_b || promo_a === promo_b) throw new Error("Choisis deux promos différentes.");
    if (winner !== null && winner !== promo_a && winner !== promo_b) throw new Error("Le vainqueur doit être l'une des deux promos.");
    if (wins_a !== null && wins_b !== null) {
      if (Math.max(wins_a, wins_b) > Math.ceil(best_of / 2)) throw new Error(`Au meilleur des ${best_of}, on gagne au plus ${Math.ceil(best_of / 2)} manches.`);
      if (winner !== null && (winner === promo_a ? wins_a <= wins_b : wins_b <= wins_a))
        throw new Error("Le score ne correspond pas au vainqueur choisi.");
    }

    const row = { edition_year, round, promo_a, promo_b, winner, wins_a, wins_b, best_of };
    if (id) check(await db.from("series").update(row).eq("id", id));
    else check(await db.from("series").insert(row));

    // Une finale décidée clôt l'édition.
    if (round === "finale" && winner !== null) {
      check(await db.from("editions").update({ status: "terminee" }).eq("start_year", edition_year));
    }
    return winner !== null && round === "finale" ? "Finale enregistrée, l'édition est terminée." : "Série enregistrée.";
  });
}

export async function deleteSeries(fd: FormData) {
  const db = await adminDb();
  check(await db.from("series").delete().eq("id", int(fd, "id")));
  publish();
}

// ---------- promos ----------

export async function savePromo(_: FormState, fd: FormData) {
  return run(async () => {
    const db = await adminDb();
    const number = int(fd, "number");
    const entry_year = int(fd, "entry_year");
    if (!number || !entry_year) throw new Error("Numéro et année d'entrée obligatoires.");
    const logo = await upload(db, fd.get("logo"), `promos/it${number}`);
    const row: Record<string, unknown> = {
      number,
      name: text(fd, "name"),
      entry_year,
      color_primary: text(fd, "color_primary") ?? "#1b2a33",
      color_secondary: text(fd, "color_secondary") ?? "#2aa7c9",
    };
    if (logo) row.logo_url = logo;
    if (fd.get("remove_logo") === "on") row.logo_url = null;
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
    const row: Record<string, unknown> = { full_name, promo, position: text(fd, "position") };
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

export async function deleteAward(fd: FormData) {
  const db = await adminDb();
  check(await db.from("awards").delete().eq("id", int(fd, "id")));
  publish();
}
