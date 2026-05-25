"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const KICKOFF = new Date("2026-06-12T23:00:00.000Z");
const ORDER_CUTOFF = new Date("2026-06-09T23:59:59.000Z");

function getDaysLeft() {
  const diff = KICKOFF.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function MobileUrgencyBanner() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(getDaysLeft());
  }, []);

  // Hide on desktop (sm and above)
  // Hide after kickoff
  if (days === 0) return null;

  const pastCutoff = Date.now() > ORDER_CUTOFF.getTime();

  return (
    <div className="sm:hidden">
      {/* Top urgency strip */}
      <div className="bg-[#C41E3A] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-white font-black text-sm leading-tight">
              {days !== null ? (
                <>⚡ {days} days to kickoff</>
              ) : (
                <>⚡ World Cup starts June 12</>
              )}
            </p>
            <p className="text-white/80 text-[11px] mt-0.5">
              {pastCutoff
                ? "Order now · Ships from Toronto"
                : "Order by June 9 · Arrive before opening day"}
            </p>
          </div>
          <Link
            href="/products"
            className="shrink-0 rounded-full bg-white text-[#C41E3A] px-4 py-2 text-xs font-black uppercase tracking-wide hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* Category quick-links */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {[
            { label: "🧢 Caps", href: "/collections/world-cup-caps" },
            { label: "🪣 Bucket Hats", href: "/collections/world-cup-bucket-hats" },
            { label: "🚗 Car Flags", href: "/collections/world-cup-car-flags" },
            { label: "🥊 Boxing Gloves", href: "/collections/souvenir-boxing-gloves" },
            { label: "🎴 Stickers", href: "/collections/panini-stickers" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
