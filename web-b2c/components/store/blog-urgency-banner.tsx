"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const KICKOFF = new Date("2026-06-12T23:00:00.000Z");
const ORDER_CUTOFF = new Date("2026-06-09T23:59:59.000Z");

interface Props {
  category: string;
  productSlug?: string;
}

export function BlogUrgencyBanner({ category, productSlug }: Props) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const diff = KICKOFF.getTime() - Date.now();
    setDays(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
  }, []);

  // Hide after tournament starts
  if (days === 0) return null;

  const isPanini = category === "Sticker Packs";
  const pastCutoff = Date.now() > ORDER_CUTOFF.getTime();

  const ctaHref = isPanini
    ? "/collections/panini-stickers"
    : productSlug
    ? `/products/${productSlug}`
    : "/products";

  const ctaLabel = isPanini ? "Shop Stickers →" : "Shop Fan Gear →";

  const urgencyLine = pastCutoff
    ? "In stock · Ships from Toronto today"
    : "Order by June 9 · Arrive before opening day";

  return (
    <div className="my-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-amber-900">
          {days !== null ? `⚡ ${days} days to World Cup kickoff` : "⚡ World Cup starts June 12"}
        </p>
        <p className="mt-0.5 text-xs text-amber-700 leading-5">{urgencyLine}</p>
      </div>
      <Link
        href={ctaHref}
        className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-black text-white hover:bg-brand-hover transition-colors uppercase tracking-wide"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
