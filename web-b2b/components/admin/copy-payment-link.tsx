"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

export function CopyPaymentLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Hi! Here's the secure payment link for your Butterfly Fashion order: ${url}`
  )}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="card mb-4 flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
          Copy and send manually
        </p>
        <p className="truncate text-sm font-bold text-slate-700" title={url}>
          {url}
        </p>
      </div>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary shrink-0 gap-2 text-xs"
      >
        <MessageCircle size={13} /> WhatsApp
      </a>
      <button
        onClick={handleCopy}
        type="button"
        className={`btn-${copied ? "primary" : "secondary"} shrink-0 gap-2 text-xs`}
      >
        {copied ? (
          <><Check size={13} /> Copied!</>
        ) : (
          <><Copy size={13} /> Copy Link</>
        )}
      </button>
    </div>
  );
}
