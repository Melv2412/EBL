"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Révèle les éléments `[data-reveal]` quand ils entrent à l'écran.
 * Sans JS, la classe `js` n'est pas posée et tout reste visible.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const pending = () => document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      pending().forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px 10% 0px", threshold: 0 },
    );
    pending().forEach((el) => io.observe(el));

    // Défilement rapide : tout ce qui est déjà passé au-dessus du bas de l'écran s'affiche.
    let frame = 0;
    const catchUp = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        pending().forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("is-visible");
            io.unobserve(el);
          }
        });
      });
    };
    window.addEventListener("scroll", catchUp, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", catchUp);
    };
  }, [pathname]);

  return null;
}
