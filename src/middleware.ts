import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase sur les pages admin.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse(
      "Admin indisponible : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY manquent dans les variables d'environnement.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await db.auth.getUser();

  const isLogin = request.nextUrl.pathname === "/admin/connexion";
  if (!user && !isLogin) {
    return NextResponse.redirect(new URL("/admin/connexion", request.url));
  }
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
