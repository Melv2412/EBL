"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function SeasonSelect({ seasons, selected }: { seasons: string[]; selected: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Saison All-EBL"
      aria-busy={pending}
      className={styles.seasonSelect}
      value={selected}
      disabled={pending}
      onChange={(event) => {
        const season = event.target.value;
        startTransition(() => router.push(`/all-ebl?saison=${encodeURIComponent(season)}`, { scroll: false }));
      }}
    >
      {seasons.map((season) => <option key={season} value={season}>Saison {season}</option>)}
    </select>
  );
}