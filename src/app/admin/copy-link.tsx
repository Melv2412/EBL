"use client";

import { useState } from "react";

/** Lien affiché avec un bouton « Copier » (pour l'envoyer sur WhatsApp). */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded bg-surface-2 px-2 py-1 text-xs">{url}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copie ce lien :", url);
          }
        }}
        className="shrink-0 rounded-md border border-line px-2 py-1 text-xs font-semibold hover:border-teal"
      >
        {copied ? "Copié ✓" : "Copier"}
      </button>
    </span>
  );
}
