"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SIDE_LABEL, type ScoredCandidate, type Side } from "@/lib/allebl";
import { AwardIcon } from "./award-icon";
import styles from "./all-ebl-results.module.css";

export type AllEblResultRow = ScoredCandidate & {
  name: string;
  promoLabel: string;
  promoHref: string | null;
  photoUrl: string | null;
  elected: boolean;
};

const pct = (share: number) => `${Math.round(share * 100)} %`;

export function AllEblResults({ court, rows, provisional }: { court: ReactNode; rows: AllEblResultRow[]; provisional: boolean }) {
  const [view, setView] = useState<"team" | "ranking">("team");
  const [side, setSide] = useState<Side>("ext");

  return (
    <section className={styles.results} aria-label="Résultats All-Star">
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>
          <span aria-hidden><AwardIcon type="mvp_finale" size={23} /></span>
          {view === "team" ? "Le cinq majeur" : "Le classement complet"}
          {provisional && <span className={styles.provisional}>Provisoire</span>}
        </h2>
        <div className={styles.switch} role="group" aria-label="Vue des résultats">
          <button type="button" aria-pressed={view === "team"} onClick={() => setView("team")}>Cinq majeur</button>
          <button type="button" aria-pressed={view === "ranking"} onClick={() => setView("ranking")}>Classement complet</button>
        </div>
      </div>

      {view === "team" ? (
        <div className={styles.grid}>
          <div className={styles.courtColumn}>
            {court}
            <p className={styles.courtLegend}>3 extérieurs <span aria-hidden>·</span> 2 intérieurs</p>
          </div>
          <aside className={styles.standings} aria-labelledby="all-ebl-ranking-title">
            <div className={styles.standingsHeader}>
              <h3 id="all-ebl-ranking-title" className={styles.heading}>Le classement</h3>
              <span className={styles.count}>{rows.filter((row) => row.side === side).length} candidats</span>
            </div>
            <div className={styles.sideSwitch} role="group" aria-label="Poste des candidats">
              <button type="button" aria-pressed={side === "ext"} onClick={() => setSide("ext")}>Extérieurs</button>
              <button type="button" aria-pressed={side === "int"} onClick={() => setSide("int")}>Intérieurs</button>
            </div>
            <RankingTable rows={rows.filter((row) => row.side === side)} compact />
            <button type="button" className={styles.fullLink} onClick={() => setView("ranking")}>Voir le classement complet <span aria-hidden>→</span></button>
          </aside>
        </div>
      ) : (
        <RankingTable rows={rows} />
      )}
      <p className={styles.note}>
        <span aria-hidden><AwardIcon type="mvp_finale" size={13} /></span> Joueur élu au cinq majeur.
        Les pourcentages indiquent la part des bulletins ayant choisi le joueur dans chaque collège.
      </p>
    </section>
  );
}

function RankingTable({ rows, compact = false }: { rows: AllEblResultRow[]; compact?: boolean }) {
  const ranks: Record<Side, number> = { ext: 0, int: 0 };

  return (
    <div className={`${styles.tableScroll} ${compact ? styles.compact : ""}`} tabIndex={0} role="region" aria-label={compact ? "Classement par poste" : "Classement de tous les candidats"}>
      <table className={styles.table}>
        <caption className="sr-only">Classement All-Star, par poste et score décroissant</caption>
        <thead>
          <tr>
            <th scope="col"><span aria-hidden>#</span><span className="sr-only">Rang par poste</span></th>
            <th scope="col">Joueur</th>
            {!compact && <th scope="col">Poste</th>}
            <th scope="col">Public</th>
            <th scope="col"><span aria-hidden>{compact ? "Capt." : "Capitaines"}</span><span className="sr-only">Capitaines</span></th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rank = ++ranks[row.side];
            const identity = (
              <>
                {!compact && (
                  row.photoUrl ? (
                    <Image src={row.photoUrl} alt="" width={38} height={38} className={styles.avatar} />
                  ) : <span className={`${styles.avatar} ${styles.initials}`} aria-hidden>{row.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
                )}
                <span className={styles.identityText}>
                  <span className={styles.playerName}>{row.name}</span>
                  <span className={styles.promo}>{row.promoLabel}</span>
                </span>
              </>
            );
            return (
              <tr key={`${row.side}-${row.player_id}`} className={row.elected ? styles.elected : undefined}>
                <td><span className={styles.rank}>{rank}</span></td>
                <th scope="row">
                  <div className={styles.playerCell}>
                    {row.promoHref ? <Link href={row.promoHref} className={styles.identity}>{identity}</Link> : <span className={styles.identity}>{identity}</span>}
                    {row.elected && <span title="Élu au cinq majeur"><span aria-hidden><AwardIcon type="mvp_finale" size={13} /></span><span className="sr-only">Élu au cinq majeur</span></span>}
                  </div>
                </th>
                {!compact && <td className={styles.position}>{SIDE_LABEL[row.side]}</td>}
                <td>{pct(row.publicShare)}</td>
                <td>{pct(row.captainShare)}</td>
                <td className={styles.score}>{row.score.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className={styles.empty}>Aucun candidat pour ce classement.</p>}
    </div>
  );
}