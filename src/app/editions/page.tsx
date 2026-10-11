import type { Metadata } from "next";
import { getLeagueData } from "@/lib/data";
import { buildLeague } from "@/lib/league";
import { EditionCard } from "@/components/cards";
import { PageTitle } from "@/components/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Éditions",
  description: "Toutes les éditions de l'ESATIC Basket League : champions, finalistes et MVP.",
};

export default async function EditionsPage() {
  const league = buildLeague(await getLeagueData());
  return (
    <>
      <PageTitle
        kicker="Palmarès"
        title="Les éditions"
        intro="Une édition par année universitaire depuis les débuts de l'EBL avec les IT8. Les premières restent à raconter."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {league.editions.map((e) => (
          <EditionCard key={e.start_year} edition={e} />
        ))}
      </div>
    </>
  );
}
