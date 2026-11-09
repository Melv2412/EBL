import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { HomeSlide } from "./home-slides";

export type HomeMode = "auto" | "final" | "champion" | "slideshow";
export type HomeSettings = { mode: HomeMode; slide_order: string[]; slides: HomeSlide[] | null };

export function isHomeMode(mode: string): mode is HomeMode {
  return ["auto", "final", "champion", "slideshow"].includes(mode);
}

export const getHomeSettings = cache(async (): Promise<{ settings: HomeSettings; ready: boolean; imagesReady: boolean }> => {
  const fallback = { settings: { mode: "auto" as const, slide_order: [], slides: null }, ready: false, imagesReady: false };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("homepage_settings").select("*").eq("id", true).maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return fallback;
    throw new Error(`Accueil : ${error.message}`);
  }
  if (!data) return fallback;
  return {
    settings: { mode: isHomeMode(data.mode) ? data.mode : "auto", slide_order: data.slide_order ?? [], slides: data.slides ?? null },
    ready: true,
    imagesReady: "slides" in data,
  };
});