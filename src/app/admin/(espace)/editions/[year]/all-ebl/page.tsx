import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getLeagueData } from "@/lib/data";
import { SIDE_LABEL, electTeam, formatWhen, getTally, scoreTally, votePhase, type AllEblSettings } from "@/lib/allebl";
import { buildLeague, levelOf, promoCode, promoName, seasonLabel } from "@/lib/league";
import { supabaseServer } from "@/lib/supabase-server";
import { newCaptainLink, resetVotes, saveAllEblSettings, saveCandidates, voidBallots } from "../../../../actions";
import { ActionForm, DeleteButton, inputCls, labelCls } from "../../../../form";
import { CopyLink } from "../../../../copy-link";

type Props = { params: Promise<{ year: string }> };

/** ISO → valeur d'un champ datetime-local (heure d'Abidjan = UTC). */
const local = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const PHASE = { a_venir: "Pas encore ouvert", ouvert: "Vote ouvert", clos: "Vote clos", non_configure: "Dates non réglées" };

export default async function AdminAllEbl({ params }: Props) {
  const year = Number((await params).year);
  const db = await supabaseServer();
  const data = await getLeagueData();
  const league = buildLeague(data);
  const e = league.edition(year);
  if (!e) notFound();

  const [settingsRes, candRes, linksRes, ballotsRes, tally] = await Promise.all([
    db.from("editions").select("start_year, allebl_opens_at, allebl_closes_at, allebl_published").eq("start_year", year).single(),
    db.from("allebl_candidates").select("player_id, side").eq("edition_year", year),
    db.from("allebl_captain_links").select("code, promo, used_at").eq("edition_year", year),
    db.from("allebl_votes").select("ip_hash, voided, created_at").eq("edition_year", year),
    getTally(year, db),
  ]);

  if (settingsRes.error) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h1 className="mb-2 font-display text-2xl font-bold uppercase">All-EBL Team</h1>
        <p className="text-sm text-ink-soft">
          L&apos;All-EBL Team n&apos;est pas encore activée dans la base (migration{" "}
          <code>supabase/migrations/0007_all_ebl.sql</code>).
        </p>
      </section>
    );
  }

  const s = settingsRes.data as AllEblSettings;
  const phase = votePhase(s);
  const chosen = new Set((candRes.data ?? []).map((c) => `${c.player_id}:${c.side}`));
  const links = new Map((linksRes.data ?? []).map((l) => [l.promo, l]));
  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${h.get("host")}`;

  // Joueurs des promos en activité cette saison (anciens compris), groupés par promo.
  const promos = league.promos.filter((p) => levelOf(p, year) !== null);
  const byPromo = promos
    .map((p) => ({ promo: p, players: data.players.filter((pl) => pl.promo === p.number).sort((a, b) => a.full_name.localeCompare(b.full_name)) }))
    .filter((g) => g.players.length > 0);
  const captainPromos = promos.filter((p) => e.teams.some((t) => t.number === p.number) || byPromo.some((g) => g.promo.number === p.number));

  const scored = scoreTally(tally);
  const name = (id: number) => data.players.find((p) => p.id === id)?.full_name ?? "";
  const team = electTeam(scored, name);
  const elected = new Set([...team.ext, ...team.int].map((c) => `${c.side}-${c.player_id}`));

  // Bulletins du public regroupés par empreinte réseau, pour repérer les rafales.
  const groups = new Map<string, { total: number; voided: number }>();
  for (const b of ballotsRes.data ?? []) {
    const k = b.ip_hash ?? "";
    const g = groups.get(k) ?? { total: 0, voided: 0 };
    g.total++;
    if (b.voided) g.voided++;
    groups.set(k, g);
  }
  const suspicious = [...groups.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 15);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold uppercase">All-EBL Team {seasonLabel(year)}</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/all-ebl" target="_blank" className="text-teal">
            Page All-EBL ↗
          </Link>
          <Link href="/vote" target="_blank" className="text-teal">
            Page de vote ↗
          </Link>
        </div>
      </div>

      <Card title={`1. Réglages · ${PHASE[phase]}${s.allebl_published ? " · Publié" : " · Caché"}`}>
        <ActionForm action={saveAllEblSettings}>
          <input type="hidden" name="edition_year" value={year} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              <span>Ouverture du vote (heure d&apos;Abidjan)</span>
              <input name="opens_at" type="datetime-local" defaultValue={local(s.allebl_opens_at)} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span>Fermeture du vote</span>
              <input name="closes_at" type="datetime-local" defaultValue={local(s.allebl_closes_at)} className={inputCls} />
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={s.allebl_published} className="mt-1" />
            <span>
              <strong>Publier</strong> : rend /vote et /all-ebl visibles par tous et affiche le bandeau « Vote ouvert »
              sur l&apos;accueil. Décoché, seuls les admins connectés voient ces pages.
            </span>
          </label>
        </ActionForm>
      </Card>

      <Card title={`2. Candidats · ${[...chosen].filter((k) => k.endsWith(":ext")).length} ext. · ${[...chosen].filter((k) => k.endsWith(":int")).length} int.`}>
        <p className="mb-3 text-sm text-ink-soft">
          Coche chaque candidat côté extérieur (E) et/ou intérieur (I). Il en faut au moins 3 E et 2 I. Un joueur coché des
          deux côtés ne peut être choisi qu&apos;une fois par bulletin.
        </p>
        <ActionForm action={saveCandidates} submit="Enregistrer les candidats">
          <input type="hidden" name="edition_year" value={year} />
          <div className="space-y-4">
            {byPromo.map(({ promo, players }) => (
              <div key={promo.number}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {promoName(promo)} · {promoCode(promo)}
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {players.map((pl) => (
                    <li key={pl.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        {pl.full_name} <span className="text-xs text-ink-soft">{pl.position ?? ""}</span>
                      </span>
                      {(["ext", "int"] as const).map((side) => (
                        <label
                          key={side}
                          className="flex cursor-pointer items-center gap-1 rounded-md border border-line px-2 py-1 has-[:checked]:border-teal has-[:checked]:bg-teal-soft"
                          title={SIDE_LABEL[side]}
                        >
                          <input type="checkbox" name="cand" value={`${pl.id}:${side}`} defaultChecked={chosen.has(`${pl.id}:${side}`)} />
                          {side === "ext" ? "E" : "I"}
                        </label>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {byPromo.length === 0 && <p className="text-sm text-ink-soft">Aucun joueur saisi pour les promos de cette saison.</p>}
          </div>
        </ActionForm>
      </Card>

      <Card title="3. Liens des capitaines">
        <p className="mb-3 text-sm text-ink-soft">
          Un lien par promo, à envoyer au capitaine sur WhatsApp. Il ne sert qu&apos;une fois. « Nouveau lien » remplace
          l&apos;ancien (à faire si un lien a fuité ; un lien déjà utilisé garde son vote tant qu&apos;on ne le remplace pas).
        </p>
        <ul className="space-y-2">
          {captainPromos.map((p) => {
            const l = links.get(p.number);
            return (
              <li key={p.number} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="w-40 shrink-0 font-semibold">
                  {promoName(p)} <span className="text-xs text-ink-soft">{promoCode(p)}</span>
                </span>
                {l ? (
                  <>
                    <CopyLink url={`${site}/vote/capitaine/${l.code}`} />
                    <span className={`text-xs font-semibold ${l.used_at ? "text-teal" : "text-ink-soft"}`}>
                      {l.used_at ? `A voté (${formatWhen(l.used_at)})` : "Pas encore voté"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-ink-soft">Pas de lien</span>
                )}
                <form action={newCaptainLink} className="ml-auto">
                  <input type="hidden" name="edition_year" value={year} />
                  <input type="hidden" name="promo" value={p.number} />
                  <button className="text-xs font-semibold text-teal hover:underline">{l ? "Nouveau lien" : "Créer le lien"}</button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={`4. Résultats en direct · ${scored[0]?.public_ballots ?? 0} public · ${scored[0]?.captain_ballots ?? 0} capitaines`}>
        {scored.length === 0 ? (
          <p className="text-sm text-ink-soft">Pas encore de candidats.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink-soft">
                  <th className="py-2">Joueur</th>
                  <th>Poste</th>
                  <th className="text-right">Public</th>
                  <th className="text-right">Capitaines</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {[...scored]
                  .sort((a, b) => (a.side === b.side ? b.score - a.score : a.side === "ext" ? -1 : 1))
                  .map((c) => (
                    <tr key={`${c.side}-${c.player_id}`} className={`border-b border-line last:border-0 ${elected.has(`${c.side}-${c.player_id}`) ? "font-semibold" : ""}`}>
                      <td className="py-1.5">{elected.has(`${c.side}-${c.player_id}`) ? "⭐ " : ""}{name(c.player_id)}</td>
                      <td className="text-ink-soft">{SIDE_LABEL[c.side]}</td>
                      <td className="text-right tabular-nums">{c.public_votes}</td>
                      <td className="text-right tabular-nums">{c.captain_votes}</td>
                      <td className="text-right tabular-nums">{c.score.toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="5. Modération">
        <p className="mb-3 text-sm text-ink-soft">
          Bulletins du public regroupés par réseau (empreinte anonyme de l&apos;adresse IP). Plusieurs votes depuis le
          même wifi de l&apos;école sont normaux ; une rafale anormale peut être annulée.
        </p>
        {suspicious.length === 0 ? (
          <p className="text-sm text-ink-soft">Aucun bulletin.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {suspicious.map(([ip, g]) => (
              <li key={ip} className="flex items-center gap-3 rounded-lg border border-line px-3 py-1.5">
                <code className="text-xs text-ink-soft">{ip || "inconnu"}</code>
                <span className="flex-1">
                  {g.total} bulletin{g.total > 1 ? "s" : ""}
                  {g.voided ? ` · ${g.voided} annulé${g.voided > 1 ? "s" : ""}` : ""}
                </span>
                <DeleteButton
                  action={voidBallots}
                  fields={{ edition_year: year, ip_hash: ip, voided: g.voided === g.total ? "false" : "true" }}
                  label={g.voided === g.total ? "Rétablir" : "Annuler ces bulletins"}
                  confirmText={g.voided === g.total ? "Rétablir ces bulletins ?" : "Annuler tous les bulletins de ce réseau ?"}
                />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 border-t border-line pt-4">
          <DeleteButton
            action={resetVotes}
            fields={{ edition_year: year }}
            label="Effacer tous les votes (après les tests)"
            confirmText="Effacer TOUS les bulletins (public et capitaines) de cette saison ? Les liens des capitaines redeviennent utilisables."
          />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-xl font-bold uppercase">{title}</h2>
      {children}
    </section>
  );
}
