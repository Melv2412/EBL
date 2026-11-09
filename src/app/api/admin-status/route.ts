import { currentAdmin } from "@/lib/supabase-server";

// Pour la barre admin du site public : les pages restent en cache, la vérification se fait ici.
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await currentAdmin();
  return Response.json({ admin: !!admin }, { headers: { "cache-control": "no-store" } });
}
