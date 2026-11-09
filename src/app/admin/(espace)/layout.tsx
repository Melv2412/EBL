import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/supabase-server";
import { AdminSidebar } from "../admin-sidebar";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/connexion");

  return (
    <div className="md:flex">
      <AdminSidebar username={admin.user_metadata.username ?? admin.email ?? "admin"} />
      <div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-6">{children}</div>
    </div>
  );
}
