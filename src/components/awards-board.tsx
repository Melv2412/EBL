import Image from "next/image";
import { AWARDS, awardDetail, awardRank } from "@/lib/awards";
import { levelOf, promoCode, promoName, type AwardView } from "@/lib/league";
import { AwardIcon } from "./award-icon";
import { PromoBadge } from "./promo-badge";
import { Section } from "./ui";

function Photo({ a, size }: { a: AwardView; size: number }) {
  return a.player.photo_url ? (
    <Image
      src={a.player.photo_url}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover object-top"
      style={{ width: size, height: size }}
    />
  ) : (
    <PromoBadge promo={a.promo} size={size} />
  );
}

function Card({ a, year, big }: { a: AwardView; year: number; big?: boolean }) {
  const detail = awardDetail(a);
  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border bg-surface p-4 ${
        big ? "border-gold sm:col-span-2 sm:p-6" : "border-line"
      }`}
    >
      <Photo a={a} size={big ? 88 : 60} />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-teal">
          <AwardIcon type={a.type} size={big ? 20 : 16} />
          {AWARDS[a.type].label}
        </p>
        <p className={`font-display font-bold leading-tight ${big ? "text-3xl" : "text-xl"}`}>{a.player.full_name}</p>
        <p className="text-sm text-ink-soft">
          {promoName(a.promo)} · {promoCode(a.promo)}
          {a.type === "revelation" && ` · en ${levelOf(a.promo, year)}`}
          {a.player.position && ` · ${a.player.position}`}
        </p>
        {detail && <p className="mt-0.5 font-display text-lg font-bold text-ink">{detail}</p>}
      </div>
    </li>
  );
}

/** Distinctions d'une édition : le tournoi (MVP en tête), puis les concours s'il y en a eu. */
export function AwardsBoard({ awards, year }: { awards: AwardView[]; year: number }) {
  const sorted = [...awards].sort((x, y) => awardRank(x.type) - awardRank(y.type) || x.id - y.id);
  const tournoi = sorted.filter((a) => AWARDS[a.type].category === "tournoi");
  const concours = sorted.filter((a) => AWARDS[a.type].category === "concours");
  if (sorted.length === 0) return null;

  return (
    <>
      {tournoi.length > 0 && (
        <Section title="Distinctions" kicker="Le tournoi">
          <ul className="grid gap-4 sm:grid-cols-2">
            {tournoi.map((a) => (
              <Card key={a.id} a={a} year={year} big={a.type === "mvp"} />
            ))}
          </ul>
        </Section>
      )}
      {concours.length > 0 && (
        <Section title="Concours">
          <ul className="grid gap-4 sm:grid-cols-2">
            {concours.map((a) => (
              <Card key={a.id} a={a} year={year} />
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
