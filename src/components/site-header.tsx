"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidingPill } from "./sliding-pill";
import { ThemeToggle } from "./theme-toggle";

/** `match` : préfixes d'URL qui rendent l'onglet actif (par défaut son lien). `exact` : le lien seul, sans ses sous-pages.
 * `wide` : seulement sur grand écran (le lien reste dans le pied de page). */
type NavItem = { href: string; label: string; match?: string[]; exact?: boolean; live?: boolean; wide?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Accueil", exact: true },
  { href: "/editions", label: "Éditions" },
  { href: "/promos", label: "Promos" },
  { href: "/a-propos", label: "À propos" },
];

export type AllEblLink = { href: string; live: boolean } | null;

export function SiteHeader({ allEbl }: { allEbl: AllEblLink }) {
  const items = [...NAV];
  if (allEbl) {
    // Cinq onglets ne tiennent pas sur un téléphone : « À propos » laisse sa place.
    items.splice(3, 1, { href: allEbl.href, label: "All-EBL", match: ["/all-ebl", "/vote"], live: allEbl.live }, { ...items[3], wide: true });
  }
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    (item.exact && pathname === item.href) ||
    (item.match ?? (item.exact ? [] : [item.href])).some((m) => pathname.startsWith(m));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ESATIC Basket League, accueil">
          <Image src="/logos/ebl.jpeg" alt="" width={40} height={40} className="rounded-full bg-white" priority />
          <span className="hidden font-display text-xl font-bold uppercase leading-none tracking-wide min-[420px]:block">
            EBL
            <span className="hidden text-xs font-medium tracking-[0.2em] text-white/60 sm:block">
              ESATIC Basket League
            </span>
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="ml-auto min-w-0 overflow-x-auto">
          <ul className="relative flex gap-0 text-sm font-medium min-[420px]:gap-1">
            <SlidingPill deps={pathname} className="rounded-md bg-white/10" />
            {items.map((item) => (
              <li key={item.href} data-tab data-active={isActive(item)} className={item.wide ? "hidden sm:block" : undefined}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={`relative flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-2 text-[0.8rem] transition-colors duration-300 min-[420px]:px-2 min-[420px]:text-sm sm:px-3 ${
                    isActive(item) ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.live && (
                    <>
                      <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                      <span className="sr-only">, vote ouvert</span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
