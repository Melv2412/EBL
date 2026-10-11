"use client";

import { useEffect, useState } from "react";

const DAY = 86_400_000;

/** « J-6 », « Demain », « C'est aujourd'hui ». Abidjan est en UTC toute l'année. */
function daysUntil(date: string, now: number) {
  const target = Date.parse(`${date}T00:00:00Z`);
  const today = Math.floor(now / DAY) * DAY;
  return Math.round((target - today) / DAY);
}

export function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <span className="invisible">J-0</span>;

  const d = daysUntil(date, now);
  const text = d > 1 ? `J-${d}` : d === 1 ? "Demain" : d === 0 ? "C'est aujourd'hui" : "Résultat bientôt";
  return <span aria-live="polite">{text}</span>;
}
