"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-lg"
        style={{ aspectRatio: "1717 / 916" }}
      >
        <Image
          src="/asset/hero-banner.jpg"
          alt="Canada Pride — FIFA World Cup 2026 fan gear"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) calc(100vw - 48px), 1152px"
        />

        {/* Shop Now button — positioned to match the image button area */}
        <button
          onClick={() => router.push("/products")}
          aria-label="Shop Now"
          className="absolute bg-[#C41E3A] hover:bg-[#A01830] active:scale-95 text-white font-black uppercase tracking-widest rounded-full shadow-xl transition-all duration-150 flex items-center gap-1.5"
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
    </section>
  );
}
