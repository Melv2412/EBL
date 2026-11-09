"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HomeSlide } from "@/lib/home-slides";

export function HomeSlideshow({ slides }: { slides: HomeSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      aria-label="Terrain de basket EBL"
      className="relative isolate h-[min(70svh,40rem)] min-h-80 overflow-hidden bg-night text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-12">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${active % slides.length === index ? "opacity-100" : "opacity-0"}`}
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
        ))}
      </div>
      <div aria-hidden="true" className="court-lines pointer-events-none absolute inset-0 z-10" />
    </section>
  );
}