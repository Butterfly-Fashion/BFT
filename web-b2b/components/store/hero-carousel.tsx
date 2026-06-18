"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@/lib/types";

const ROTATE_MS = 5000;

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function BannerImage({ banner }: { banner: HeroBanner }) {
  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 sm:p-8">
          <h2 className="text-lg font-black text-white drop-shadow sm:text-2xl">{banner.title}</h2>
          {banner.subtitle && (
            <p className="mt-1 max-w-xl text-sm text-white/90 drop-shadow sm:text-base">{banner.subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  const go = useCallback((next: number) => {
    setIndex((next % count + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  // Touch swipe
  const touchX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
    touchX.current = null;
  }

  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="container-shell py-6 sm:py-8">
        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Slides track */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)`, aspectRatio: "16/6" }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="relative h-full w-full shrink-0 grow-0 basis-full">
                {banner.link_url ? (
                  isExternal(banner.link_url) ? (
                    <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                      <BannerImage banner={banner} />
                    </a>
                  ) : (
                    <Link href={banner.link_url} className="block h-full w-full">
                      <BannerImage banner={banner} />
                    </Link>
                  )
                ) : (
                  <BannerImage banner={banner} />
                )}
              </div>
            ))}
          </div>

          {count > 1 && (
            <>
              {/* Arrows */}
              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => go(index - 1)}
                className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-gray-700 shadow transition-colors hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => go(index + 1)}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-gray-700 shadow transition-colors hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots */}
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                {banners.map((banner, i) => (
                  <button
                    key={banner.id}
                    type="button"
                    aria-label={`Go to banner ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => go(i)}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === index ? 22 : 8,
                      background: i === index ? "var(--primary)" : "rgba(255,255,255,0.75)",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
