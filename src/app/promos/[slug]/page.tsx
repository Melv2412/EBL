import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import {
  LEVELS,
  PLACEMENT_LABEL,
  buildLeague,
  currentSeasonYear,
  levelOf,
  promoCode,
  promoName,
  promoSlug,
} from "@/lib/league";
import { PromoBadge } from "@/components/promo-badge";
import { LevelTag, PlacementPill, Section } from "@/components/ui";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

// En dessous, la liste ne contient que les joueurs distingués : ce n'est pas un effectif.
const MIN_ROSTER = 5;

function numberFromSlug(slug: string) {
  const m = /^it(\d+)$/i.exec(slug);
  return m ? Number(m[1]) : null;
}

export async function generateStaticParams() {
  const data = await getLeagueData();
  return data.promos.map((p) => ({ slug: promoSlug(p) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = numberFromSlug((await params).slug);
  const p = n === null ? null : buildLeague(await getLeagueData()).promo(n);
  if (!p) return {};
  const title = p.name ? `${p.name} (${promoCode(p)})` : promoCode(p);
  return {
    title,
    description: `${title}, promo de l'ESATIC Basket League : parcours, résultats et joueurs.`,
    openGraph: { title, images: p.logo_url ? [p.logo_url] : undefined },
  };
}

export default async function PromoPage({ params }: Props) {
  const n = numberFromSlug((await params).slug);
  const league = buildLeague(await getLeagueData());
  const promo = n === null ? null : league.promo(n);
  if (!promo) notFound();

  const journey = league.journey(promo);
  const best = league.bestResult(promo);
  const awards = league.awardsOf(promo);
  const roster = league.playersOf(promo);
  const nowLevel = levelOf(promo, currentSeasonYear());

  return (
    <>
      <section
        className="court-lines text-white"
        style={{ background: `linear-gradient(135deg, var(--night) 35%, ${promo.color_primary} 75%, ${promo.color_secondary})` }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:flex-row sm:text-left">
          <PromoBadge promo={promo} size={176} className="h-36 w-36 sm:h-44 sm:w-44" />
          <div>
            <p className="font-display text-lg tracking-[0.25em] text-white/70">
              {promoCode(promo)} · entrée en {promo.entry_year}
            </p>
            <h1 className="font-display text-5xl font-bold uppercase sm:text-7xl">{promo.name ?? "Nom à venir"}</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {best && (
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-night">
                  {best.placement === "champion" ? "🏆 " : ""}
                  {PLACEMENT_LABEL[best.placement]} {best.editions.map((e) => e.label).join(" · ")}
                </span>
              )}
              {nowLevel && (
                <span className="rounded-full border border-white/30 px-3 py-1 text-sm">
                  {nowLevel === "Anciens" ? "Anciens" : `En ${nowLevel} cette saison`}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <Section title="Le parcours" kicker="De la L1 au M2">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {LEVELS.map((level, i) => {
            const entry = journey.find((j) => j.level === level);
            const year = promo.entry_year + i;
            return (
              <li key={level} className="flex min-h-32 flex-col rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-2xl font-bold text-teal">{level}</span>
                  <span className="text-xs text-ink-soft">{`${year}-${String(year + 1).slice(2)}`}</span>
                </div>
                <div className="mt-auto pt-3 text-sm">
                  {!entry ? (
                    <span className="text-ink-soft">À venir</span>
                  ) : entry.placement ? (
                    <Link href={`/editions/${entry.edition.label}`}>
                      <PlacementPill placement={entry.placement} />
                    </Link>
                  ) : entry.pending ? (
                    <Link href="/" className="font-semibold text-teal">
                      En finale !
                    </Link>
                  ) : entry.poulePos ? (
                    <Link href={`/editions/${entry.edition.label}`} className="text-ink-soft hover:text-teal">
                      {entry.poulePos === 1 ? "1er" : `${entry.poulePos}e`} de la poule
                      {entry.edition.status === "en_cours" && entry.edition.semis.length === 0 ? " (en cours)" : ""}
                    </Link>
                  ) : entry.edition.semis.length > 0 ? (
                    <span className="text-ink-soft">Éliminé avant les demies</span>
                  ) : (
                    <span className="text-ink-soft">Résultat inconnu</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {journey.some((j) => j.level === "Anciens" && (j.placement || j.pending)) && (
          <p className="mt-4 text-sm text-ink-soft">
            Revenus en anciens :{" "}
            {journey
              .filter((j) => j.level === "Anciens" && j.placement)
              .map((j) => `${PLACEMENT_LABEL[j.placement!]} ${j.edition.label}`)
              .join(", ")}
          </p>
        )}
      </Section>

      {awards.length > 0 && (
        <Section title="Joueurs distingués">
          <ul className="grid gap-3 sm:grid-cols-2">
            {awards.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal">
                  {a.type === "mvp" ? "MVP" : "Mention honorable"} ·{" "}
                  <Link href={`/editions/${league.edition(a.edition_year)!.label}`} className="hover:underline">
                    {league.edition(a.edition_year)!.label}
                  </Link>
                </p>
                <p className="font-display text-xl font-bold">{a.player.full_name}</p>
                <p className="text-sm text-ink-soft">
                  en <LevelTag level={levelOf(promo, a.edition_year)} />
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="L'effectif">
        {roster.length < MIN_ROSTER ? (
          <p className="text-ink-soft">L&apos;effectif de {promoName(promo)} arrive bientôt.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {roster.map((pl) => (
              <li key={pl.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                {pl.photo_url ? (
                  <Image src={pl.photo_url} alt={pl.full_name} width={300} height={300} className="aspect-square w-full object-cover" />
                ) : (
                  <div
                    className="flex aspect-square items-center justify-center font-display text-4xl font-bold text-white/80"
                    style={{ background: promo.color_primary }}
                    aria-hidden
                  >
                    {pl.full_name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold leading-tight">{pl.full_name}</p>
                  {pl.position && <p className="text-xs text-ink-soft">{pl.position}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <Link href="/promos" className="text-sm font-medium text-teal">
          ← Toutes les promos
        </Link>
      </div>
    </>
  );
}
