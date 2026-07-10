import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Truck, Package2, ShieldCheck, FileText, Tag, Snowflake, Gamepad2, Phone } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { contactTel } from "@/lib/contact";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Butterfly Fashion Trading — over 30 years supplying Canadian retailers from our Toronto warehouse with wholesale variety, novelty, and seasonal goods.",
  alternates: { canonical: "/about" },
};

// Categories must match the real catalog so chips link to live pages and the
// preview image loads. Only categories that actually have products are shown.
const CATEGORY_GROUPS = [
  {
    icon: Snowflake,
    title: "Winter Accessories",
    desc: "Gloves, toques, balaclavas and masks. Strong seasonal demand every fall — stock early and sell through winter.",
    categories: ["Winter Gloves", "Winter Hats", "Winter Masks"],
    queryCategories: ["Winter Gloves", "Winter Hats", "Winter Masks"],
  },
  {
    icon: Gamepad2,
    title: "Fidget & Novelty Toys",
    desc: "Squishies, fidgets and trending novelty toys — fast-moving impulse buys for variety, gift and convenience stores.",
    categories: ["Fidget Toy"],
    queryCategories: ["Fidget Toy"],
  },
];

const WHY_B2B = [
  { icon: MapPin, title: "Toronto warehouse", desc: "Same-day pickup or next-business-day ship from our North York location. No waiting on overseas freight." },
  { icon: Truck, title: "Canada & USA shipping", desc: "Ship cross-border to US buyers. We handle the documentation — you focus on selling." },
  { icon: Package2, title: "No minimum order", desc: "Order any quantity — single units or full cases. Case pricing gives a better per-unit rate on bulk." },
  { icon: ShieldCheck, title: "Instant B2B pricing", desc: "Register and unlock wholesale pricing immediately — no approval wait." },
  { icon: FileText, title: "Invoice + NET terms", desc: "Professional invoicing on every order. NET 30 available for established accounts." },
  { icon: Tag, title: "30+ years sourcing", desc: "We've been doing this since 1996. We know which products sell and which don't." },
];

async function fetchCategoryImage(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, categories: string[]) {
  const { data } = await supabase
    .from("products")
    .select("image_url, name")
    .in("category", categories)
    .eq("is_hidden", false)
    .not("image_url", "is", null)
    .limit(1)
    .single();
  return data ? { url: data.image_url as string, alt: data.name as string } : null;
}

type TrendingProduct = { name: string; slug: string; image_url: string | null; category: string | null };

async function fetchTrendingProducts(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data } = await supabase
    .from("products")
    .select("name, slug, image_url, category")
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"])
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);
  return (data ?? []) as TrendingProduct[];
}

async function fetchPresentCategories(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data } = await supabase
    .from("products")
    .select("category")
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"]);
  return new Set((data ?? []).map((p) => p.category).filter(Boolean));
}

/** Round-robin one product per category so the list spans categories, not 8 of one type. */
function pickDiverse(products: TrendingProduct[], max: number): TrendingProduct[] {
  const buckets = new Map<string, TrendingProduct[]>();
  for (const p of products) {
    const c = p.category || "Other";
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(p);
  }
  const lists = [...buckets.values()];
  const result: TrendingProduct[] = [];
  let i = 0;
  while (result.length < max && lists.some((l) => l.length)) {
    const list = lists[i % lists.length];
    if (list.length) result.push(list.shift()!);
    i += 1;
  }
  return result;
}

export default async function AboutPage() {
  const [profile, supabase] = await Promise.all([
    getCurrentProfile(),
    createSupabaseServerClient(),
  ]);

  const [categoryImages, trendingRaw, presentCategories] = await Promise.all([
    Promise.all(CATEGORY_GROUPS.map((g) => fetchCategoryImage(supabase, g.queryCategories))),
    fetchTrendingProducts(supabase),
    fetchPresentCategories(supabase),
  ]);

  // Spread trending across categories so customers see variety, not 8 of one type.
  const trending = pickDiverse(trendingRaw, 8);

  // Only show category groups/chips that actually have live products.
  const WHAT_WE_CARRY = CATEGORY_GROUPS.map((g, i) => ({
    ...g,
    image: categoryImages[i]?.url ?? null,
    imageAlt: categoryImages[i]?.alt ?? g.title,
    categories: g.categories.filter((c) => presentCategories.has(c)),
  })).filter((g) => g.categories.length > 0);

  return (
    <>
      <Header profile={profile} />
      <main>

        {/* ── Hero — store photo ── */}
        <section className="relative h-[60vh] min-h-105 w-full overflow-hidden">
          <Image
            src="/asset/about-store.png"
            alt="Butterfly Fashion Trading store — North York, Toronto"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/60">
              Toronto Wholesale · Est. 1996
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              30 years supplying<br />Canadian retailers.
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/75">
              From a small North York storefront to a wholesale B2B operation shipping across Canada and the USA.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-green-900 transition-opacity hover:opacity-90" href="/products">
                Browse catalog
              </Link>
              <Link className="rounded-lg border border-white/50 bg-black/35 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/50" href="/register">
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
              { value: "Instant", label: "Wholesale pricing access" },
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
                we moved fast while larger distributors were still catching up. We know how to read what's next
                and stock ahead of the curve.
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
                Core wholesale categories — all stocked in Toronto, all available for wholesale ordering through this portal.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {WHAT_WE_CARRY.map(({ icon: Icon, title, desc, categories: cats, image, imageAlt }) => (
                <div key={title} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {image ? (
                    <div className="relative h-44 w-full overflow-hidden bg-white">
                      <Image
                        src={image}
                        alt={imageAlt}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center" style={{ background: "var(--primary-light)" }}>
                      <Icon size={40} style={{ color: "var(--primary)", opacity: 0.35 }} />
                    </div>
                  )}
                  <div className="p-6">
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trending items ── */}
        {trending.length > 0 && (
          <section className="border-b border-gray-100 bg-white px-4 py-16 sm:py-20">
            <div className="container-shell">
              <div className="mb-10 max-w-2xl">
                <p className="section-label mb-3" style={{ color: "var(--primary)" }}>Moving now</p>
                <h2 className="text-3xl font-black text-gray-900">Trending items</h2>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  A snapshot of what&apos;s selling through our Toronto warehouse right now.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {trending.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url as string}
                        alt={p.name as string}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold text-gray-900">{p.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{p.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
                Whether it&apos;s seasonal accessories, novelty and fidget toys,
                or trending variety goods before the season — we know what retailers need and how fast they need it.
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
              Create a B2B account and wholesale pricing unlocks immediately — free, no approval wait.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/register">
                Create B2B account
              </Link>
              <Link className="btn-secondary px-6 py-2.5 text-sm" href="/products">
                Browse catalog
              </Link>
              <a className="btn-ghost gap-2 px-6 py-2.5 text-sm" href={contactTel}>
                <Phone size={14} /> Call to order
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
