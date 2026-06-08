"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5000;

interface Slide {
  id: string;
  render: (active: boolean) => React.ReactNode;
}

function HeroSlide() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full">
      <Image
        src="/asset/hero-banner.jpg"
        alt="Canada Pride — FIFA World Cup 2026 fan gear"
        fill
        priority
        className="object-cover object-center"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) calc(100vw - 48px), 1152px"
      />
      <button
        onClick={() => router.push("/products")}
        aria-label="Shop Now"
        className="absolute bg-brand hover:bg-brand-hover active:scale-95 text-white font-black uppercase tracking-widest rounded-full shadow-xl transition-all duration-150 flex items-center gap-1.5"
        style={{
          left: "3.8%",
          bottom: "14%",
          fontSize: "clamp(0.6rem, 1.4vw, 1rem)",
          padding: "clamp(6px, 1.2vw, 14px) clamp(14px, 3vw, 36px)",
        }}
      >
        Shop Now
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

function StickerHeroSlide() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full">
      <Image
        src="/asset/sticker-hero.png"
        alt="Panini FIFA World Cup 2026 Official Sticker Collection"
        fill
        priority
        className="object-cover object-center"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) calc(100vw - 48px), 1152px"
      />
      <button
        onClick={() => router.push("/collections/panini-stickers")}
        aria-label="Shop Stickers"
        className="absolute bg-[#FFD700] hover:bg-yellow-400 active:scale-95 text-[#0d1b3e] font-black uppercase tracking-widest rounded-full shadow-xl transition-all duration-150 flex items-center gap-1.5"
        style={{
          left: "3.8%",
          bottom: "14%",
          fontSize: "clamp(0.6rem, 1.4vw, 1rem)",
          padding: "clamp(6px, 1.2vw, 14px) clamp(14px, 3vw, 36px)",
        }}
      >
        Shop Stickers ›
      </button>
    </div>
  );
}

function BundleSlide() {
  return (
    <div className="relative w-full h-full">
      <Image
        src="/asset/stickers/fwc26_bundle_main.png"
        alt="Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box"
        fill
        className="object-contain object-center bg-[#0d1b3e] p-[5%]"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) calc(100vw - 48px), 1152px"
      />
      <Link
        href="/products/panini-fifa-world-cup-2026-bundle-album-sticker-box"
        aria-label="Shop the Bundle"
        className="absolute bg-brand hover:bg-brand-hover active:scale-95 text-white font-black uppercase tracking-widest rounded-full shadow-xl transition-all duration-150 flex items-center gap-1.5"
        style={{
          right: "4%",
          bottom: "14%",
          fontSize: "clamp(0.6rem, 1.4vw, 1rem)",
          padding: "clamp(6px, 1.2vw, 14px) clamp(14px, 3vw, 36px)",
        }}
      >
        Get the Bundle ›
      </Link>
    </div>
  );
}

const SLIDES: Slide[] = [
  { id: "sticker-hero", render: () => <StickerHeroSlide /> },
  { id: "hero",         render: () => <HeroSlide /> },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((index: number) => {
    const next = (index + SLIDES.length) % SLIDES.length;
    setCurrent(next);
    setLoaded((prev) => new Set(prev).add(next));
  }, []);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

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

        {/* prev / next arrows */}
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

        {/* dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
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
        </div>

        {/* progress bar */}
        {!paused && (
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
