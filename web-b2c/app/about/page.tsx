import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Truck, ShieldCheck, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | World Fan Gear",
  description:
    "World Fan Gear is a Toronto-based fan gear shop backed by nearly 30 years of wholesale experience. Built by an immigrant family business and University of Waterloo students.",
  alternates: {
    canonical: "/about",
  },
};

const stats = [
  { label: "Years in business", value: "30+" },
  { label: "Products & growing", value: "175+" },
  { label: "Ships to", value: "CA & USA" },
  { label: "Based in", value: "Toronto, ON" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "30 years of real-world experience",
    body: "We've been navigating seasonal markets, supply chains, and shifting retail trends since before e-commerce existed. That experience is baked into every product we choose to carry.",
  },
  {
    icon: Package,
    title: "Official licensed products",
    body: "We carry officially licensed merchandise — Panini FIFA World Cup 2026 sticker collections, Funko Pop figures, Minix collectibles — sourced directly, not knockoffs.",
  },
  {
    icon: Truck,
    title: "Ships Canada-wide & to the USA",
    body: "Orders ship from North York, Toronto. Same-day dispatch on orders placed before 2 PM ET via Canada Post and major carriers.",
  },
  {
    icon: MapPin,
    title: "Local pickup — North York",
    body: "GTA locals can skip the shipping fee entirely. Pick up at our store at 178 Bentworth Ave, North York, ON. Just contact us after ordering.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">

      {/* Hero image */}
      <div className="relative mb-12 overflow-hidden rounded-2xl">
        <Image
          src="/about-hero.png"
          alt="World Fan Gear store front in North York, Toronto"
          width={1200}
          height={500}
          className="w-full object-cover"
          priority
        />
      </div>

      {/* Header */}
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          Our Story
        </p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
          30 years of building alongside Toronto.
        </h1>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-black text-[#C41E3A]">{value}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="mt-12 space-y-5 text-sm leading-7 text-gray-600">
        <p>
          Our founder, <span className="font-semibold text-gray-900">James Kim</span>, immigrated
          to Canada from Korea nearly 30 years ago and started his business from nothing. Back then —
          before large discount chains and online shopping became dominant — he built his livelihood
          selling winter products and seasonal goods through hard work, persistence, and countless
          long days on the floor.
        </p>
        <p>
          Like many small immigrant-owned businesses, we faced serious challenges as large retailers
          like Dollarama began reshaping the market. At one point, we nearly lost everything.
          But we never stopped adapting.
        </p>
        <p>
          During COVID, we became known again by moving fast — supplying masks and trending
          products at a time when large corporations overlooked fast-moving seasonal demand.
          Staying flexible and acting quickly let us survive and rebuild.
        </p>
        <p>
          The FIFA World Cup has always meant something special to us. For years, we sold flags,
          fan gear, and football merchandise through our local Toronto stores — watching firsthand
          how football brings together people from every culture and community in this city.
        </p>
        <p>
          <span className="font-semibold text-gray-900">FIFA2026.ca is the next chapter.</span>{" "}
          Built together with University of Waterloo students passionate about technology, design,
          and football culture — we&apos;re combining three decades of real-world business experience
          with a new generation&apos;s creativity and digital skills. The goal is simple: a better
          World Cup shopping experience for fans across Canada.
        </p>
        <p className="font-medium text-gray-800">
          We&apos;re not just selling products. We&apos;re sharing over 30 years of immigrant
          business history, resilience, and the passion that the World Cup brings to people
          around the world.
        </p>
      </div>

      {/* Values grid */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C41E3A]/10">
              <Icon size={18} className="text-[#C41E3A]" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{title}</p>
              <p className="mt-1.5 text-sm leading-6 text-gray-500">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* James Kim quote */}
      <div className="mt-14 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          From the founder
        </p>
        <blockquote className="mt-4 text-sm leading-7 text-gray-600">
          &ldquo;We&apos;ve spent 30 years supplying retailers across Canada with quality products.
          When the World Cup came to Canada, it felt like the right moment to give fans
          direct access to that same merchandise — without the retail markup.
          Every item we carry is something we&apos;d personally stand behind.&rdquo;
        </blockquote>
        <div className="mt-5">
          <p className="font-black text-gray-900">James Kim</p>
          <p className="text-xs text-gray-400">Founder · World Fan Gear &amp; Butterfly Fashion Trading · Toronto</p>
        </div>
      </div>

      {/* Pickup CTA */}
      <div className="mt-8 flex items-start gap-4 rounded-2xl bg-gray-50 p-6">
        <MapPin size={20} className="mt-0.5 shrink-0 text-[#C41E3A]" />
        <div>
          <p className="font-bold text-gray-900">Local pickup — North York, Toronto</p>
          <p className="mt-1 text-sm text-gray-500">178 Bentworth Ave, North York, ON M6A 1P7</p>
          <p className="mt-1 text-sm text-gray-500">
            GTA 지역이라면 배송비 없이 직접 픽업 가능합니다. 주문 후 연락 주세요.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block text-sm font-bold text-[#C41E3A] hover:underline"
          >
            Get in touch →
          </Link>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="rounded-full bg-[#C41E3A] px-6 py-3 text-sm font-bold text-white hover:bg-[#A01830]"
        >
          Shop fan gear
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400"
        >
          Contact us
        </Link>
      </div>

    </main>
  );
}
