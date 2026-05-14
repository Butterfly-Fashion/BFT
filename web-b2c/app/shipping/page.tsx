import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "World Fan Gear shipping policy for Canada 2026-inspired fan merchandise shipped from Toronto across Canada.",
  alternates: {
    canonical: "/shipping",
  },
};

export default function ShippingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Shipping Rates</h2>
          <p>Shipping is calculated at checkout based on the destination province or territory.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Standard Shipping</h2>
          <p>Delivery typically takes 5-10 business days depending on your location within Canada.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Processing Time</h2>
          <p>Orders are processed within 1-2 business days. You will receive a tracking number by email once your order has shipped.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Shipping Destinations</h2>
          <p>We currently ship to all Canadian provinces and territories. International shipping is not available at this time.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Questions?</h2>
          <p>
            Contact us at{" "}
            <a href="mailto:support@fifa2026.ca" className="text-[#C41E3A] hover:underline">
              support@fifa2026.ca
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
