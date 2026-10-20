"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidingPill } from "./sliding-pill";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/editions", label: "Éditions" },
  { href: "/promos", label: "Promos" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

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
            {NAV.map((item) => (
              <li key={item.href} data-tab data-active={isActive(item.href)}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative block whitespace-nowrap rounded-md px-1.5 py-2 text-[0.8rem] transition-colors duration-300 min-[420px]:px-2 min-[420px]:text-sm sm:px-3 ${
                    isActive(item.href) ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
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
