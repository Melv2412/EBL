import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildLeague, promoCode, promoSlug } from "@/lib/league";
import type { Player } from "@/lib/types";
import { PromoBadge } from "@/components/promo-badge";
import { deletePlayer, savePlayer, savePromo } from "../../../actions";
import { ActionForm, DeleteButton, inputCls, labelCls } from "../../../form";

type Props = { params: Promise<{ number: string }> };

const POSITIONS = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Intérieur", "Pivot"];

export default async function AdminPromo({ params }: Props) {
  const n = Number((await params).number);
  const data = await getLeagueData();
  const promo = buildLeague(data).promo(n);
  if (!promo) notFound();
  const roster = data.players.filter((p) => p.promo === n).sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <PromoBadge promo={promo} size={64} />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">
            {promoCode(promo)} · {promo.name ?? "Sans nom"}
          </h1>
          <Link href={`/promos/${promoSlug(promo)}`} target="_blank" className="text-sm text-teal">
            Voir sur le site ↗
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-xl font-bold uppercase">Identité</h2>
        <ActionForm action={savePromo}>
          <input type="hidden" name="number" value={promo.number} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              <span>Nom</span>
              <input name="name" defaultValue={promo.name ?? ""} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Année d&apos;entrée en L1</span>
              <input name="entry_year" type="number" defaultValue={promo.entry_year} required className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Couleur principale</span>
              <input name="color_primary" type="color" defaultValue={promo.color_primary} className="h-11 w-full rounded-lg" />
            </label>
            <label className={labelCls}>
              <span>Couleur secondaire</span>
              <input name="color_secondary" type="color" defaultValue={promo.color_secondary} className="h-11 w-full rounded-lg" />
            </label>
          </div>
          <label className={labelCls}>
            <span>Logo {promo.logo_url ? "(remplacer)" : ""}</span>
            <input name="logo" type="file" accept="image/*" className={inputCls} />
          </label>
          {promo.logo_url && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_logo" /> Retirer le logo (l&apos;écusson généré le remplace)
            </label>
          )}
          <label className={labelCls}>
            <span>Photo d&apos;équipe {promo.team_photo_url ? "(remplacer)" : ""} : affichée en bannière sur la fiche</span>
            <input name="team_photo" type="file" accept="image/*" className={inputCls} />
          </label>
          {promo.team_photo_url && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_team_photo" /> Retirer la photo d&apos;équipe
            </label>
          )}
        </ActionForm>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-display text-xl font-bold uppercase">Effectif</h2>
        <p className="mb-4 text-sm text-ink-soft">
          N&apos;ajoute une photo qu&apos;avec l&apos;accord du joueur. L&apos;effectif s&apos;affiche sur le site à partir
          de 5 joueurs.
        </p>
        <div className="space-y-3">
          {roster.map((p) => (
            <details key={p.id} className="rounded-xl border border-line p-3">
              <summary className="flex cursor-pointer items-center gap-3">
                {p.photo_url ? (
                  <Image src={p.photo_url} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="h-9 w-9 rounded-full" style={{ background: promo.color_primary }} />
                )}
                <span className="font-medium">{p.full_name}</span>
                <span className="text-sm text-ink-soft">{p.position}</span>
              </summary>
              <div className="mt-3 space-y-3">
                <PlayerForm promo={n} player={p} />
                <DeleteButton
                  action={deletePlayer}
                  fields={{ id: p.id }}
                  confirmText={`Supprimer ${p.full_name} ? Ses distinctions seront aussi supprimées.`}
                />
              </div>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line p-3" open={roster.length === 0}>
            <summary className="cursor-pointer font-semibold text-teal">+ Ajouter un joueur</summary>
            <div className="mt-3">
              <PlayerForm promo={n} />
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

function PlayerForm({ promo, player }: { promo: number; player?: Player }) {
  return (
    <ActionForm action={savePlayer} submit={player ? "Enregistrer" : "Ajouter"}>
      {player && <input type="hidden" name="id" value={player.id} />}
      <input type="hidden" name="promo" value={promo} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          <span>Nom complet</span>
          <input name="full_name" defaultValue={player?.full_name ?? ""} required className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Poste</span>
          <select name="position" defaultValue={player?.position ?? ""} className={inputCls}>
            <option value="">Non précisé</option>
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_captain" defaultChecked={player?.is_captain ?? false} /> Capitaine de la promo
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_starter" defaultChecked={player?.is_starter ?? false} /> Dans le 5 de départ (placé sur
        le terrain, sans mention visible)
      </label>
      <label className={labelCls}>
        <span>Photo {player?.photo_url ? "(remplacer)" : ""}</span>
        <input name="photo" type="file" accept="image/*" className={inputCls} />
      </label>
      {player?.photo_url && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remove_photo" /> Retirer la photo
        </label>
      )}
    </ActionForm>
  );
}
