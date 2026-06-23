"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { B2B_CONTACT_URL } from "@/lib/site-mode";

const INTERVAL_MS = 5000;

interface Slide {
  id: string;
  render: (active: boolean) => React.ReactNode;
}

function JerseySlide() {
  return (
    <div className="relative flex h-full w-full bg-linear-to-br from-[#b51224] to-[#7a0c19]">
      <div className="relative z-10 flex w-[52%] flex-col justify-center pl-[5%] pr-[2%]">
        <p
          className="font-bold uppercase tracking-widest text-white/70"
          style={{ fontSize: "clamp(0.5rem, 1.1vw, 0.8rem)" }}
        >
          Wholesale · Canada 2026 Fan Gear
        </p>
        <h2
          className="mt-2 font-black leading-tight text-white"
          style={{ fontSize: "clamp(1.1rem, 3.2vw, 2.6rem)" }}
        >
          Jerseys, caps & flags.
          <br />
          Wholesale prices.
        </h2>
        <p
          className="mt-2 text-white/80"
          style={{ fontSize: "clamp(0.6rem, 1.3vw, 0.95rem)" }}
        >
          B2B bulk supply across Canada — contact us for pricing. Better prices the more you order.
        </p>
        <div className="mt-4 sm:mt-6">
          <a
            href={B2B_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get B2B wholesale pricing"
            className="inline-flex items-center gap-1.5 rounded-full bg-white font-black uppercase tracking-widest text-[#b51224] shadow-xl transition-all duration-150 hover:bg-gray-100 active:scale-95"
            style={{
              fontSize: "clamp(0.6rem, 1.4vw, 1rem)",
              padding: "clamp(6px, 1.2vw, 14px) clamp(14px, 3vw, 36px)",
            }}
          >
            Get B2B Pricing ›
          </a>
        </div>
      </div>
      <div className="relative w-[48%]">
        <Image
          src="/asset/jersey/canada-home-kit-main.webp"
          alt="Canada soccer jersey and shorts set"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 640px) 50vw, 560px"
        />
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  { id: "jersey-hero",  render: () => <JerseySlide /> },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMultipleSlides = SLIDES.length > 1;

  const go = useCallback((index: number) => {
    const next = (index + SLIDES.length) % SLIDES.length;
    setCurrent(next);
    setLoaded((prev) => new Set(prev).add(next));
  }, []);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // auto-advance
  useEffect(() => {
    if (!hasMultipleSlides || paused) return;
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, hasMultipleSlides, paused, next]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-lg"
        style={{ aspectRatio: "1717 / 916" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* slides — non-first slides are only mounted once they've been shown */}
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
          >
            {loaded.has(i) && slide.render(i === current)}
          </div>
        ))}

        {hasMultipleSlides && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm transition-colors"
              style={{ width: "clamp(28px, 4vw, 44px)", height: "clamp(28px, 4vw, 44px)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ width: "clamp(12px, 1.8vw, 20px)", height: "clamp(12px, 1.8vw, 20px)" }}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm transition-colors"
              style={{ width: "clamp(28px, 4vw, 44px)", height: "clamp(28px, 4vw, 44px)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ width: "clamp(12px, 1.8vw, 20px)", height: "clamp(12px, 1.8vw, 20px)" }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* dot indicators */}
        {hasMultipleSlides && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === current ? "clamp(18px, 2.5vw, 28px)" : "clamp(6px, 0.8vw, 9px)",
                height: "clamp(6px, 0.8vw, 9px)",
                background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>}

        {/* progress bar */}
        {hasMultipleSlides && !paused && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
            <div
              key={current}
              className="h-full bg-white/70"
              style={{
                animation: `carousel-progress ${INTERVAL_MS}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes carousel-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
