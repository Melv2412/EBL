import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/supabase-server";
import { signIn } from "../actions";
import { ActionForm, inputCls, labelCls } from "../form";

export const metadata: Metadata = { title: "Connexion admin", robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase">Espace admin</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Réservé à la gestion du site EBL.</p>
      <ActionForm action={signIn} submit="Se connecter">
        <label className={labelCls}>
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Mot de passe</span>
          <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
        </label>
      </ActionForm>
    </div>
  );
}
