import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, Phone, Mail, Package, Car } from "lucide-react";
import {
  BUSINESS_EMAIL,
  BUSINESS_LOCALITY,
  BUSINESS_NAME,
  BUSINESS_POSTAL_CODE,
  BUSINESS_REGION,
  BUSINESS_STREET_ADDRESS,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Visit Our Store · Pickup Location | Butterfly Fashion Trading",
  description:
    "Visit Butterfly Fashion Trading in North York, Toronto. Local pickup available at 178 Bentworth Ave. Est. 1996. Mon–Sat 9 AM–7 PM · Sun 11 AM–4:30 PM.",
};

const HOURS = [
  { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM", bold: false },
  { day: "Saturday", hours: "9:00 AM – 6:00 PM", bold: true },
  { day: "Sunday", hours: "11:00 AM – 4:30 PM", bold: true },
];

export default function LocationPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${BUSINESS_STREET_ADDRESS} ${BUSINESS_LOCALITY} ${BUSINESS_REGION} ${BUSINESS_POSTAL_CODE}`
  )}`;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-black uppercase tracking-widest text-brand mb-2">
          Est. 1996 · Toronto
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
          Visit Our Toronto Store
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-xl">
          We're a local Toronto fan gear retailer with over 30 years in the business.
          Order online for Canada-wide shipping, or come pick up in person.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">

        {/* Address & Map */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <MapPin className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{BUSINESS_NAME}</p>
              <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                {BUSINESS_STREET_ADDRESS}<br />
                {BUSINESS_LOCALITY}, {BUSINESS_REGION} {BUSINESS_POSTAL_CODE}<br />
                Canada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Phone className="h-4 w-4 text-brand" />
            </div>
            <a href="tel:+14167855999" className="text-sm font-semibold text-gray-700 hover:text-brand transition-colors">
              +1 (416) 785-5999
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Mail className="h-4 w-4 text-brand" />
            </div>
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-sm font-semibold text-gray-700 hover:text-brand transition-colors">
              {BUSINESS_EMAIL}
            </a>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Get Directions on Google Maps
          </a>
        </div>

        {/* Hours */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003876]/10">
              <Clock className="h-5 w-5 text-[#003876]" />
            </div>
            <p className="font-bold text-gray-900">Store Hours</p>
          </div>

          <div className="divide-y divide-gray-100">
            {HOURS.map(({ day, hours, bold }) => (
              <div key={day} className="flex items-center justify-between py-2.5">
                <span className={`text-sm ${bold ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{day}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {hours}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">
              Hours may vary on holidays. Call ahead to confirm.
            </p>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-3 sm:col-span-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Package className="h-5 w-5 text-brand" />
            </div>
            <p className="font-bold text-gray-900">Local Pickup</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Package,
                title: "Free pickup",
                body: "No shipping fee when you collect in store.",
              },
              {
                icon: Clock,
                title: "Ready same day",
                body: "Orders placed before 2 PM ET are ready the same day.",
              },
              {
                icon: Car,
                title: "Free parking",
                body: "Free parking available on Bentworth Ave.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-gray-50 p-4">
                <Icon className="h-5 w-5 text-brand mb-2" />
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
            >
              Shop Now →
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              About Us
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
