/**
 * Client-side receipt compression: downscale to a sane bound and
 * re-encode as JPEG before upload, so photos from phones don't push
 * multi-MB originals into storage.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.8 } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size < 400 * 1024) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality)
  );
}
