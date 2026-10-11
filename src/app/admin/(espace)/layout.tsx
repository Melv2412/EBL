import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/supabase-server";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/connexion");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-4">
        <Link href="/admin" className="font-display text-xl font-bold uppercase">
          Admin EBL
        </Link>
        <nav className="flex gap-3 text-sm font-medium text-ink-soft">
          <Link href="/admin" className="hover:text-teal">
            Éditions
          </Link>
          <Link href="/admin/promos" className="hover:text-teal">
            Promos et joueurs
          </Link>
        </nav>
        <form action={signOut} className="ml-auto">
          <button className="text-sm text-ink-soft hover:text-ink">Déconnexion ({admin.user_metadata.username ?? admin.email})</button>
        </form>
      </div>
      {children}
    </div>
  );
}
