"use server";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

export type VoteState = { ok?: string; error?: string } | null;

const COOKIE = "ebl_voter";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

function ids(fd: FormData, key: string) {
  return fd
    .getAll(key)
    .map((v) => Number(v))
    .filter(Number.isFinite);
}

/** Message lisible à partir d'une erreur de la base (les fonctions SQL lèvent des messages en français). */
function readable(message: string) {
  return message.replace(/^.*?ERROR:\s*/, "");
}

/** Identifiant anonyme de l'appareil : un cookie posé au premier vote, gardé un an. */
async function deviceId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;
  const id = randomBytes(18).toString("hex");
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365, path: "/" });
  return id;
}

/** Empreinte de l'adresse IP (jamais stockée en clair), pour repérer les rafales de votes. */
async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  return createHash("sha256").update(`ebl:${ip}`).digest("hex").slice(0, 16);
}

export async function publicVote(_: VoteState, fd: FormData): Promise<VoteState> {
  const year = Number(fd.get("edition_year"));
  const { error } = await db().rpc("allebl_vote", {
    y: year,
    device_id: await deviceId(),
    ip: await ipHash(),
    e: ids(fd, "ext"),
    i: ids(fd, "int"),
  });
  if (error) {
    if (/déjà voté/.test(error.message)) await markVoted(year);
    return { error: readable(error.message) };
  }
  await markVoted(year);
  return { ok: "Merci, ton vote est enregistré !" };
}

export async function captainVote(_: VoteState, fd: FormData): Promise<VoteState> {
  const { error } = await db().rpc("allebl_captain_vote", {
    c: String(fd.get("code") ?? ""),
    e: ids(fd, "ext"),
    i: ids(fd, "int"),
  });
  if (error) return { error: readable(error.message) };
  return { ok: "Merci capitaine, ton vote est enregistré !" };
}

async function markVoted(year: number) {
  const jar = await cookies();
  jar.set(`${COOKIE}_done`, String(year), { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365, path: "/" });
}

/** A-t-on déjà voté pour cette édition depuis cet appareil ? (affichage seulement : la base fait foi) */
export async function hasVoted(year: number) {
  const jar = await cookies();
  return jar.get(`${COOKIE}_done`)?.value === String(year);
}
