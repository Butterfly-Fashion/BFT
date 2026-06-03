"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// June 12, 2026 7:00 PM ET — first match at BMO Field
const KICKOFF = new Date("2026-06-12T23:00:00.000Z"); // 7 PM ET = 23:00 UTC
// Order cutoff: June 9 (3 days before for Canada Post to deliver)
const ORDER_CUTOFF = new Date("2026-06-09T23:59:59.000Z");

function getTimeLeft() {
  const now = Date.now();
  const diff = KICKOFF.getTime() - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins };
}

function isBeforeOrderCutoff() {
  return Date.now() < ORDER_CUTOFF.getTime();
}

export function AnnouncementBar() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  const showCutoffWarning = mounted && isBeforeOrderCutoff();

  return (
    <div className="bg-[#003876] text-white">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-0">

        {/* Mobile: single focused line */}
        <div className="sm:hidden flex items-center justify-between w-full gap-3">
          {mounted && timeLeft ? (
            <span className="text-xs font-black uppercase tracking-wide">
              ⏱ {timeLeft.days}d {timeLeft.hours}h to kickoff
            </span>
          ) : (
            <span className="text-xs font-black uppercase tracking-wide">
              World Cup 2026 · June 12
            </span>
          )}
          {showCutoffWarning && (
            <Link
              href="/products"
              className="shrink-0 rounded-full bg-[#C41E3A] px-3 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-[#A01830] transition-colors"
            >
              Order Now →
            </Link>
          )}
        </div>

        {/* Desktop: full info strip */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold uppercase tracking-widest">
          {mounted && timeLeft ? (
            <span className="font-black text-yellow-300">
              ⏱ {timeLeft.days} days {timeLeft.hours}h to kickoff
            </span>
          ) : (
            <span>World Cup 2026 · June 12</span>
          )}
          <span className="text-white/40">·</span>
          {showCutoffWarning && (
            <>
              <span className="text-white/80">Order by June 9 for delivery before opening day</span>
              <span className="text-white/40">·</span>
            </>
          )}
          <span>Ships from Toronto</span>
          <span className="text-white/40">·</span>
          <span>Canada-wide delivery</span>
          <span className="text-white/40">·</span>
          <span className="text-yellow-300 font-black">Est. 1987 · Toronto</span>
        </div>
      </div>
    </div>
  );
}
