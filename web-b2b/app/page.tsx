import Link from "next/link";
import {
  ArrowRight, CheckCircle, Package, Flag, HardHat,
  Truck, Clock, ShieldCheck, ReceiptText,
} from "lucide-react";
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
  { label: "Car Flags", icon: Flag, href: "/products?category=Car+Flags", desc: "49+ country styles", color: "from-blue-500 to-blue-600" },
  { label: "Caps", icon: HardHat, href: "/products?category=Caps", desc: "3D embroidered caps", color: "from-blue-600 to-blue-700" },
  { label: "Bucket Hats", icon: Package, href: "/products?category=Bucket+Hats", desc: "Licensed bucket hats", color: "from-blue-400 to-blue-600" },
  { label: "Boxing Gloves", icon: Package, href: "/products?category=Boxing+Gloves", desc: "Licensed souvenir gloves", color: "from-sky-400 to-blue-500" },
];

const PROCESS_STEPS = [
  { n: "01", label: "Submit order request", desc: "Add items to cart — no payment yet." },
  { n: "02", label: "Admin review", desc: "We confirm availability and finalize pricing." },
  { n: "03", label: "Payment link sent", desc: "Receive a secure link via email." },
  { n: "04", label: "Pickup or shipping", desc: "We arrange fulfillment after payment." },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "Verified B2B accounts" },
  { icon: Truck, label: "Pickup or shipping" },
  { icon: ReceiptText, label: "Invoice after payment" },
  { icon: Clock, label: "Price confirmed before charge" },
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
        <section className="border-b border-gray-100 bg-white">
          {/* Top accent stripe */}
          <div className="h-1.5 bg-linear-to-r from-blue-600 via-blue-500 to-yellow-400" />

          <div className="container-shell py-12 sm:py-16 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-center">

              {/* Left: copy */}
              <div>
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-blue-200">
                  B2B Wholesale Platform
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Your source for<br />
                  <span style={{ color: "var(--primary)" }}>variety</span> &amp; novelty<br />
                  wholesale.
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                  B2B wholesale by <span className="font-bold text-gray-900">Butterfly Fashion Trading</span> — Toronto&apos;s variety &amp; novelty merchandise supplier for retailers, gift shops &amp; resellers.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-7 py-3 text-sm font-black text-white transition-opacity hover:opacity-90"
                    href="/products"
                    style={{ background: "var(--primary)" }}
                  >
                    Shop the Collection <ArrowRight size={15} className="shrink-0" />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-bold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    href="/account/quotes"
                  >
                    Get Bulk Quote
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-5">
                  {["No upfront payment", "Bulk orders welcome", "Custom B2B pricing"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <CheckCircle size={12} className="shrink-0 text-emerald-500" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: order flow cards */}
              <div className="grid gap-3">
                {PROCESS_STEPS.map((step) => (
                  <div key={step.n} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black text-white bg-blue-600">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-black text-gray-900">{step.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Trust signals ── */}
        <section className="border-y border-gray-100 bg-blue-50">
          <div className="container-shell grid grid-cols-2 gap-px bg-blue-100 lg:grid-cols-4">
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 bg-blue-50 px-5 py-4 sm:gap-3">
                <Icon size={16} className="shrink-0 text-blue-600" />
                <span className="text-xs font-bold text-gray-700 sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="container-shell py-8 sm:py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-blue-600">Shop by category</p>
              <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Browse our catalog</h2>
            </div>
            <Link className="btn-secondary shrink-0 text-xs" href="/products">
              All Products <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(({ label, icon: Icon, href, desc, color }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br ${color} text-white shadow-sm`}>
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-sm font-black text-gray-900 transition-colors group-hover:text-blue-600">{label}</p>
                  <p className="text-xs font-semibold text-gray-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured products ── */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="container-shell py-8 sm:py-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-blue-600">🔥 Featured products</p>
                <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Popular this season</h2>
                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                  Starting prices shown — final totals confirmed before payment.
                </p>
              </div>
              <Link className="btn-secondary shrink-0 text-xs" href="/products">
                View all products <ArrowRight size={12} className="ml-1" />
              </Link>
            </div>
            <ProductGrid products={products} profile={profile} />
            <div className="mt-7 flex justify-center">
              <Link className="btn-primary gap-2 px-7 py-3 text-sm" href="/products">
                View all products <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <BackToTop />
    </>
  );
}
