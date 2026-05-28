import Link from "next/link";
import { MapPin, Truck, Package2, ShieldCheck, FileText, Tag, Flame, Leaf, Snowflake, TrendingUp } from "lucide-react";
import { Header } from "@/components/store/header";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

const WHAT_WE_CARRY = [
  {
    icon: Tag,
    title: "World Cup & Fan Gear",
    desc: "Car flags, embroidered caps, bucket hats, and mini boxing gloves for every football nation. MOQ from 12 — built for retailers and event resellers.",
    categories: ["Car Flags", "Caps", "Bucket Hats", "Boxing Gloves"],
  },
  {
    icon: Leaf,
    title: "Vape & Smoke Shop",
    desc: "Rolling papers, glass pipes, bongs, and lighters wholesale. Competitive pricing for variety stores, convenience chains, and specialty retailers.",
    categories: ["Rolling Papers", "Bongs & Pipes", "Lighters"],
  },
  {
    icon: Snowflake,
    title: "Seasonal & Winter",
    desc: "Winter gloves, toques, scarves, and cold-weather accessories. Strong demand every fall season — stock early, sell through winter.",
    categories: ["Winter Items"],
  },
  {
    icon: TrendingUp,
    title: "Trending Products",
    desc: "Fast-moving impulse buys and seasonal trends we source specifically for small and mid-size retail. We spot what moves before the big chains catch up.",
    categories: ["Accessories"],
  },
];

const WHY_B2B = [
  { icon: MapPin, title: "Toronto warehouse", desc: "Same-day pickup or next-business-day ship from our North York location. No waiting on overseas freight." },
  { icon: Truck, title: "Canada & USA shipping", desc: "Ship cross-border to US buyers. We handle the documentation — you focus on selling." },
  { icon: Package2, title: "MOQ from 1 case", desc: "Most items start at 12–50 units. No massive minimum orders — right-size your inventory." },
  { icon: ShieldCheck, title: "B2B pricing on approval", desc: "Register, get approved in 24 hours, unlock wholesale pricing immediately." },
  { icon: FileText, title: "Invoice + NET terms", desc: "Professional invoicing on every order. NET 30 available for established accounts." },
  { icon: Tag, title: "30+ years sourcing", desc: "We've been doing this since 1996. We know which products sell and which don't." },
];

export default async function AboutPage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <Header profile={profile} />
      <main>

        {/* ── Hero ── */}
        <section style={{ background: "var(--primary)" }} className="px-4 py-20 sm:py-28">
          <div className="container-shell max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-green-300">
              Toronto Wholesale · Est. 1996
            </p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              30 years supplying<br />Canadian retailers.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-green-100">
              From a small North York storefront to a wholesale B2B operation shipping across Canada and the USA.
              We carry fan gear, vape supplies, seasonal products, and trending items — all from our Toronto warehouse.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-green-900 transition-opacity hover:opacity-90" href="/products">
                Browse catalog
              </Link>
              <Link className="rounded-lg border border-green-400 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700" href="/register">
                Create B2B account
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-gray-100 bg-white">
          <div className="container-shell grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
            {[
              { value: "30+", label: "Years in business" },
              { value: "Toronto", label: "Warehouse location" },
              { value: "CA & USA", label: "Ships to" },
              { value: "24 hrs", label: "B2B approval time" },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-10 text-center">
                <p className="text-3xl font-black text-gray-900">{value}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Story ── */}
        <section className="border-b border-gray-100 bg-gray-50 px-4 py-16 sm:py-20">
          <div className="container-shell max-w-3xl">
            <p className="mb-4 section-label" style={{ color: "var(--primary)" }}>Our story</p>
            <h2 className="text-3xl font-black leading-snug text-gray-900 sm:text-4xl">
              Started from nothing.<br />Built through persistence.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-8 text-gray-600">
              <p>
                Our founder, <strong className="text-gray-900">James Kim</strong>, immigrated to Canada from Korea
                nearly 30 years ago and built his business from zero. Before Dollarama and online giants
                reshaped retail, he was supplying small retailers across Toronto with winter products, seasonal goods,
                and trending items — long days, one sale at a time.
              </p>
              <p>
                We've adapted through every market shift. When demand for mask supplies surged during COVID,
                we moved fast while larger distributors were still catching up. When the World Cup came to Canada,
                we were already stocked with car flags and fan gear. We know how to read what's next.
              </p>
              <p>
                Today, we operate a <strong className="text-gray-900">B2B wholesale portal</strong> out of our
                Toronto warehouse, serving retailers, convenience stores, variety shops, and event resellers
                across Canada and the United States.
              </p>
            </div>
          </div>
        </section>

        {/* ── Pull quote ── */}
        <section className="px-4 py-16" style={{ background: "var(--primary)" }}>
          <div className="container-shell max-w-3xl text-center">
            <p className="text-6xl font-black leading-none text-white/20">&ldquo;</p>
            <p className="text-2xl font-black leading-snug text-white sm:text-3xl">
              We never stopped adapting.<br />
              That&apos;s the only reason we&apos;re still here.
            </p>
            <p className="mt-6 text-sm font-semibold text-green-200">— James Kim, Founder</p>
          </div>
        </section>

        {/* ── What we carry ── */}
        <section className="border-b border-gray-100 bg-white px-4 py-16 sm:py-20">
          <div className="container-shell">
            <div className="mb-10 max-w-2xl">
              <p className="section-label mb-3" style={{ color: "var(--primary)" }}>Product range</p>
              <h2 className="text-3xl font-black text-gray-900">What we carry</h2>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Four core categories — all stocked in Toronto, all available for wholesale ordering through this portal.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {WHAT_WE_CARRY.map(({ icon: Icon, title, desc, categories: cats }) => (
                <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                  <div
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: "var(--primary-light)" }}
                  >
                    <Icon size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <h3 className="text-base font-black text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cats.map((cat) => (
                      <Link
                        key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why wholesale buyers ── */}
        <section className="border-b border-gray-100 bg-gray-50 px-4 py-16 sm:py-20">
          <div className="container-shell">
            <div className="mb-10">
              <p className="section-label mb-3" style={{ color: "var(--primary)" }}>Why choose us</p>
              <h2 className="text-3xl font-black text-gray-900">Built for business, not browsers.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_B2B.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-100 bg-white p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--primary-light)" }}>
                    <Icon size={16} style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="text-sm font-black text-gray-900">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Location ── */}
        <section className="border-b border-gray-100 bg-white px-4 py-16">
          <div className="container-shell max-w-3xl">
            <p className="section-label mb-3" style={{ color: "var(--primary)" }}>Where we are</p>
            <h2 className="text-2xl font-black text-gray-900">Toronto warehouse & pickup</h2>
            <div className="mt-6 flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--primary-light)" }}>
                <MapPin size={16} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p className="font-black text-gray-900">178 Bentworth Ave, North York, ON M6A 1P7</p>
                <p className="mt-1 text-sm text-gray-500">Monday – Friday · 9 AM – 5 PM ET</p>
                <p className="mt-1 text-sm text-gray-500">Same-day pickup available after order confirmation</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              We ship across Canada and to the United States. Shipping rates are calculated and confirmed
              after order review — we work with carriers to get the best rates for your order size.
            </p>
          </div>
        </section>

        {/* ── Founder quote ── */}
        <section className="bg-gray-50 px-4 py-16">
          <div className="container-shell max-w-3xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 sm:p-12">
              <p className="section-label mb-6" style={{ color: "var(--primary)" }}>From the founder</p>
              <blockquote className="text-lg font-medium leading-8 text-gray-700 sm:text-xl">
                &ldquo;We&apos;ve spent 30 years supplying retailers across Canada with quality products.
                Whether it&apos;s fan gear for the World Cup, rolling papers for convenience stores,
                or winter items before the season — we know what retailers need and how fast they need it.
                Every product we carry is something we&apos;d personally stand behind.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black text-white"
                  style={{ background: "var(--primary)" }}
                >
                  J
                </div>
                <div>
                  <p className="font-black text-gray-900">James Kim</p>
                  <p className="text-sm text-gray-400">Founder · Butterfly Fashion Trading</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-gray-100 px-4 py-16 sm:py-20">
          <div className="container-shell max-w-2xl text-center">
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Ready to order wholesale?
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-gray-500">
              Create a B2B account to unlock wholesale pricing. Approval typically takes under 24 hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/register">
                Create B2B account
              </Link>
              <Link className="btn-secondary px-6 py-2.5 text-sm" href="/products">
                Browse catalog
              </Link>
              <Link className="btn-ghost px-6 py-2.5 text-sm" href="/account/quotes">
                Request a quote
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
