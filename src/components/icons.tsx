import { LEVEL_TIE, type Level } from "@/lib/league";

/** Cravate aux couleurs du niveau, clin d'œil à l'uniforme de l'ESATIC. */
export function Tie({ level, size = 16, className = "" }: { level: Level; size?: number; className?: string }) {
  const { color, name } = LEVEL_TIE[level];
  return (
    <svg
      viewBox="0 0 16 28"
      width={size * (16 / 28)}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      role="img"
      aria-label={`Cravate ${name}`}
    >
      <title>{`Cravate ${name} (${level})`}</title>
      <path d="M4 1h8l-1.6 4.2H5.6z" fill={color} stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.8" />
      <path d="M5.6 5.6h4.8L13 21l-5 6-5-6z" fill={color} stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.8" />
      <path d="M6.2 9l5.4 4M5.4 14l6.6 5" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.2" />
    </svg>
  );
}

/** Ballon qui rebondit (404, chargements). */
export function BouncingBall({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`} style={{ height: size * 2.4 }} aria-hidden>
      <span className="flex flex-1 items-end">
        <svg viewBox="0 0 40 40" width={size} height={size} className="ebl-ball">
          <circle cx="20" cy="20" r="18.5" fill="#e8762b" stroke="#2a1608" strokeWidth="1.5" />
          <path
            d="M1.5 20h37M20 1.5v37M6.5 7.5c6 4.5 6 20.5 0 25M33.5 7.5c-6 4.5-6 20.5 0 25"
            fill="none"
            stroke="#2a1608"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <span className="ebl-ball-shadow mt-1 block h-1.5 rounded-full bg-black/60" style={{ width: size * 0.8 }} />
    </span>
  );
}

const MEDAL = {
  argent: { face: "#d9dde2", edge: "#9aa3ad", ribbon: "#5b6b7c", label: "Médaille d'argent" },
  or: { face: "#f4cf5d", edge: "#c8962a", ribbon: "#b8322f", label: "Médaille d'or" },
} as const;

/** Médaille (argent pour les finalistes). */
export function Medal({ tone = "argent", size = 14, className = "" }: { tone?: keyof typeof MEDAL; size?: number; className?: string }) {
  const m = MEDAL[tone];
  return (
    <svg viewBox="0 0 20 26" width={size * (20 / 26)} height={size} className={`inline-block shrink-0 ${className}`} role="img" aria-label={m.label}>
      <path d="M5 1h4l3 8H8zM15 1h-4l-3 8h4z" fill={m.ribbon} />
      <circle cx="10" cy="17" r="8" fill={m.face} stroke={m.edge} strokeWidth="1.6" />
      <path d="M10 12.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill={m.edge} />
    </svg>
  );
}

const LINE_ICONS = {
  trophy: (
    <>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

/** Icône au trait (24×24), couleur héritée du texte. */
export function LineIcon({ name, size = 18, className = "" }: { name: keyof typeof LINE_ICONS; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`inline-block shrink-0 ${className}`}
    >
      {LINE_ICONS[name]}
    </svg>
  );
}

/** Pastille « ITxx · niveau » avec la couleur de cravate du niveau. */
export function TieChip({ level, children, className = "" }: { level: Level | "Anciens" | null; children: React.ReactNode; className?: string }) {
  const dot = level && level !== "Anciens" ? LEVEL_TIE[level].color : "linear-gradient(135deg, var(--gold), #b9862a)";
  return (
    <span className={`inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs font-semibold ${className}`}>
      <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: dot }} />
      {children}
    </span>
  );
}
