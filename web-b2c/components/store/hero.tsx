import Link from "next/link";

export function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,30,58,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-[#C41E3A]/10 text-[#C41E3A] rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <span>⚽</span>
          <span>Canada · Mexico · USA · 2026</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
          Gear Up for the
          <br />
          <span className="text-[#C41E3A]">Beautiful Game</span>
        </h1>

        {/* Subline */}
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Premium World Cup 2026 merchandise for Canadian fans. Jerseys,
          hats, scarves, and collectibles — shipped from Toronto.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors duration-150 text-sm shadow-sm"
          >
            Shop Now
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-gray-900 text-gray-900 font-semibold rounded-full hover:bg-gray-900 hover:text-white transition-colors duration-150 text-sm"
          >
            Browse Collection
          </Link>
        </div>

        {/* Free shipping note */}
        <p className="mt-6 text-xs text-gray-400 font-medium">
          Free shipping on orders over $99 · Easy 30-day returns
        </p>
      </div>
    </section>
  );
}
