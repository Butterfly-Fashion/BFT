"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/resize-image";

// File input that auto-resizes the chosen image in the browser, then carries
// the optimized file in a hidden input (named `name`) that submits with the
// form. The hidden input starts empty, so submitting before optimizing
// finishes simply sends no new image (safe) rather than the oversized original.
export function CoverImageInput({
  name,
  defaultPreviewUrl,
}: {
  name: string;
  defaultPreviewUrl?: string | null;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultPreviewUrl || "");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const optimized = await resizeImage(file, { maxDim: 1600, quality: 0.82 });
      const transfer = new DataTransfer();
      transfer.items.add(optimized);
      if (hiddenRef.current) hiddenRef.current.files = transfer.files;
      setPreview(URL.createObjectURL(optimized));
      setInfo(`${Math.round(optimized.size / 1024)} KB`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      {preview && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={preview} alt="cover" className="aspect-video w-full rounded-lg border border-slate-200 object-cover" />
      )}
      {/* Submitted with the form; filled programmatically after resize */}
      <input ref={hiddenRef} name={name} type="file" accept="image/*" className="hidden" />
      {/* Visible picker — not submitted */}
      <input className="field" type="file" accept="image/*" onChange={handlePick} disabled={busy} />
      <p className="text-xs text-slate-400">
        {busy
          ? "Optimizing…"
          : info
          ? `Optimized to ~${info} — uploads fast.`
          : "Optional. Auto-resized to a web-friendly size on upload."}
      </p>
    </div>
  );
}
