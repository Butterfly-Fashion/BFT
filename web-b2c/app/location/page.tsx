import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, Phone, Mail, Package, Car } from "lucide-react";

export const metadata: Metadata = {
  title: "Visit Our Store · Pickup Location | Butterfly Fashion Trading",
  description:
    "Visit Butterfly Fashion Trading in North York, Toronto. Local pickup available at 178 Bentworth Ave. Est. 1987. Mon–Sat 9 AM–7 PM.",
};

const HOURS = [
  { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM" },
  { day: "Saturday", hours: "9:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

export default function LocationPage() {
  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=178+Bentworth+Ave+North+York+ON+M6A+1P7";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-black uppercase tracking-widest text-[#C41E3A] mb-2">
          Est. 1987 · Toronto
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
          Visit Our Toronto Store
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-xl">
          We're a local Toronto fan gear retailer with over 35 years in the business.
          Order online for Canada-wide shipping, or come pick up in person.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">

        {/* Address & Map */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C41E3A]/10">
              <MapPin className="h-5 w-5 text-[#C41E3A]" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Butterfly Fashion Trading</p>
              <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                178 Bentworth Ave<br />
                North York, ON M6A 1P7<br />
                Canada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C41E3A]/10">
              <Phone className="h-4 w-4 text-[#C41E3A]" />
            </div>
            <a href="tel:+14167855999" className="text-sm font-semibold text-gray-700 hover:text-[#C41E3A] transition-colors">
              +1 (416) 785-5999
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C41E3A]/10">
              <Mail className="h-4 w-4 text-[#C41E3A]" />
            </div>
            <a href="mailto:jameskimkim1@gmail.com" className="text-sm font-semibold text-gray-700 hover:text-[#C41E3A] transition-colors">
              jameskimkim1@gmail.com
            </a>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#C41E3A] px-4 py-3 text-sm font-bold text-white hover:bg-[#A01830] transition-colors"
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
            {HOURS.map(({ day, hours }) => (
              <div key={day} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium text-gray-700">{day}</span>
                <span className={`text-sm font-semibold ${hours === "Closed" ? "text-gray-400" : "text-gray-900"}`}>
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C41E3A]/10">
              <Package className="h-5 w-5 text-[#C41E3A]" />
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
                <Icon className="h-5 w-5 text-[#C41E3A] mb-2" />
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C41E3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#A01830] transition-colors"
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
