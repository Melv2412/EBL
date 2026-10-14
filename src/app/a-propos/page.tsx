import type { Metadata } from "next";
import { WHATSAPP_URL } from "@/lib/league";
import { PageTitle, Section } from "@/components/ui";
import { FormatDetails } from "@/components/how-it-works";

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi ce site, qui le fait, et comment contribuer.",
};

export default function AboutPage() {
  return (
    <>
      <PageTitle kicker="À propos" title="L'EBL, en mémoire" />
      <Section title="Le projet">
        <div className="max-w-2xl space-y-4 text-ink-soft">
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
      </Section>
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
