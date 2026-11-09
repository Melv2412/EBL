"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** La page admin qui modifie la page publique affichée, s'il y en a une. */
function editHref(pathname: string) {
  const edition = pathname.match(/^\/editions\/(\d{4})/);
  if (edition) return `/admin/editions/${edition[1]}`;
  const promo = pathname.match(/^\/promos\/it(\d+)/i);
  if (promo) return `/admin/promos/${promo[1]}`;
  return null;
}

/**
 * Bandeau visible seulement par un admin connecté, sur le site public.
 * On ne questionne le serveur que si un cookie de session Supabase existe : les visiteurs ne paient rien.
 */
export function AdminBar() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(false);
  const inAdmin = pathname.startsWith("/admin");

  // Revérifié en sortant de l'admin : connexion ou déconnexion à l'instant.
  useEffect(() => {
    if (inAdmin) return;
    if (!/(^|; )sb-[^=]+-auth-token/.test(document.cookie)) return setAdmin(false);
    fetch("/api/admin-status")
      .then((r) => r.json())
      .then((x: { admin: boolean }) => setAdmin(x.admin))
      .catch(() => {});
  }, [inAdmin]);

  if (!admin || inAdmin) return null;
  const edit = editHref(pathname);

  return (
    <div className="bg-gold text-night">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs font-semibold sm:text-sm">
        <span className="uppercase tracking-[0.15em]">Mode admin</span>
        <span className="ml-auto flex gap-4">
          {edit && (
            <Link href={edit} className="underline-offset-2 hover:underline">
              Modifier cette page →
            </Link>
          )}
          <Link href="/admin" className="underline-offset-2 hover:underline">
            Ouvrir l&apos;admin →
          </Link>
        </span>
      </div>
    </div>
  );
}
