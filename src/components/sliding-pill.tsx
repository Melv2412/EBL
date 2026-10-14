"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Fond qui glisse jusqu'à l'élément actif d'une barre d'onglets.
 * Le conteneur doit être `relative` ; les onglets portent `data-tab` et `data-active` quand ils sont actifs.
 */
export function SlidingPill({ deps, className }: { deps: unknown; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; width: number; top: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const active = parent.querySelector<HTMLElement>("[data-tab][data-active='true']");
      if (!active) return setBox(null);
      setBox({ left: active.offsetLeft, width: active.offsetWidth, top: active.offsetTop, height: active.offsetHeight });
    };
    measure();
    // Pas d'animation au premier affichage : seulement quand l'onglet change.
    const t = requestAnimationFrame(() => setReady(true));
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => {
      cancelAnimationFrame(t);
      ro.disconnect();
    };
  }, [deps]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute ${ready ? "transition-all duration-300 ease-[cubic-bezier(0.3,0.7,0.2,1)]" : ""} ${className}`}
      style={box ? { left: box.left, width: box.width, top: box.top, height: box.height, opacity: 1 } : { opacity: 0 }}
    />
  );
}
