import { LEVELS } from "@/lib/league";
import { Tie } from "./icons";
import { Section } from "./ui";

const STEPS = [
  {
    n: 1,
    title: "Une promo, une équipe",
    text: "Chaque promo a son nom et son logo, et joue de la L1 au M2. Les anciens peuvent revenir.",
  },
  {
    n: 2,
    title: "La poule",
    text: "Tout le monde affronte tout le monde en match sec. Classement aux victoires, puis à la différence de points.",
  },
  {
    n: 3,
    title: "Les demi-finales",
    text: "Les 4 premiers : 1er contre 4e, 2e contre 3e, au meilleur des 3 matchs.",
  },
  {
    n: 4,
    title: "La finale",
    text: "Un match sec, un champion, un MVP.",
  },
];

/** « Comment ça marche » : le format de l'EBL en 4 étapes (accueil). */
export function HowItWorks() {
  return (
    <Section title="Comment ça marche" kicker="Le format">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            data-reveal
            style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            className="relative rounded-2xl border border-line bg-surface p-5"
          >
            <span className="font-display text-5xl font-bold leading-none text-teal/30">{s.n}</span>
            <h3 className="mt-2 font-display text-xl font-bold uppercase">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
            {s.n === 1 && (
              <span className="mt-3 flex gap-1.5" aria-label="Une cravate par niveau, de la L1 au M2">
                {LEVELS.map((l) => (
                  <Tie key={l} level={l} size={18} />
                ))}
              </span>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Version détaillée pour la page À propos. */
export function FormatDetails() {
  return (
    <Section title="Le format en détail">
      <div className="max-w-2xl space-y-4 text-ink-soft">
        <p>
          <strong className="text-ink">Une promo = une équipe.</strong> Chaque promo (IT12, IT13…) choisit son nom et son
          logo. Elle joue de la L1 au M2 : cinq saisons pour écrire son histoire. Chaque niveau a sa cravate, comme à
          l&apos;école : bleu nuit en L1, grise en L2, jaune en L3, bleu ciel en M1, verte en M2. Une promo diplômée peut
          revenir jouer en « Anciens ».
        </p>
        <p>
          <strong className="text-ink">La poule.</strong> Toutes les équipes inscrites sont dans une seule poule et se
          rencontrent une fois, en match sec. Le classement se fait au nombre de victoires, puis à la différence de points
          en cas d&apos;égalité.
        </p>
        <p>
          <strong className="text-ink">Les demi-finales.</strong> Les quatre premiers de la poule sont qualifiés : le 1er
          affronte le 4e, le 2e affronte le 3e. Chaque demie se joue au meilleur des trois matchs.
        </p>
        <p>
          <strong className="text-ink">La finale.</strong> Les deux vainqueurs des demies jouent la finale en un seul match.
          Le vainqueur est champion de l&apos;EBL, et un MVP est désigné pour le tournoi. Il n&apos;y a pas de match pour
          la troisième place.
        </p>
      </div>
    </Section>
  );
}
