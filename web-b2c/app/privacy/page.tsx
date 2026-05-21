import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how World Fan Gear collects, uses, and protects customer information for orders shipped across Canada.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
        Customer Care
      </p>
      <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-7 text-gray-600">
        World Fan Gear collects the information needed to process orders, provide customer
        support, prevent fraud, and improve the shopping experience. This can include your
        name, email, shipping address, order details, and payment status.
      </p>

      <section className="mt-10 space-y-8 text-sm leading-7 text-gray-600">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Payments</h2>
          <p className="mt-2">
            Payments are processed securely through Stripe. We do not store full card
            numbers or sensitive payment credentials on our servers.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Order Communication</h2>
          <p className="mt-2">
            We use your contact details to send order confirmations, shipping updates, and
            support replies related to your purchase.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
          <p className="mt-2">
            We may use analytics tools to understand site performance, product interest,
            and checkout behaviour so we can improve the store.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">Contact</h2>
          <p className="mt-2">
            For privacy questions or data requests, contact jameskimkim1@gmail.com.
          </p>
        </div>
      </section>
    </main>
  );
}
