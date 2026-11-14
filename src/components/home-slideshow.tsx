"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomeSlide } from "@/lib/home-slides";

const INTERVAL = 5000;

type Cta = { href: string; label: string };

/**
 * Haut de l'accueil hors finale / champion : photos en fondu, avec le nom de la ligue,
 * une phrase et des boutons par-dessus. Seules la photo affichée et la suivante sont chargées.
 */
export function HomeSlideshow({ slides, primary, secondary }: { slides: HomeSlide[]; primary: Cta; secondary: Cta }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive((current) => (current + 1) % slides.length), INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  const next = (active + 1) % Math.max(slides.length, 1);

  return (
    <section className="relative isolate flex h-[min(56svh,26rem)] min-h-72 items-end overflow-hidden bg-night text-white sm:h-[min(70svh,40rem)]">
      {/* Photos d'ambiance : décoratives, le texte porte le sens. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {slides.map((slide, index) =>
          index === active || index === next ? (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
                style={{ objectPosition: `${slide.position?.x ?? 50}% ${slide.position?.y ?? 50}%` }}
              />
            </div>
          ) : null,
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/20" />
      </div>
      <div aria-hidden="true" className="court-lines pointer-events-none absolute inset-0 z-10" />

      <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pb-8 sm:pb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal">Ligue inter-promos · depuis 2019</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-7xl">ESATIC Basket League</h1>
        <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-lg">
          Une promo, une équipe. Les éditions, les finales, les MVP et le parcours de chaque promo, de la L1 au M2.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-strong"
          >
            {primary.label}
          </Link>
          <Link
            href={secondary.href}
            className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
