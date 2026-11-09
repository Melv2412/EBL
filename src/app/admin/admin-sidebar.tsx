"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

type Item = { href: string; label: string; short: string; icon: React.ReactNode; exact?: boolean; match?: string };

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV: Item[] = [
  {
    href: "/admin",
    label: "Éditions",
    short: "Éditions",
    exact: true,
    match: "/admin/editions",
    icon: svg("M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"),
  },
  {
    href: "/admin/promos",
    label: "Promos et joueurs",
    short: "Promos",
    icon: svg("M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8"),
  },
  {
    href: "/admin/historique",
    label: "Historique",
    short: "Historique",
    icon: svg("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3"),
  },
  {
    href: "/admin/compte",
    label: "Mon compte",
    short: "Compte",
    icon: svg("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"),
  },
];

const LOGOUT = svg("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9");

/**
 * Menu de l'espace admin, en accent doré pour le distinguer du site public.
 * Ordinateur : rail d'icônes à gauche qui se déplie au survol (ou au clavier) par-dessus le contenu.
 * Mobile : barre d'icônes en bas de l'écran.
 */
export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const isActive = (item: Item) =>
    item.exact ? pathname === item.href || (!!item.match && pathname.startsWith(item.match)) : pathname.startsWith(item.href);

  return (
    <>
      <aside className="group sticky top-[61px] z-30 hidden h-[calc(100dvh-61px)] w-16 shrink-0 self-start md:block">
        <nav
          aria-label="Menu admin"
          className="absolute inset-y-0 left-0 flex w-16 flex-col overflow-hidden border-r border-white/10 bg-night py-4 text-white transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.3,0.7,0.2,1)] group-focus-within:w-60 group-focus-within:shadow-2xl group-hover:w-60 group-hover:shadow-2xl"
        >
          <p className="mb-4 flex h-6 items-center whitespace-nowrap px-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-gold">
            <span className="w-6 text-center">A</span>
            <Fade>dmin EBL</Fade>
          </p>
          <ul className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    className={`relative flex items-center gap-4 whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
                      active ? "bg-white/5 text-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && <span aria-hidden className="absolute inset-y-1 left-0 w-1 rounded-r bg-gold" />}
                    <span className="shrink-0">{item.icon}</span>
                    <Fade>{item.label}</Fade>
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action={signOut} className="border-t border-white/10 pt-2">
            <button
              title={`Se déconnecter (${username})`}
              className="flex w-full items-center gap-4 whitespace-nowrap px-5 py-3 text-left text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="shrink-0">{LOGOUT}</span>
              <Fade>
                Déconnexion
                <span className="block truncate text-xs text-white/40">{username}</span>
              </Fade>
            </button>
          </form>
        </nav>
      </aside>

      <nav
        aria-label="Menu admin"
        data-admin-tabbar
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-night pb-[env(safe-area-inset-bottom)] text-white md:hidden"
      >
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium ${
                active ? "text-gold" : "text-white/60"
              }`}
            >
              {active && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-gold" />}
              {item.icon}
              {item.short}
            </Link>
          );
        })}
        <form action={signOut} className="flex flex-1">
          <button
            aria-label={`Se déconnecter (${username})`}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium text-white/60"
          >
            {LOGOUT}
            Sortir
          </button>
        </form>
      </nav>
    </>
  );
}

/** Libellé masqué quand le rail est replié. */
function Fade({ children }: { children: React.ReactNode }) {
  return (
    <span className="min-w-0 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
      {children}
    </span>
  );
}
