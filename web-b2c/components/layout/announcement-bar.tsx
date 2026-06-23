"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WHOLESALE_MODE, B2B_CONTACT_URL } from "@/lib/site-mode";

export function AnnouncementBar() {
  if (WHOLESALE_MODE) return <WholesaleAnnouncementBar />;
  return <RetailAnnouncementBar />;
}

function WholesaleAnnouncementBar() {
  return (
    <div className="bg-[#003876] text-white">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <span className="text-white/90">Wholesale · B2B · Canada-wide</span>
        <span className="text-white/30">·</span>
        <a
          href={B2B_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-300 font-black hover:underline"
        >
          Contact us for B2B pricing →
        </a>
      </div>
    </div>
  );
}

// June 12, 2026 7:00 PM ET — first match at BMO Field
const KICKOFF = new Date("2026-06-12T23:00:00.000Z");
const ORDER_CUTOFF = new Date("2026-06-09T23:59:59.000Z");
// World Cup 2026 final — July 19, 2026, MetLife Stadium, NJ. Once this passes,
// drop all "kickoff is coming" copy so the bar doesn't reference a finished event.
const TOURNAMENT_END = new Date("2026-07-19T23:59:59.000Z");

function getTimeLeft() {
  const diff = KICKOFF.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
  };
}

function RetailAnnouncementBar() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());
    const clock = setInterval(() => setTimeLeft(getTimeLeft()), 60_000);
    return () => clearInterval(clock);
  }, []);

  const now = Date.now();
  const live = now >= KICKOFF.getTime() && now < TOURNAMENT_END.getTime();
  const ended = now >= TOURNAMENT_END.getTime();
  const showCutoff = mounted && now < ORDER_CUTOFF.getTime();

  const items: { text: string; yellow?: boolean; href?: string }[] = [
    ...(ended
      ? [{ text: "World Cup 2026 Fan Gear · Ships from Toronto" }]
      : live
      ? [{ text: "🔥 World Cup 2026 is live — shop fan gear", yellow: true, href: "/products" }]
      : mounted && timeLeft
      ? [{ text: `⏱ ${timeLeft.days} days ${timeLeft.hours}h to kickoff`, yellow: true }]
      : [{ text: "World Cup 2026 · June 12" }]),
    ...(showCutoff
      ? [{ text: "Order by June 9 for delivery before opening day", href: "/products" }]
      : []),
    { text: "Ships from Toronto · Canada-wide delivery" },
    { text: "Est. 1996 · Trusted Toronto retailer", yellow: true },
    { text: "Local pickup available · North York, ON", href: "/location" },
  ];

  // Auto-rotate with fade
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const current = items[idx] ?? items[0];

  return (
    <div className="bg-[#003876] text-white">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-0">

        {/* Mobile */}
        <div className="sm:hidden flex items-center justify-between w-full gap-3">
          <span className="text-xs font-black uppercase tracking-wide">
            {ended
              ? "World Cup 2026 Fan Gear"
              : live
              ? "🔥 World Cup 2026 is live"
              : mounted && timeLeft
              ? `⏱ ${timeLeft.days}d ${timeLeft.hours}h to kickoff`
              : "World Cup 2026 · June 12"}
          </span>
          {showCutoff && (
            <Link
              href="/products"
              className="shrink-0 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-brand-hover transition-colors"
            >
              Order Now →
            </Link>
          )}
        </div>

        {/* Desktop: single rotating item */}
        <div className="hidden sm:flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wide min-h-5">
          <div
            className="transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {current.href ? (
              <Link href={current.href} className={`hover:underline ${current.yellow ? "text-yellow-300 font-black" : "text-white/90"}`}>
                {current.text}
              </Link>
            ) : (
              <span className={current.yellow ? "text-yellow-300 font-black" : "text-white/90"}>
                {current.text}
              </span>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-1 ml-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true); }, 200); }}
                className={`rounded-full transition-all ${i === idx ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
