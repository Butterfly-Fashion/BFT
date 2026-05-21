import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "World Fan Gear returns and exchanges policy for Canada 2026-inspired soccer fan merchandise shipped in Canada.",
  alternates: {
    canonical: "/returns",
  },
};

export default function ReturnsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Returns & Exchanges</h1>

      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">30-Day Return Policy</h2>
          <p>We accept returns within 30 days of delivery. Items must be unused, unwashed, and in their original packaging with all tags attached.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">How to Return</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Email us at <a href="mailto:jameskimkim1@gmail.com" className="text-[#C41E3A] hover:underline">jameskimkim1@gmail.com</a> with your order number and reason for return.</li>
            <li>We will send you a return shipping label within 2 business days.</li>
            <li>Pack your item securely and drop it off at any Canada Post location.</li>
            <li>Refunds are processed within 5–7 business days of receiving the return.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Exchanges</h2>
          <p>For size exchanges, please return your original item and place a new order. We recommend doing this promptly to ensure your preferred size remains in stock.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Non-Returnable Items</h2>
          <p>Final sale items and items marked as non-returnable cannot be returned or exchanged.</p>
        </section>
      </div>
    </div>
  );
}
