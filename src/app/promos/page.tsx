import type { Metadata } from "next";
import { getLeagueData } from "@/lib/data";
import { buildLeague, currentSeasonYear, levelOf } from "@/lib/league";
import { PromoCard } from "@/components/cards";
import { PageTitle } from "@/components/ui";
import { PromoFilter } from "@/components/promo-filter";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Promos",
  description: "Les promos de l'ESATIC Basket League : une promo, une équipe, cinq ans pour écrire son histoire.",
};

export default async function PromosPage() {
  const league = buildLeague(await getLeagueData());
  const year = currentSeasonYear();
  const items = league.promos.map((p) => {
    const level = levelOf(p, year);
    return {
      key: p.number,
      kind: level === "Anciens" ? ("anciens" as const) : level ? ("jeu" as const) : ("autre" as const),
      card: <PromoCard promo={p} league={league} />,
    };
  });
  return (
    <>
      <PageTitle
        kicker="Une promo, une équipe"
        title="Les promos"
        intro="À l'EBL, chaque promo forme son équipe de la L1 au M2. Les anciens peuvent revenir porter leurs couleurs."
      />
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <PromoFilter items={items} />
      </div>
    </>
  );
}
