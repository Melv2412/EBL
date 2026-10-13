/**
 * Réduit les photos d'un formulaire avant l'envoi : une photo de téléphone (3 à 5 Mo)
 * passe à quelques centaines de Ko, ce qui rend l'envoi rapide même en 4G.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.82;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const toBlob = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, QUALITY));
    // WebP si le navigateur sait l'écrire (Safari ancien : non), sinon JPEG.
    let blob = await toBlob("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${ext}`, { type: blob.type });
  } catch {
    // Format que le navigateur ne sait pas lire (HEIC sur certains Android…) : on envoie tel quel.
    return file;
  }
}

export async function compressImages(fd: FormData): Promise<FormData> {
  const out = new FormData();
  for (const [key, value] of fd.entries()) {
    out.append(key, value instanceof File && value.size > 0 ? await shrink(value) : value);
  }
  return out;
}
