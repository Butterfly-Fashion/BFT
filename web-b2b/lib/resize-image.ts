// Client-side image downscaling. Runs in the browser before upload so large
// photos (phone cameras produce 3–8 MB files) are shrunk to a web-friendly
// size, keeping Server Action payloads small and pages fast.

type ResizeOptions = {
  maxDim?: number; // longest edge in px
  quality?: number; // 0–1 for the encoder
};

export async function resizeImage(
  file: File,
  { maxDim = 1600, quality = 0.82 }: ResizeOptions = {},
): Promise<File> {
  // Leave vector/animated formats untouched — canvas would flatten them.
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // decoding unsupported — fall back to original
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  // Keep the original if the re-encode didn't actually help (small images).
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
}
