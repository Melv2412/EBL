import { changePassword } from "../../actions";
import { ActionForm, inputCls, labelCls } from "../../form";

export default function AccountPage() {
  return (
    <section className="max-w-md rounded-2xl border border-line bg-surface p-5">
      <h1 className="mb-4 font-display text-2xl font-bold uppercase">Changer mon mot de passe</h1>
      <ActionForm action={changePassword} submit="Changer le mot de passe">
        <label className={labelCls}>
          <span>Mot de passe actuel</span>
          <input name="current" type="password" autoComplete="current-password" required className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Nouveau mot de passe (10 caractères minimum)</span>
          <input name="next" type="password" autoComplete="new-password" minLength={10} required className={inputCls} />
        </label>
        <label className={labelCls}>
          <span>Confirmer le nouveau mot de passe</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className={inputCls} />
        </label>
      </ActionForm>
    </section>
  );
}
