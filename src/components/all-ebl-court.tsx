import Image from "next/image";
import { SIDE_LABEL, type ScoredCandidate, type Side } from "@/lib/allebl";
import { promoCode, promoName } from "@/lib/league";
import type { Player, Promo } from "@/lib/types";
import { PromoBadge } from "./promo-badge";

/** Places sur le demi-terrain (panier en bas) : 3 extérieurs autour de l'arc, 2 intérieurs près du cercle. */
const SPOTS: Record<Side, { x: number; y: number }[]> = {
  ext: [
    { x: 50, y: 17 },
    { x: 17, y: 38 },
    { x: 83, y: 38 },
  ],
  int: [
    { x: 32, y: 68 },
    { x: 68, y: 68 },
  ],
};

type Elected = { ext: ScoredCandidate[]; int: ScoredCandidate[] };

/** L'All-EBL Team d'une saison, sur le demi-terrain aux couleurs de l'EBL. */
export function AllEblCourt({ team, players, promos }: { team: Elected; players: Player[]; promos: Promo[] }) {
  const playerBy = new Map(players.map((p) => [p.id, p]));
  const promoBy = new Map(promos.map((p) => [p.number, p]));

  return (
    <div
      className="relative mx-auto aspect-[15/14] w-full max-w-xl overflow-hidden rounded-2xl border-2 border-gold shadow-lg"
      style={{ background: "linear-gradient(180deg, #c98f55, #b07440)" }}
    >
      <svg viewBox="0 0 150 140" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="rgb(255 255 255 / 0.8)" strokeWidth="0.9">
          <rect x="2" y="2" width="146" height="136" />
          <path d="M51 138V80h48v58" fill="#15191d" fillOpacity="0.45" />
          <circle cx="75" cy="80" r="18" />
          <path d="M12 138v-26a63 63 0 0 1 126 0v26" />
          <path d="M57 2a18 18 0 0 0 36 0" />
          <line x1="66" y1="132" x2="84" y2="132" strokeWidth="1.4" />
          <circle cx="75" cy="128" r="3.2" stroke="#e8762b" strokeWidth="1.2" />
        </g>
      </svg>

      {(["ext", "int"] as const).flatMap((side) =>
        team[side].map((c, i) => {
          const p = playerBy.get(c.player_id);
          const promo = p && promoBy.get(p.promo);
          const spot = SPOTS[side][i];
          if (!p || !promo || !spot) return null;
          return (
            <div
              key={`${side}-${p.id}`}
              className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center sm:w-28"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              <span className="relative rounded-full p-0.5 shadow-lg" style={{ background: promo.color_secondary }}>
                {p.photo_url ? (
                  <Image
                    src={p.photo_url}
                    alt=""
                    width={68}
                    height={68}
                    className="h-[52px] w-[52px] rounded-full object-cover object-top sm:h-[68px] sm:w-[68px]"
                  />
                ) : (
                  <span
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full font-display font-bold text-white sm:h-[68px] sm:w-[68px]"
                    style={{ background: promo.color_primary }}
                  >
                    {promoCode(promo)}
                  </span>
                )}
                <span className="absolute -bottom-1 -right-2">
                  <PromoBadge promo={promo} size={24} className="rounded-md ring-2 ring-white/70" />
                </span>
              </span>
              <span
                className="mt-1 max-w-full truncate rounded px-1.5 py-0.5 font-display text-[0.7rem] font-bold uppercase leading-tight text-white shadow sm:text-xs"
                style={{ background: promo.color_primary }}
                title={`${p.full_name} · ${promoName(promo)}`}
              >
                {p.full_name}
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-white drop-shadow sm:text-[0.65rem]">
                {SIDE_LABEL[side]}
              </span>
            </div>
          );
        }),
      )}
    </div>
  );
}
