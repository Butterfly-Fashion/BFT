import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Truck, Package, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | World Fan Gear",
  description:
    "Nearly 30 years of Toronto wholesale experience, now online. World Fan Gear is an immigrant-founded family business bringing FIFA World Cup 2026 fan gear directly to Canadian fans.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-white">

      {/* ── 1. HERO ── */}
      <section className="relative h-[60vh] min-h-105 w-full overflow-hidden">
        <Image
          src="/about-store.png"
          alt="World Fan Gear store in North York, Toronto"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            North York, Toronto · Est. 1996
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            30 years in the making.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80">
            From a small Toronto store to Canada's FIFA 2026 fan gear destination.
          </p>
        </div>
      </section>

      {/* ── 2. STATS BAR ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-gray-200 sm:grid-cols-4">
          {[
            { value: "30+", label: "Years in business" },
            { value: "175+", label: "Products & growing" },
            { value: "CA & USA", label: "Shipping destinations" },
            { value: "Toronto", label: "Ships from" },
          ].map(({ value, label }) => (
            <div key={label} className="px-6 py-8 text-center">
              <p className="text-3xl font-black text-gray-900">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. ORIGIN STORY ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">The Beginning</p>
        <h2 className="text-3xl font-black leading-snug text-gray-900 sm:text-4xl">
          Started from nothing.<br />Built through persistence.
        </h2>
        <div className="mt-8 space-y-5 text-base leading-8 text-gray-600">
          <p>
            Our founder, <strong className="text-gray-900">James Kim</strong>, immigrated to Canada
            from Korea nearly 30 years ago and started his business from scratch. Before large
            discount chains and online shopping took over, he built his livelihood selling winter
            products and seasonal goods — one long day at a time.
          </p>
          <p>
            Like many small immigrant-owned businesses, we faced serious pressure as retailers
            like Dollarama reshaped the market. At one point, we nearly lost everything.
            But we never stopped adapting.
          </p>
        </div>
      </section>

      {/* ── 4. PULL QUOTE ── */}
      <section className="bg-[#C41E3A] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
            &ldquo;We never stopped adapting.
            That&apos;s the only reason we&apos;re still here.&rdquo;
          </p>
          <p className="mt-6 text-sm font-semibold text-white/70">— James Kim, Founder</p>
        </div>
      </section>

      {/* ── 5. RESILIENCE ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">Resilience</p>
        <h2 className="text-3xl font-black leading-snug text-gray-900 sm:text-4xl">
          COVID didn't stop us.<br />It reminded us who we are.
        </h2>
        <div className="mt-8 space-y-5 text-base leading-8 text-gray-600">
          <p>
            During the pandemic, we became known again by moving fast — supplying masks and
            trending products at a time when large corporations overlooked fast-moving seasonal
            demand. Staying flexible and acting quickly let us survive and rebuild when others
            couldn't.
          </p>
          <p>
            The FIFA World Cup has always been something special to us. For years we sold flags,
            fan gear, and football merchandise through our local Toronto stores — watching
            firsthand how football brings together people from every culture and community in
            this city.
          </p>
        </div>
      </section>

      {/* ── 6. STORE SECTION ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-5xl items-center gap-0 sm:grid-cols-2">
          <div className="relative aspect-4/3 overflow-hidden">
            <Image
              src="/about-store.png"
              alt="World Fan Gear store front with international flags"
              fill
              className="object-cover"
            />
          </div>
          <div className="px-8 py-12 sm:px-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
              Our Store
            </p>
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              The same passion, now online.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              What started as a physical store in North York is now reaching fans across
              Canada and the United States. The flags, the energy, the merchandise — it&apos;s
              all still here. Just easier to find.
            </p>
            <div className="mt-6 flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#C41E3A]" />
              <div>
                <p className="text-sm font-bold text-gray-900">178 Bentworth Ave, North York, ON M6A 1P7</p>
                <p className="mt-0.5 text-xs text-gray-500">Local pickup available — contact us after ordering</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. NEXT CHAPTER ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">The Next Chapter</p>
        <h2 className="text-3xl font-black leading-snug text-gray-900 sm:text-4xl">
          30 years of experience.<br />A new generation of ideas.
        </h2>
        <div className="mt-8 space-y-5 text-base leading-8 text-gray-600">
          <p>
            <strong className="text-gray-900">FIFA2026.ca is the next chapter of our journey</strong> —
            built together with University of Waterloo students passionate about technology,
            design, and football culture. By combining decades of real-world business experience
            with a new generation&apos;s creativity and digital skills, we&apos;re building a better
            World Cup shopping experience for fans across Canada.
          </p>
          <p>
            We are not just selling products. We are sharing over 30 years of immigrant
            business history, resilience, and the passion that the World Cup brings to
            people around the world.
          </p>
        </div>
      </section>

      {/* ── 8. WHY US ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
            Why World Fan Gear
          </p>
          <h2 className="mb-10 text-center text-2xl font-black text-gray-900 sm:text-3xl">
            What sets us apart
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Official licensed products", body: "Panini, Funko Pop, Minix — sourced directly, not knockoffs." },
              { icon: Package, title: "Wholesale-grade quality", body: "30 years selecting product means we know what holds up and what doesn't." },
              { icon: Truck, title: "Ships Canada & USA", body: "Same-day dispatch before 2 PM ET. Free pickup for GTA locals." },
              { icon: MapPin, title: "Local Toronto roots", body: "A real store, a real team. Not a faceless dropshipping operation." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C41E3A]/10">
                  <Icon size={18} className="text-[#C41E3A]" />
                </div>
                <p className="font-black text-gray-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FOUNDER ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-12">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">From the Founder</p>
          <blockquote className="text-lg font-medium leading-8 text-gray-700 sm:text-xl">
            &ldquo;We&apos;ve spent 30 years supplying retailers across Canada with quality products.
            When the World Cup came to Canada, it felt like the right moment to give fans
            direct access to the same merchandise — without the retail markup.
            Every item we carry is something we&apos;d personally stand behind.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C41E3A] text-lg font-black text-white">
              J
            </div>
            <div>
              <p className="font-black text-gray-900">James Kim</p>
              <p className="text-sm text-gray-400">Founder · World Fan Gear &amp; Butterfly Fashion Trading</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. CTA ── */}
      <section className="border-t border-gray-100 px-4 py-16 text-center sm:py-20">
        <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
          Ready to gear up for 2026?
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-gray-500">
          Canada, USA, Mexico — the biggest World Cup ever. Don&apos;t miss it without your colours on.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-[#C41E3A] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#A01830]"
          >
            Shop fan gear
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 hover:border-gray-400"
          >
            Contact us
          </Link>
        </div>
      </section>

    </div>
  );
}
