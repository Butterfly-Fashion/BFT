"use client";

import { useState } from "react";

interface Props {
  source?: "footer" | "inline";
  variant?: "dark" | "light";
}

export function NewsletterForm({ source = "footer", variant = "dark" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className={`text-sm font-semibold ${variant === "dark" ? "text-[#FFD700]" : "text-brand"}`}>
        You&apos;re in! We&apos;ll send you the best 2026 fan deals.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={status === "loading"}
        className={`flex-1 px-4 py-2.5 rounded-full text-sm border outline-none transition-colors ${
          variant === "dark"
            ? "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white/60"
            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-5 py-2.5 rounded-full font-semibold text-sm bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {status === "loading" ? "Joining…" : "Join the 2026 Fan List"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-1 sm:col-span-2">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
