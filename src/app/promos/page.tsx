import type { Metadata } from "next";
import { getLeagueData } from "@/lib/data";
import { buildLeague } from "@/lib/league";
import { PromoCard } from "@/components/cards";
import { PageTitle } from "@/components/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Promos",
  description: "Les promos de l'ESATIC Basket League : une promo, une équipe, cinq ans pour écrire son histoire.",
};

export default async function PromosPage() {
  const league = buildLeague(await getLeagueData());
  return (
    <>
      <PageTitle
        kicker="Une promo, une équipe"
        title="Les promos"
        intro="À l'EBL, chaque promo forme son équipe de la L1 au M2. Les anciens peuvent revenir porter leurs couleurs."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {league.promos.map((p) => (
          <PromoCard key={p.number} promo={p} league={league} />
        ))}
      </div>
    </>
  );
}
