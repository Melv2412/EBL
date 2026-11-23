import type { Metadata } from "next";
import Image from "next/image";
import { getLeagueData } from "@/lib/data";
import { LEVELS, WHATSAPP_URL, buildLeague, promoCode } from "@/lib/league";
import { PageTitle, Section } from "@/components/ui";
import { FormatDetails } from "@/components/how-it-works";

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi ce site, qui le fait, et comment contribuer.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const league = buildLeague(await getLeagueData());
  const first = league.editions.at(-1);
  const newest = league.promos[0];
  const oldest = league.promos.at(-1);
  const facts = [
    first && { num: String(first.start_year), label: "première édition" },
    newest && oldest && { num: String(league.promos.length), label: `promos, de ${promoCode(oldest)} à ${promoCode(newest)}` },
    { num: String(LEVELS.length), label: `niveaux, de la ${LEVELS[0]} au ${LEVELS.at(-1)}` },
  ].filter((f): f is { num: string; label: string } => Boolean(f));

  return (
    <>
      <PageTitle kicker="À propos" title="L'EBL, en mémoire" />
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pt-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Le projet</p>
          <h2 className="font-display text-3xl font-bold uppercase sm:text-4xl">
            Une histoire qui se racontait de bouche à oreille
          </h2>
          <div className="mt-5 max-w-2xl space-y-4 text-ink-soft" data-reveal>
            <p>
              L&apos;ESATIC Basket League oppose les promos de l&apos;école depuis les IT8, en 2019. Une promo forme une
              équipe et a cinq ans, de la L1 au M2, pour marquer l&apos;histoire. Jusqu&apos;ici, cette histoire se
              racontait de bouche à oreille : ce site la met par écrit.
            </p>
            <p>
              Au départ, la compétition s&apos;appelait simplement « Interpromo Basket ». Elle a pris une nouvelle
              dimension sportive et une vraie identité : elle est devenue l&apos;<strong className="text-ink">ESATIC Basket
              League</strong>, avec son logo, ses promos-équipes et désormais sa mémoire en ligne.
            </p>
            <p>
              C&apos;est un projet étudiant, construit par un membre de la promo IT12 (Grizzly) et ouvert à toute la
              communauté basket de l&apos;ESATIC.
            </p>
          </div>
          <dl className="mt-7 grid grid-cols-3 gap-3" data-reveal>
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col-reverse rounded-2xl border border-line bg-surface p-4 sm:p-[18px]">
                <dt className="mt-1 text-xs text-ink-soft sm:text-sm">{f.label}</dt>
                <dd className="font-display text-3xl font-bold leading-none text-teal sm:text-[40px]">{f.num}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="relative aspect-[16/10] overflow-hidden rounded-[22px] lg:aspect-[4/5]" data-reveal>
          <Image
            src="/photos/a-propos-projet.webp"
            alt="Une promo fête son titre EBL"
            fill
            sizes="(min-width: 1024px) 460px, 100vw"
            className="object-cover"
          />
        </figure>
      </section>
      <FormatDetails />
      <Section title="Contribuer">
        <div className="max-w-2xl space-y-4 text-ink-soft">
          <p>
            Un résultat oublié, un MVP, une photo de finale, une erreur à corriger ? Tout passe par WhatsApp.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
            className="inline-block rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-strong"
          >
            Écrire sur WhatsApp
          </a>
        </div>
      </Section>
      <Section title="Données personnelles">
        <p className="max-w-2xl text-ink-soft">
          Le site publie le nom, le poste et parfois la photo des joueurs, avec leur accord. Pour faire retirer ou
          corriger une information te concernant, écris-nous sur WhatsApp : c&apos;est fait sans discussion.
        </p>
      </Section>
    </>
  );
}
