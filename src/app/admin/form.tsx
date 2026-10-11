"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "./actions";

export const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-teal sm:text-sm";
export const labelCls = "block space-y-1 text-sm font-medium";

/** Formulaire branché sur une action serveur, avec le message de retour en dessous. */
export function ActionForm({
  action,
  children,
  submit = "Enregistrer",
  className = "",
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submit?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={`space-y-3 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={submit} />
        {state?.ok && (
          <p role="status" className="text-sm font-medium text-teal">
            ✓ {state.ok}
          </p>
        )}
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-red-500">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}

export function SubmitButton({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
        danger ? "bg-red-600 hover:bg-red-700" : "bg-teal hover:bg-teal-strong"
      }`}
    >
      {pending ? "…" : label}
    </button>
  );
}

/** Bouton de suppression avec confirmation. */
export function DeleteButton({
  action,
  fields,
  label = "Supprimer",
  confirmText,
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  label?: string;
  confirmText: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className="text-sm font-medium text-red-500 hover:underline">
        {label}
      </button>
    </form>
  );
}
