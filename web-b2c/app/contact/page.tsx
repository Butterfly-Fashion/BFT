import type { Metadata } from "next";
import {
  BUSINESS_EMAIL,
  BUSINESS_LOCALITY,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_POSTAL_CODE,
  BUSINESS_REGION,
  BUSINESS_STREET_ADDRESS,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact World Fan Gear for order help, shipping questions, and Canada 2026-inspired soccer fan merchandise support.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
      <p className="text-gray-500 text-sm mb-10">
        Have a question about your order or our products? World Fan Gear ships
        Canada 2026-inspired fan merchandise from the Toronto area, and we&apos;re
        here to help with product, delivery, and order questions.
      </p>

      <div className="space-y-8 text-sm text-gray-600">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-1">Phone</p>
            <a href={`tel:${BUSINESS_PHONE}`} className="text-[#C41E3A] hover:underline font-semibold">
              {BUSINESS_PHONE}
            </a>
            <p className="text-gray-400 text-xs mt-1">Mon–Sat 9 AM–7 PM · <strong>Sun</strong> 11 AM–4:30 PM ET</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Email</p>
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[#C41E3A] hover:underline">
              {BUSINESS_EMAIL}
            </a>
            <p className="text-gray-400 text-xs mt-1">We respond within 1–2 business days.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Business Hours</p>
            <p>Monday – Saturday: 9 AM – 7 PM EST</p>
            <p><strong>Sunday: 11 AM – 4:30 PM EST</strong></p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Based in</p>
            <p>{BUSINESS_NAME}</p>
            <p>
              {BUSINESS_STREET_ADDRESS}, {BUSINESS_LOCALITY}, {BUSINESS_REGION} {BUSINESS_POSTAL_CODE}, Canada
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Orders ship from the Toronto area to customers across Canada.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">What we can help with</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Order status and delivery timing</li>
              <li>World Cup 2026 fan gear product questions</li>
              <li>Bulk or group watch party merchandise planning</li>
              <li>Returns, exchanges, and damaged package support</li>
            </ul>
          </div>
        </div>

        <div>
          <p className="text-gray-500 text-xs">
            For order issues, please include your order number in your message so we can assist you faster.
          </p>
        </div>
      </div>
    </div>
  );
}
