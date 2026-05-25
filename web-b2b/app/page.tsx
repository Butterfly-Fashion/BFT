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
  { label: "Car Flags", icon: Flag, href: "/products?category=Car+Flags", desc: "49+ country styles", color: "from-red-500 to-red-600" },
  { label: "Caps", icon: HardHat, href: "/products?category=Caps", desc: "3D embroidered caps", color: "from-blue-600 to-(--primary)" },
  { label: "Bucket Hats", icon: Package, href: "/products?category=Bucket+Hats", desc: "Licensed bucket hats", color: "from-cyan-500 to-blue-600" },
  { label: "Boxing Gloves", icon: Package, href: "/products?category=Boxing+Gloves", desc: "Licensed souvenir gloves", color: "from-amber-400 to-amber-600" },
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
        <section
          className="relative overflow-hidden border-b border-slate-800"
          style={{ background: "radial-gradient(ellipse at 20% 55%, #1a3090 0%, #080d20 45%, #0f0318 100%)" }}
        >
          {/* Background video — hidden on mobile, fades in when loaded */}
          {/* Download a free soccer/stadium video from pexels.com and save to public/videos/hero-bg.mp4 */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-40 blur-[2px] sm:block"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Overlay — preserves readability over video */}
          <div
            className="absolute inset-0 hidden sm:block"
            style={{ background: "linear-gradient(135deg, rgba(8,13,32,0.78) 0%, rgba(15,13,24,0.60) 55%, rgba(8,4,20,0.72) 100%)" }}
          />

          {/* Glow orbs */}
          <div className="pointer-events-none absolute -top-24 right-1/3 h-64 w-64 rounded-full bg-[#f97316] opacity-[0.07] blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-96 rounded-full bg-[#1a3fad] opacity-[0.15] blur-[80px]" />
          {/* Top accent stripe */}
          <div className="relative z-10 h-1.5 bg-linear-to-r from-(--primary) via-(--accent) to-amber-400" />

          <div className="relative z-10 container-shell py-10 sm:py-14 lg:py-18">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">

              {/* Left: copy */}
              <div className="relative z-10">
                <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Your source for<br />
                  <span style={{ color: "#f97316" }}>variety</span> &amp; novelty<br />
                  <span className="text-white">wholesale.</span>
                </h1>

                <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-slate-300 sm:text-base">
                  B2B wholesale by <span className="font-black text-white">Butterfly Fashion Trading</span> — Toronto&apos;s variety &amp; novelty merchandise supplier for retailers, gift shops &amp; resellers.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-7 py-3 text-sm font-black text-white transition-opacity hover:opacity-90"
                    href="/products"
                    style={{ background: "linear-gradient(135deg, #2554cc 0%, #0f2575 100%)", color: "#fff" }}
                  >
                    <span>Shop the Collection</span> <ArrowRight size={15} className="shrink-0" />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                    href="/account/quotes"
                    style={{ color: "#fff" }}
                  >
                    Get Bulk Quote
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  {["No upfront payment", "Bulk orders welcome", "Custom B2B pricing"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <CheckCircle size={12} className="shrink-0 text-emerald-400" />
                      {t}
                    </span>
                  ))}
                </div>

              </div>

              {/* Right: order flow cards */}
              <div className="relative z-10 grid gap-3">
                {PROCESS_STEPS.map((step, i) => (
                  <div key={step.n} className="flex min-h-20 gap-3 rounded-xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-sm">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-black text-white ${
                      i === 0 ? "bg-(--primary)" : i === 1 ? "bg-(--accent)" : i === 2 ? "bg-amber-500" : "bg-emerald-600"
                    }`}>
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{step.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        {/* ── Trust signals ── */}
        <section className="border-b border-slate-700 bg-slate-900">
          <div className="container-shell grid grid-cols-2 gap-px bg-slate-700 lg:grid-cols-4">
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 bg-slate-900 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
                <Icon size={16} className="shrink-0 text-[#f59e0b]" />
                <span className="text-xs font-bold text-slate-300 sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="container-shell py-8 sm:py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--accent)">Shop by category</p>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Browse our catalog</h2>
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
                className="group flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br ${color} text-white shadow-sm`}>
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900 transition-colors group-hover:text-(--primary)">{label}</p>
                  <p className="text-xs font-semibold text-slate-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured products ── */}
        <section className="border-t border-slate-200 bg-white">
          <div className="container-shell py-8 sm:py-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--accent)">🔥 Featured products</p>
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Popular this season</h2>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
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
