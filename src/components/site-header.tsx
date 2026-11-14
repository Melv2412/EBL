"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlidingPill } from "./sliding-pill";
import { ThemeToggle } from "./theme-toggle";

/** `match` : préfixes d'URL qui rendent l'onglet actif (par défaut son lien). `exact` : le lien seul, sans ses sous-pages. */
type NavItem = { href: string; label: string; match?: string[]; exact?: boolean; live?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Accueil", exact: true },
  { href: "/editions", label: "Éditions" },
  { href: "/promos", label: "Promos" },
  { href: "/vote", label: "Voter", exact: true },
  { href: "/all-star", label: "All-Star" },
  { href: "/a-propos", label: "À propos" },
];

export type AllEblLink = { href: string; live: boolean } | null;

export function SiteHeader({ allEbl }: { allEbl: AllEblLink }) {
  const items = NAV.map((item) => item.href === "/vote" ? { ...item, live: allEbl?.live } : item);
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    (item.exact && pathname === item.href) ||
    (item.match ?? (item.exact ? [] : [item.href])).some((m) => pathname.startsWith(m));

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <AdminSiteHeader key={pathname} items={items} />;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ESATIC Basket League, accueil">
          <Image src="/logos/ebl.jpeg" alt="" width={40} height={40} className="rounded-full bg-white" priority />
          <span className="font-display text-xl font-bold uppercase leading-none tracking-wide">
            EBL
            <span className="hidden text-xs font-medium tracking-[0.2em] text-white/60 lg:block">ESATIC Basket League</span>
          </span>
        </Link>
        {/* Grand écran : les onglets. Mobile : bouton menu (voir MenuDrawer). */}
        <nav aria-label="Navigation principale" className="ml-auto hidden min-w-0 md:block">
          <ul className="relative flex gap-1 text-sm font-medium">
            <SlidingPill deps={pathname} className="rounded-md bg-white/10" />
            {items.map((item) => (
              <li key={item.href} data-tab data-active={isActive(item)}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={`relative flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 transition-colors duration-300 lg:px-3 ${
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
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <ThemeToggle />
          <MenuDrawer
            title="Menu"
            items={items}
            isActive={isActive}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                aria-label="Ouvrir le menu"
                className="relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                {items.some((i) => i.live) && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />}
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}

/** Tiroir de navigation : menu mobile du site, et lien « Site public » de l'admin. */
function MenuDrawer({
  title,
  items,
  isActive,
  trigger,
}: {
  title: string;
  items: NavItem[];
  isActive?: (item: NavItem) => boolean;
  trigger: (open: () => void, isOpen: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true), open)}
      <dialog
        ref={dialogRef}
        aria-label={title}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-80 max-w-[calc(100vw-2rem)] border-l border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line p-4">
            <p className="font-display text-xl font-bold uppercase">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              Fermer
            </button>
          </div>
          <nav aria-label={title} className="p-3">
            <ul className="space-y-1">
              {items.map((item) => {
                const active = isActive?.(item) ?? false;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-base font-medium ${
                        active ? "bg-teal-soft text-teal-strong" : "hover:bg-teal-soft hover:text-teal-strong"
                      }`}
                    >
                      {item.label}
                      {item.live && (
                        <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-night">Vote ouvert</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}

function AdminSiteHeader({ items }: { items: NavItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night text-white">
      <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="EBL, administration">
          <Image src="/logos/ebl.jpeg" alt="" width={36} height={36} className="rounded-full bg-white" priority />
          <span className="font-display text-lg font-bold uppercase">EBL <span className="text-gold">Admin</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <MenuDrawer
            title="Site public"
            items={items}
            trigger={(open, isOpen) => (
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={open}
                className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Site public
              </button>
            )}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
