import { createClient } from "@supabase/supabase-js";

// Appelée chaque jour par une tâche Vercel (vercel.json) : une lecture suffit pour que
// Supabase (offre gratuite) ne mette pas le projet en pause après 7 jours sans activité.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("promos").select("number").limit(1);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 502 });
  return Response.json({ ok: true, at: new Date().toISOString() });
}
