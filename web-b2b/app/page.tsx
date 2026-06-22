import Link from "next/link";
import { ArrowRight, MapPin, Truck, Package2, ShieldCheck, FileText, Tag, Phone } from "lucide-react";
import { contactTel } from "@/lib/contact";
import { OrderContactCta } from "@/components/store/order-contact-cta";
import { BackToTop } from "@/components/store/back-to-top";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { HeroCarousel } from "@/components/store/hero-carousel";
import { ProductCatalogTable } from "@/components/store/product-catalog-table";
import { SetupRequired } from "@/components/setup-required";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { applyCustomerPrices } from "@/lib/pricing";
import { fetchCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, HeroBanner } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Round-robin one product per category so the home preview shows variety,
 *  not 10 of whatever was imported last. */
function pickDiverse(products: Product[], max: number): Product[] {
  const buckets = new Map<string, Product[]>();
  for (const p of products) {
    const c = p.category || "Other";
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(p);
  }
  const lists = [...buckets.values()];
  const result: Product[] = [];
  let i = 0;
  while (result.length < max && lists.some((l) => l.length)) {
    const list = lists[i % lists.length];
    if (list.length) result.push(list.shift()!);
    i += 1;
  }
  return result;
}

const WHY_BUY = [
  { icon: MapPin, title: "Toronto warehouse", desc: "Pick up same-day or ship next business day from our Toronto location." },
  { icon: Truck, title: "Ships CA & USA", desc: "Canada-wide and cross-border shipping available for all wholesale orders." },
  { icon: Package2, title: "MOQ from 1 case", desc: "No massive minimums. Order by the case — most items start at 12–50 units." },
  { icon: ShieldCheck, title: "B2B pricing", desc: "Approved accounts see wholesale pricing. Register and get approved in 24 hrs." },
  { icon: FileText, title: "Invoice & NET terms", desc: "Professional invoicing. NET 30 available for established accounts." },
  { icon: Tag, title: "Item Code traceability", desc: "Every product has a unique Item Code. Reorder exact styles fast." },
];

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const [profile, categories, supabaseResult, bannerResult] = await Promise.all([
    getCurrentProfile(),
    fetchCategories(),
    createSupabaseServerClient().then((supabase) =>
      supabase.from("products").select("*").eq("is_hidden", false).contains("sales_channels", ["b2b"]).order("created_at", { ascending: false }).limit(80)
    ),
    createSupabaseServerClient().then((supabase) =>
      supabase.from("hero_banners").select("*").eq("is_published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
    ),
  ]);
  const diverse = pickDiverse((supabaseResult.data || []) as Product[], 12);
  const products = await applyCustomerPrices(diverse, profile);
  const banners = (bannerResult.data || []) as HeroBanner[];

  return (
    <>
      <Header profile={profile} />
      <main>

        {/* ── Hero ── */}
        {banners.length > 0 ? (
          <HeroCarousel banners={banners} />
        ) : (
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell py-12 sm:py-16">
            <div className="max-w-2xl">
              <span className="section-label">Toronto Wholesale · Variety & Novelty Goods</span>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
                Wholesale variety &amp; novelty goods<br />
                <span style={{ color: "var(--primary)" }}>for Canadian retailers.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-500">
                Bulk winter accessories, novelty &amp; fidget toys, rolling papers, and trending variety goods.
                Direct from our Toronto warehouse to retailers, convenience stores, and resellers across Canada and the USA.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/products">
                  Browse wholesale catalog <ArrowRight size={14} />
                </Link>
                <a className="btn-secondary gap-2 px-6 py-2.5 text-sm" href={contactTel}>
                  <Phone size={14} /> Call to order
                </a>
              </div>
            </div>

            {/* Key facts */}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-gray-100 pt-6">
              {[
                "Toronto warehouse stock",
                "Ships Canada & USA",
                "MOQ from 1 case",
                "B2B pricing on approval",
                "Invoice + NET 30 available",
              ].map((fact) => (
                <span key={fact} className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── How it works ── */}
        <section className="border-b border-gray-200 bg-gray-50">
          <div className="container-shell py-10">
            <div className="mb-6">
              <span className="section-label">Getting started</span>
              <h2 className="mt-1 text-lg font-bold text-gray-900">How to order wholesale</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Create an account",
                  desc: "Register with your business name and contact info. Takes under 2 minutes.",
                  href: "/register",
                  cta: "Register →",
                },
                {
                  step: "02",
                  title: "Get approved",
                  desc: "We review your application and approve B2B accounts within 24 hours.",
                  href: null,
                  cta: null,
                },
                {
                  step: "03",
                  title: "Browse & add to cart",
                  desc: "See wholesale pricing, add products by Item Code or category, set quantities.",
                  href: "/products",
                  cta: "Browse catalog →",
                },
                {
                  step: "04",
                  title: "We confirm & invoice",
                  desc: "We review your order, confirm availability, then send a payment link. No charge until approved.",
                  href: null,
                  cta: null,
                },
              ].map(({ step, title, desc, href, cta }) => (
                <div key={step} className="relative rounded-xl border border-gray-200 bg-white p-5">
                  <span className="mb-3 inline-block text-3xl font-black leading-none" style={{ color: "var(--primary)", opacity: 0.15 }}>
                    {step}
                  </span>
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
                  {href && cta && (
                    <Link
                      href={href}
                      className="mt-3 inline-flex text-xs font-semibold transition-colors"
                      style={{ color: "var(--primary)" }}
                    >
                      {cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Category quick-links ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell">
            <div className="flex flex-wrap gap-2 py-4">
              <span className="self-center text-xs font-semibold text-gray-400 mr-1">Categories:</span>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.slug ? `/collections/${cat.slug}` : `/products?category=${encodeURIComponent(cat.name)}`}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700"
              >
                All products →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Product catalog preview ── */}
        <section className="py-10 sm:py-12">
          <div className="container-shell">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <div>
                <span className="section-label">Wholesale catalog</span>
                <h2 className="mt-1.5 text-xl font-bold text-gray-900">
                  {products.length > 0 ? "Available now" : "Products coming soon"}
                </h2>
              </div>
              {products.length > 0 && (
                <Link className="btn-secondary text-sm" href="/products">
                  Full catalog <ArrowRight size={13} className="ml-1" />
                </Link>
              )}
            </div>

            {products.length > 0 ? (
              <ProductCatalogTable products={products} profile={profile} compact />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <Package2 size={28} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-400">Products will appear here once added by admin.</p>
                <p className="mt-1 text-sm text-gray-300">
                  <Link href="/register" className="underline hover:text-gray-500">Create a B2B account</Link> to be notified when inventory is live.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Why buy from us ── */}
        <section className="border-t border-gray-200 bg-white py-10 sm:py-14">
          <div className="container-shell">
            <div className="mb-8">
              <span className="section-label">Why wholesale buyers choose us</span>
              <h2 className="mt-1.5 text-xl font-bold text-gray-900">Built for business, not browsers.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_BUY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--primary-light)" }}>
                    <Icon size={17} style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-gray-200 py-10 sm:py-14">
          <div className="container-shell max-w-2xl">
            <h2 className="text-2xl font-black text-gray-900">Ready to order wholesale?</h2>
            <p className="mt-3 text-base text-gray-500">
              Order the fastest way for you — call or email us directly with the Item Codes you want,
              and we&apos;ll confirm availability and pricing within 1 business day.
            </p>
            <OrderContactCta className="mt-6" />
            <p className="mt-6 text-sm text-gray-500">
              Prefer to order online? Create a B2B account to unlock wholesale pricing — approval typically takes under 24 hours.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/register">
                Create B2B account <ArrowRight size={14} />
              </Link>
              <Link className="btn-secondary px-6 py-2.5 text-sm" href="/login">Sign in</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
