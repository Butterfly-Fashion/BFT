import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Review World Fan Gear terms for product information, orders, shipping, returns, and site use.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfUsePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
        Customer Care
      </p>
      <h1 className="text-3xl font-black text-gray-900">Terms of Use</h1>
      <p className="mt-4 text-sm leading-7 text-gray-600">
        By using World Fan Gear, you agree to use the store for lawful personal shopping
        purposes and to provide accurate order, contact, and shipping information.
      </p>

      <section className="mt-10 space-y-8 text-sm leading-7 text-gray-600">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Product Information</h2>
          <p className="mt-2">
            We work to keep product descriptions, prices, availability, and images accurate,
            but details may change as inventory is updated.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Orders</h2>
          <p className="mt-2">
            Orders are subject to payment authorization, inventory availability, and fraud
            screening. We may contact you if we need to confirm details before fulfillment.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Shipping and Returns</h2>
          <p className="mt-2">
            Shipping and return details are available on our{" "}
            <Link href="/shipping" className="font-semibold text-gray-900 underline">
              Shipping
            </Link>{" "}
            and{" "}
            <Link href="/returns" className="font-semibold text-gray-900 underline">
              Returns
            </Link>{" "}
            pages.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Affiliation</h2>
          <p className="mt-2">
            World Fan Gear merchandise is inspired by soccer fan culture and the 2026
            tournament season. We are not affiliated with FIFA or any official organizing
            body unless explicitly stated on a product page.
          </p>
        </div>
      </section>
    </main>
  );
}
