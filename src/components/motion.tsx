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
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
