import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase lié à la session de l'admin (cookies). Les règles RLS font le reste. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le middleware rafraîchit déjà la session.
        }
      },
    },
  });
}

/** L'utilisateur connecté s'il est admin, sinon null. */
export async function currentAdmin() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}
