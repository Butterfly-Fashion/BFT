import Link from "next/link";
import { ArrowRight, MapPin, Truck, Package2, ShieldCheck, FileText, Tag } from "lucide-react";
import { BackToTop } from "@/components/store/back-to-top";
import { Header } from "@/components/store/header";
import { ProductCatalogTable } from "@/components/store/product-catalog-table";
import { SetupRequired } from "@/components/setup-required";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { applyCustomerPrices } from "@/lib/pricing";
import { fetchCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const WHY_BUY = [
  { icon: MapPin, title: "Toronto warehouse", desc: "Pick up same-day or ship next business day from our Toronto location." },
  { icon: Truck, title: "Ships CA & USA", desc: "Canada-wide and cross-border shipping available for all wholesale orders." },
  { icon: Package2, title: "MOQ from 1 case", desc: "No massive minimums. Order by the case — most items start at 12–50 units." },
  { icon: ShieldCheck, title: "B2B pricing", desc: "Approved accounts see wholesale pricing. Register and get approved in 24 hrs." },
  { icon: FileText, title: "Invoice & NET terms", desc: "Professional invoicing. NET 30 available for established accounts." },
  { icon: Tag, title: "SKU-level traceability", desc: "Every product has a unique SKU. Reorder exact styles fast." },
];

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const [profile, categories, supabaseResult] = await Promise.all([
    getCurrentProfile(),
    fetchCategories(),
    createSupabaseServerClient().then((supabase) =>
      supabase.from("products").select("*").eq("is_hidden", false).contains("sales_channels", ["b2b"]).order("created_at", { ascending: false }).limit(10)
    ),
  ]);
  const products = await applyCustomerPrices((supabaseResult.data || []) as Product[], profile);

  return (
    <>
      <Header profile={profile} />
      <main>

        {/* ── Hero ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell py-12 sm:py-16">
            <div className="max-w-2xl">
              <span className="section-label">Toronto Wholesale · World Cup 2026</span>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
                Wholesale fan merchandise<br />
                <span style={{ color: "var(--primary)" }}>for Canadian retailers.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-500">
                Bulk car flags, caps, bucket hats, boxing gloves, and fan gear.
                Direct from our Toronto warehouse to retailers, event buyers, and resellers across Canada and the USA.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/products">
                  Browse wholesale catalog <ArrowRight size={14} />
                </Link>
                <Link className="btn-secondary px-6 py-2.5 text-sm" href="/account/quotes">
                  Request a quote
                </Link>
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

        {/* ── Category quick-links ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell">
            <div className="flex flex-wrap gap-2 py-4">
              <span className="self-center text-xs font-semibold text-gray-400 mr-1">Categories:</span>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
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
              Create a B2B account to unlock wholesale pricing. Approval typically takes under 24 hours.
              Already have an account? Log in and start ordering.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-primary gap-2 px-6 py-2.5 text-sm" href="/register">
                Create B2B account <ArrowRight size={14} />
              </Link>
              <Link className="btn-secondary px-6 py-2.5 text-sm" href="/login">Sign in</Link>
              <Link className="btn-ghost px-6 py-2.5 text-sm" href="/account/quotes">Submit a quote request</Link>
            </div>
          </div>
        </section>

      </main>
      <BackToTop />
    </>
  );
}
