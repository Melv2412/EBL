"use client";

import Image from "next/image";
import { useState } from "react";
import type { HomeMode, HomeSettings } from "@/lib/home-settings";
import { HOME_SLIDES, orderedHomeSlides, type HomeSlide } from "@/lib/home-slides";
import { saveHomeSettings } from "./actions";
import { ActionForm, inputCls, labelCls } from "./form";
import { ImageInput } from "./image-input";

export function HomeSettingsForm({
  settings,
  imagesReady,
  finalLabel,
  championLabel,
}: {
  settings: HomeSettings;
  imagesReady: boolean;
  finalLabel: string | null;
  championLabel: string | null;
}) {
  const [mode, setMode] = useState<HomeMode>(settings.mode);
  const [slides, setSlides] = useState(() => settings.slides ?? orderedHomeSlides(settings.slide_order));
  const available = [...new Map([...HOME_SLIDES, ...(settings.slides ?? [])].map((slide) => [slide.id, slide])).values()];
  const removed = available.filter((slide) => !slides.some((selected) => selected.id === slide.id));

  const move = (from: number, to: number) => {
    setSlides((current) => {
      const next = [...current];
      const [slide] = next.splice(from, 1);
      next.splice(to, 0, slide);
      return next;
    });
  };

  return (
    <ActionForm action={saveHomeSettings} submit="Enregistrer l'accueil">
      <label className={labelCls}>
        <span>Affichage sous la navigation</span>
        <select name="home_mode" value={mode} onChange={(event) => setMode(event.target.value as HomeMode)} className={inputCls}>
          <option value="auto">Automatique</option>
          <option value="final" disabled={!finalLabel}>Finale attendue</option>
          <option value="champion" disabled={!championLabel}>Champion</option>
          <option value="slideshow">Diaporama</option>
        </select>
      </label>
      <p className="text-sm text-ink-soft" role="status">
        {mode === "auto" && (finalLabel ? `Finale ${finalLabel}` : championLabel ?? "Diaporama")}
        {mode === "final" && (finalLabel ? `Finale ${finalLabel}` : "Aucune finale en attente : le diaporama est affiché.")}
        {mode === "champion" && (championLabel ?? "Aucun champion connu : le diaporama est affiché.")}
        {mode === "slideshow" && `${slides.length} photos`}
      </p>
      {slides.map((slide) => <input key={slide.id} type="hidden" name="slide" value={slide.id} />)}
      <details className="border-y border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Photos du diaporama ({slides.length})</summary>
        {!imagesReady && (
          <p className="mt-3 text-sm text-ink-soft">
            Ajout, retrait et cadrage indisponibles : applique la migration <code>0011_homepage_slides.sql</code> dans Supabase.
          </p>
        )}
        {slides.length === 0 && <p className="mt-3 text-sm text-ink-soft">Aucune photo : seul le terrain sera affiché.</p>}
        <ol className="mt-4 grid gap-5 sm:grid-cols-2">
          {slides.map((slide, index) => (
            <li key={slide.id} className="min-w-0 space-y-2">
              <SlideFraming
                slide={slide}
                number={index + 1}
                disabled={!imagesReady}
                onChange={(position) => setSlides((current) => current.map((entry) => entry.id === slide.id ? { ...entry, position } : entry))}
              />
              <label className={labelCls}>
                <span>Ordre d&apos;affichage</span>
                <select value={index} onChange={(event) => move(index, Number(event.target.value))} className={inputCls} aria-label={`Position de la photo ${slide.id}`}>
                  {slides.map((option, position) => <option key={option.id} value={position}>{position + 1}</option>)}
                </select>
              </label>
              {imagesReady && (
                <button
                  type="button"
                  aria-label={`Retirer la photo ${index + 1} du diaporama`}
                  onClick={() => setSlides((current) => current.filter((entry) => entry.id !== slide.id))}
                  className="min-h-11 px-2 text-sm font-medium text-red-500 hover:underline"
                >
                  Retirer
                </button>
              )}
            </li>
          ))}
        </ol>
        {imagesReady && (
          <div className="mt-5 space-y-4 border-t border-line pt-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Ajouter une photo</p>
              <ImageInput name="new_slide" />
            </div>
            {removed.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">Photos disponibles ({removed.length})</summary>
                <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {removed.map((slide, index) => (
                    <li key={slide.id} className="min-w-0 space-y-2">
                      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-night">
                        <Image src={slide.src} alt={`Photo disponible ${index + 1}`} fill sizes="(min-width: 640px) 200px, 45vw" className="object-contain" />
                      </div>
                      <button
                        type="button"
                        aria-label={`Ajouter la photo disponible ${index + 1} au diaporama`}
                        onClick={() => setSlides((current) => [...current, slide])}
                        className="min-h-11 px-2 text-sm font-semibold text-teal hover:underline"
                      >
                        Ajouter
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </details>
    </ActionForm>
  );
}

function SlideFraming({ slide, number, disabled, onChange }: {
  slide: HomeSlide;
  number: number;
  disabled: boolean;
  onChange: (position: { x: number; y: number }) => void;
}) {
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const position = slide.position ?? { x: 50, y: 50 };

  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-2 text-sm font-semibold">Cadrage de la photo {number}</legend>
      <div role="group" aria-label={`Format d'aperçu de la photo ${number}`} className="flex gap-1 border-b border-line">
        {(["desktop", "mobile"] as const).map((format) => (
          <button
            key={format}
            type="button"
            aria-pressed={preview === format}
            onClick={() => setPreview(format)}
            className={`min-h-11 flex-1 border-b-2 px-2 text-sm font-medium ${preview === format ? "border-teal text-teal" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {format === "desktop" ? "Ordinateur" : "Téléphone"}
          </button>
        ))}
      </div>
      <div className="flex h-64 items-center justify-center overflow-hidden rounded-lg bg-night">
        <div
          className="relative max-w-full overflow-hidden"
          style={{ width: preview === "desktop" ? "100%" : 168, aspectRatio: preview === "desktop" ? "1440 / 630" : "390 / 591" }}
        >
          <Image
            src={slide.src}
            alt={`Cadrage ${preview === "desktop" ? "ordinateur" : "téléphone"} de la photo ${number}`}
            fill
            sizes="(min-width: 640px) 420px, 90vw"
            className="object-cover"
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
          />
        </div>
      </div>
      <label className={labelCls}>
        <span className="flex justify-between gap-2"><span>Gauche / droite</span><span className="tabular-nums">{position.x} %</span></span>
        <input
          type="range"
          name={`focus_x_${slide.id}`}
          min={0}
          max={100}
          step={1}
          value={position.x}
          disabled={disabled}
          onChange={(event) => onChange({ ...position, x: Number(event.target.value) })}
          className="h-11 w-full accent-teal disabled:opacity-40"
        />
      </label>
      <label className={labelCls}>
        <span className="flex justify-between gap-2"><span>Haut / bas</span><span className="tabular-nums">{position.y} %</span></span>
        <input
          type="range"
          name={`focus_y_${slide.id}`}
          min={0}
          max={100}
          step={1}
          value={position.y}
          disabled={disabled}
          onChange={(event) => onChange({ ...position, y: Number(event.target.value) })}
          className="h-11 w-full accent-teal disabled:opacity-40"
        />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ x: 50, y: 50 })}
        className="min-h-11 px-2 text-sm font-medium text-teal hover:underline disabled:opacity-40"
      >
        Recentrer
      </button>
    </fieldset>
  );
}