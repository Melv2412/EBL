export type HomeSlide = { id: string; src: string; position?: { x: number; y: number } };

export const HOME_SLIDES: HomeSlide[] = Array.from({ length: 14 }, (_, index) => {
  const id = `photo-${String(index + 1).padStart(2, "0")}`;
  return { id, src: `/photos/diaporama/${id}.webp` };
});

export function orderedHomeSlides(order: string[]) {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...HOME_SLIDES].sort(
    (first, second) => (positions.get(first.id) ?? order.length) - (positions.get(second.id) ?? order.length),
  );
}