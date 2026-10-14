"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { AwardType, Player, Promo } from "@/lib/types";
import { AwardIcon } from "./award-icon";

/**
 * Effectif sur une seule ligne : on glisse au doigt, ou avec les flèches sur ordinateur.
 * Les cartes s'inclinent à mesure qu'elles s'approchent du bord de l'écran.
 */
export function PlayerRail({
  players,
  promo,
  badges = {},
}: {
  players: Player[];
  promo: Promo;
  /** Distinctions de chaque joueur (id → types), pour la rangée d'icônes. */
  badges?: Record<number, AwardType[]>;
}) {
  const rail = useRef<HTMLUListElement>(null);

  const tilt = useCallback(() => {
    const el = rail.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el.getBoundingClientRect();
    const center = box.left + box.width / 2;
    for (const card of el.querySelectorAll<HTMLElement>("[data-card]")) {
      const r = card.getBoundingClientRect();
      // -1 au bord gauche, 0 au centre, 1 au bord droit.
      const t = Math.max(-1, Math.min(1, (r.left + r.width / 2 - center) / (box.width / 2)));
      const a = Math.abs(t);
      card.style.transform = `perspective(900px) rotateY(${-t * 22}deg) rotateZ(${t * 4}deg) scale(${1 - a * 0.1})`;
      card.style.opacity = String(1 - a * 0.25);
    }
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tilt);
    };
    tilt();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tilt]);

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={rail}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-6 [scrollbar-width:none] sm:px-14 [&::-webkit-scrollbar]:hidden"
        aria-label={`Joueurs de ${promo.name ?? `IT${promo.number}`}`}
      >
        {players.map((pl) => (
          <li
            key={pl.id}
            data-card
            className="w-44 shrink-0 snap-center transition-[transform,opacity] duration-150 ease-out will-change-transform sm:w-52"
          >
            <figure
              className="overflow-hidden rounded-xl border-2 bg-night p-1.5 shadow-lg"
              style={{ borderColor: promo.color_secondary }}
            >
              <div className="relative overflow-hidden rounded-lg">
                {pl.photo_url ? (
                  <Image
                    src={pl.photo_url}
                    alt={pl.full_name}
                    width={320}
                    height={420}
                    sizes="208px"
                    className="aspect-[3/4] w-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="flex aspect-[3/4] items-center justify-center font-display text-5xl font-bold text-white/80"
                    style={{ background: promo.color_primary }}
                    aria-hidden
                  >
                    {pl.full_name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                {pl.is_captain && (
                  <span
                    title="Capitaine"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-night shadow"
                  >
                    C
                  </span>
                )}
              </div>
              <figcaption className="mt-1.5 rounded-md px-2.5 py-2" style={{ background: promo.color_primary }}>
                <p className="truncate font-display text-base font-bold uppercase leading-tight text-white">{pl.full_name}</p>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: promo.color_secondary }}>
                  {pl.position ?? "Joueur"}
                  {pl.is_captain ? " · Capitaine" : ""}
                </p>
                {badges[pl.id]?.length ? (
                  <p className="mt-1 flex flex-wrap gap-1" aria-label="Distinctions">
                    {badges[pl.id].map((t, i) => (
                      <span key={`${t}-${i}`} className="rounded-full bg-white/90 p-0.5">
                        <AwardIcon type={t} size={14} />
                      </span>
                    ))}
                  </p>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {players.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Joueurs précédents"
            className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-xl shadow-md hover:border-teal sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Joueurs suivants"
            className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-xl shadow-md hover:border-teal sm:flex"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
