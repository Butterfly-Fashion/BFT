import type { Metadata } from "next";

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
            <p className="font-semibold text-gray-900 mb-1">Email</p>
            <a href="mailto:jameskimkim1@gmail.com" className="text-[#C41E3A] hover:underline">
              jameskimkim1@gmail.com
            </a>
            <p className="text-gray-400 text-xs mt-1">We respond within 1–2 business days.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Business Hours</p>
            <p>Monday – Saturday: 9 AM – 5:30 PM EST</p>
            <p>Sunday: 11 AM – 5 PM EST</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Based in</p>
            <p>North York, Ontario, Canada</p>
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
