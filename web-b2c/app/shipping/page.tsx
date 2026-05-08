import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Free Shipping</h2>
          <p>All orders over $99 CAD qualify for free standard shipping within Canada. This threshold is calculated before taxes.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Standard Shipping</h2>
          <p>Orders under $99 CAD ship for a flat rate of $9.99 CAD. Delivery typically takes 5–10 business days depending on your location within Canada.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Processing Time</h2>
          <p>Orders are processed within 1–2 business days. You will receive a tracking number by email once your order has shipped.</p>
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
