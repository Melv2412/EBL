"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Champ image de l'admin : choisir un fichier, le glisser, ou coller une image
 * (Ctrl+V sur la zone, ou bouton « Coller » qui lit le presse-papiers).
 * L'image collée est placée dans le vrai champ fichier : le formulaire l'envoie comme les autres.
 */
export function ImageInput({ name, className = "" }: { name: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Ce n'est pas une image.");
      return;
    }
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const named = file.name && file.name !== "image.png" ? file : new File([file], `colle-${Date.now()}.${ext}`, { type: file.type });
    const dt = new DataTransfer();
    dt.items.add(named);
    input.current!.files = dt.files;
    setPreview(URL.createObjectURL(named));
    setMessage(null);
  };

  const fromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) return pick(new File([await item.getType(type)], "image", { type }));
      }
      setMessage("Aucune image dans le presse-papiers.");
    } catch {
      setMessage("Le navigateur bloque la lecture du presse-papiers : utilise Ctrl+V sur la zone, ou choisis un fichier.");
    }
  };

  const clear = () => {
    input.current!.value = "";
    setPreview(null);
  };

  return (
    <div className={className}>
      <div
        tabIndex={0}
        role="group"
        aria-label="Image : coller, glisser ou choisir un fichier"
        onPaste={(e) => {
          const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
          if (file) {
            e.preventDefault();
            pick(file);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files[0];
          if (file) pick(file);
        }}
        className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-3 outline-none transition-colors focus:border-teal ${
          over ? "border-teal bg-teal-soft" : "border-line"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-2xl" aria-hidden>
            🖼️
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <p className="text-ink-soft">
            {preview ? "Image prête à être envoyée." : "Colle une image ici (Ctrl+V), glisse-la, ou :"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fromClipboard}
              className="rounded-md border border-line bg-surface px-3 py-1.5 font-medium hover:border-teal"
            >
              📋 Coller
            </button>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="rounded-md border border-line bg-surface px-3 py-1.5 font-medium hover:border-teal"
            >
              📁 Choisir
            </button>
            {preview && (
              <button type="button" onClick={clear} className="px-2 py-1.5 font-medium text-red-500 hover:underline">
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
      {message && <p className="mt-1 text-xs text-red-500">{message}</p>}
      <input
        ref={input}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
            setMessage(null);
          } else setPreview(null);
        }}
      />
    </div>
  );
}
