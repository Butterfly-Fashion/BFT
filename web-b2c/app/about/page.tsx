import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About World Fan Gear",
  description:
    "Learn about World Fan Gear, a Toronto-area shop for Canada 2026-inspired soccer fan merchandise shipping across Canada.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
        About
      </p>
      <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
        Toronto-area fan gear for Canada 2026
      </h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-gray-600">
        <p>
          World Fan Gear is the consumer storefront for Butterfly Fashion Trading,
          based in North York, Ontario. We focus on soccer fan merchandise for
          Canadian shoppers preparing for World Cup 2026 watch parties, fan zones,
          car parades, backyard screenings, and gifts.
        </p>
        <p>
          Our catalog is built around practical match-day items: caps, bucket hats,
          car flags, mini souvenir boxing gloves, and Panini-style sticker
          collecting products. The goal is simple: make it easy for fans across
          Canada to find team colours before tournament demand spikes.
        </p>
        <p>
          Orders ship from the Toronto area to customers across Canada. We are not
          affiliated with FIFA or any official organizing body.
        </p>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Ships from", "Toronto area"],
          ["Serves", "Canada-wide"],
          ["Focus", "World Cup fan gear"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {label}
            </p>
            <p className="mt-2 text-base font-black text-gray-900">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="rounded-full bg-[#C41E3A] px-5 py-3 text-sm font-bold text-white hover:bg-[#A01830]"
        >
          Shop fan gear
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-gray-400"
        >
          Contact us
        </Link>
      </div>
    </main>
  );
}

