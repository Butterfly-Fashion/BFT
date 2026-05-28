import Link from "next/link";
import { ArrowRight, CheckCircle, Package, Flag, HardHat, Truck, Clock, ShieldCheck, ReceiptText } from "lucide-react";
import { BackToTop } from "@/components/store/back-to-top";
import { Header } from "@/components/store/header";
import { ProductGrid } from "@/components/store/product-grid";
import { SetupRequired } from "@/components/setup-required";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { applyCustomerPrices } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "Car Flags", icon: Flag, href: "/products?category=Car+Flags", desc: "49+ country styles" },
  { label: "Caps", icon: HardHat, href: "/products?category=Caps", desc: "3D embroidered caps" },
  { label: "Bucket Hats", icon: Package, href: "/products?category=Bucket+Hats", desc: "Licensed bucket hats" },
  { label: "Boxing Gloves", icon: Package, href: "/products?category=Boxing+Gloves", desc: "Souvenir gloves" },
];

const PROCESS_STEPS = [
  { n: "1", label: "Submit order request", desc: "Add items to cart — no payment yet." },
  { n: "2", label: "Admin review", desc: "We confirm availability and finalize pricing." },
  { n: "3", label: "Payment link sent", desc: "Receive a secure link via email." },
  { n: "4", label: "Pickup or shipping", desc: "We arrange fulfillment after payment." },
];

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("*").eq("is_hidden", false).limit(8);
  const products = await applyCustomerPrices((data || []) as Product[], profile);

  return (
    <>
      <Header profile={profile} />
      <main>

        {/* ── Hero ── */}
        <section className="bg-white py-16 sm:py-20 lg:py-28">
          <div className="container-shell">
            <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-16">

              {/* Left: copy */}
              <div>
                <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-inset ring-blue-200">
                  B2B Wholesale · Toronto, ON
                </span>

                <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-6xl">
                  Variety &amp; novelty<br />
                  <span style={{ color: "var(--primary)" }}>wholesale</span><br />
                  done right.
                </h1>

                <p className="mt-6 max-w-md text-base leading-relaxed text-gray-500">
                  Butterfly Fashion Trading supplies retailers, gift shops, and resellers across Canada with premium variety merchandise at competitive wholesale pricing.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link className="btn-primary gap-2 px-6 py-3 text-sm" href="/products">
                    Browse catalog <ArrowRight size={14} />
                  </Link>
                  <Link className="btn-secondary px-6 py-3 text-sm" href="/account/quotes">
                    Request a quote
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-6">
                  {["No upfront payment", "Custom B2B pricing", "Bulk orders welcome"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                      <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: order flow */}
              <div className="space-y-3">
                {PROCESS_STEPS.map((step) => (
                  <div key={step.n} className="flex gap-4 rounded-2xl bg-gray-50 p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ background: "var(--primary)" }}>
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{step.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <div className="border-y border-gray-100 bg-white">
          <div className="container-shell">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 py-4">
              {[
                { icon: ShieldCheck, label: "Verified B2B accounts" },
                { icon: Truck, label: "Pickup or shipping" },
                { icon: ReceiptText, label: "Invoice after payment" },
                { icon: Clock, label: "Price confirmed before charge" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Icon size={14} style={{ color: "var(--primary)" }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Categories ── */}
        <section className="bg-white py-14 sm:py-16">
          <div className="container-shell">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="section-label">Shop by category</span>
                <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">Browse our catalog</h2>
              </div>
              <Link className="btn-secondary shrink-0 text-sm" href="/products">
                All products <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map(({ label, icon: Icon, href, desc }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center gap-4 rounded-2xl bg-gray-50 p-5 transition-all duration-150 hover:bg-blue-50"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm transition-all duration-150 group-hover:text-white"
                    style={{ color: "var(--primary)" }}
                  >
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-gray-900 transition-colors group-hover:text-blue-700">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured products ── */}
        {products.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-14 sm:py-16">
            <div className="container-shell">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="section-label">Featured products</span>
                  <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">Popular this season</h2>
                </div>
                <Link className="btn-secondary shrink-0 text-sm" href="/products">
                  View all <ArrowRight size={13} className="ml-1" />
                </Link>
              </div>
              <ProductGrid products={products} profile={profile} />
              <div className="mt-10 flex justify-center">
                <Link className="btn-primary gap-2 px-8 py-3 text-sm" href="/products">
                  View all products <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>
      <BackToTop />
    </>
  );
}
