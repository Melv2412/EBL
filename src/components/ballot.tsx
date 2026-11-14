"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { EXT_COUNT, INT_COUNT, type BallotPlayer, type Side } from "@/lib/allebl";
import type { VoteState } from "@/app/vote/actions";
import { BouncingBall } from "./icons";

const LIMIT: Record<Side, number> = { ext: EXT_COUNT, int: INT_COUNT };
const TITLE: Record<Side, string> = { ext: "Extérieurs", int: "Intérieurs" };

/**
 * Bulletin All-EBL : 3 extérieurs + 2 intérieurs. Un joueur candidat des deux côtés
 * ne peut être choisi qu'une fois. Les joueurs de `lockedPromo` (le capitaine) sont grisés.
 */
export function Ballot({
  action,
  hidden,
  candidates,
  lockedPromo,
  season,
}: {
  action: (state: VoteState, fd: FormData) => Promise<VoteState>;
  hidden: Record<string, string | number>;
  candidates: Record<Side, BallotPlayer[]>;
  lockedPromo?: number;
  /** Saison affichée près du bouton, ex. « 2025-26 ». */
  season?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [picked, setPicked] = useState<Record<Side, number[]>>({ ext: [], int: [] });

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-teal bg-teal-soft p-8 text-center">
        <p className="font-display text-3xl font-bold uppercase">🏀 {state.ok}</p>
        <p className="mt-2 text-ink-soft">Les résultats seront publiés à la fin du vote.</p>
      </div>
    );
  }

  const toggle = (side: Side, id: number) =>
    setPicked((cur) => {
      const list = cur[side];
      if (list.includes(id)) return { ...cur, [side]: list.filter((x) => x !== id) };
      if (list.length >= LIMIT[side]) return cur;
      return { ...cur, [side]: [...list, id] };
    });

  const complete = picked.ext.length === EXT_COUNT && picked.int.length === INT_COUNT;
  const byId = new Map([...candidates.ext, ...candidates.int].map((p) => [p.id, p]));
  const chosen = (["ext", "int"] as const).flatMap((side) =>
    picked[side].flatMap((id) => {
      const player = byId.get(id);
      return player ? [{ side, player }] : [];
    }),
  );
  const both = candidates.ext.some((p) => candidates.int.some((q) => q.id === p.id));

  return (
    <form action={formAction} className="space-y-8 pb-6">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {both && (
        <p className="rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">
          Certains joueurs jouent aussi bien dehors que dedans : ils apparaissent dans les deux listes, mais tu ne
          peux les choisir qu&apos;une fois.
        </p>
      )}
      {(["ext", "int"] as const).map((side) => {
        const other: Side = side === "ext" ? "int" : "ext";
        return (
          <fieldset key={side}>
            <legend className="mb-3 flex w-full items-baseline justify-between">
              <span className="font-display text-2xl font-bold uppercase">{TITLE[side]}</span>
              <span className={`text-sm font-semibold ${picked[side].length === LIMIT[side] ? "text-teal" : "text-ink-soft"}`}>
                {picked[side].length} / {LIMIT[side]}
              </span>
            </legend>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {candidates[side].map((p) => {
                const on = picked[side].includes(p.id);
                const locked = p.promo.number === lockedPromo;
                const elsewhere = picked[other].includes(p.id);
                const full = !on && picked[side].length >= LIMIT[side];
                const disabled = locked || elsewhere || full;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(side, p.id)}
                      disabled={disabled}
                      aria-pressed={on}
                      className={`relative flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition ${
                        on ? "border-teal bg-teal-soft" : "border-line bg-surface hover:border-teal"
                      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {on && <input type="hidden" name={side} value={p.id} />}
                      {p.photo_url ? (
                        <Image
                          src={p.photo_url}
                          alt=""
                          width={56}
                          height={56}
                          className="h-14 w-14 shrink-0 rounded-full object-cover object-top"
                        />
                      ) : (
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
                          style={{ background: p.promo.color_primary }}
                        >
                          IT{p.promo.number}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="ebl-name line-clamp-2 font-semibold leading-tight">{p.full_name}</span>
                        <span className="ebl-name line-clamp-2 text-xs text-ink-soft">
                          {p.promo.name ?? `IT${p.promo.number}`} · IT{p.promo.number}
                        </span>
                        {locked && <span className="block text-xs text-ink-soft">Ta promo</span>}
                        {elsewhere && !locked && <span className="block text-xs text-ink-soft">Déjà choisi</span>}
                      </span>
                      {on && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-between">
        <div className="w-full min-w-0 text-center sm:text-left">
          <p className="text-sm text-ink-soft">
            {season && <span className="font-semibold text-ink">Saison {season} · </span>}
            {complete ? "Ton équipe est complète." : `Choisis ${EXT_COUNT} extérieurs et ${INT_COUNT} intérieurs.`}
          </p>
          {chosen.length > 0 && (
            <ul className="mt-1 flex flex-wrap justify-center gap-1 sm:justify-start" aria-label="Ton 5">
              {chosen.map(({ side, player }) => (
                <li key={side + player.id} className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-semibold">
                  {player.full_name}
                  <span className="ml-1 font-normal text-ink-soft">{side === "ext" ? "Ext" : "Int"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Submit disabled={!complete} />
      </div>
      {state?.error && (
        <p role="alert" className="text-center font-medium text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-full bg-teal px-6 py-3 font-semibold text-white hover:bg-teal-strong disabled:opacity-40 sm:w-auto"
    >
      {pending ? <BouncingBall size={12} className="-my-3 align-middle" /> : "Valider mon vote"}
    </button>
  );
}
