import Image from "next/image";
import type { Promo } from "@/lib/types";
import { promoCode, promoName } from "@/lib/league";

type Props = { promo: Promo; size?: number; className?: string };

/** Logo de la promo, ou un écusson aux couleurs EBL tant qu'on ne l'a pas. */
export function PromoBadge({ promo, size = 64, className = "" }: Props) {
  if (promo.logo_url) {
    return (
      <Image
        src={promo.logo_url}
        alt={`Logo ${promoName(promo)}`}
        width={size}
        height={size}
        className={`aspect-square shrink-0 rounded-xl bg-white object-cover ${className}`}
      />
    );
  }

  return (
    <svg
      role="img"
      aria-label={`Écusson ${promoCode(promo)}, logo à venir`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 rounded-xl ${className}`}
    >
      <rect width="100" height="100" fill={promo.color_primary} />
      <path
        d="M50 12 L82 22 V52 C82 70 68 82 50 90 C32 82 18 70 18 52 V22 Z"
        fill="none"
        stroke={promo.color_secondary}
        strokeWidth="4"
      />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontFamily="var(--font-oswald), sans-serif"
        fontWeight="700"
        fontSize="26"
        fill="#ffffff"
      >
        {promoCode(promo)}
      </text>
    </svg>
  );
}
