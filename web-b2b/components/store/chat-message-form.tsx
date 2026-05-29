"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type Props = {
  action: (formData: FormData) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  extraFields?: React.ReactNode; // e.g. hidden profile_id input
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function ChatMessageForm({ action, placeholder = "Type your message…", submitLabel = "Send", extraFields }: Props) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("b2b-chat-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("b2b-chat-images").getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setPreview(null);
    setImageUrl(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = textRef.current?.value?.trim();
    if (!text && !imageUrl) return;

    const fd = new FormData(e.currentTarget);
    if (imageUrl) fd.set("image_url", imageUrl);

    startTransition(async () => {
      await action(fd);
      formRef.current?.reset();
      removeImage();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {extraFields}

      {/* Image preview */}
      {(preview || uploadError) && (
        <div className="border-b border-slate-100 px-4 pt-3 pb-2">
          {preview && (
            <div className="relative inline-block">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <Loader2 size={16} className="animate-spin text-slate-500" />
                  </div>
                )}
                <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
              >
                <X size={10} />
              </button>
            </div>
          )}
          {uploadError && <p className="mt-1 text-xs font-semibold text-red-500">{uploadError}</p>}
        </div>
      )}

      {/* Text area */}
      <textarea
        ref={textRef}
        name="content"
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none border-0 px-5 py-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-0"
      />

      {/* Actions bar */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
          >
            <ImagePlus size={13} />
            Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
          style={{ background: "var(--primary)" }}
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
