import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms for using the Butterfly Fashion Trading B2B wholesale platform — accounts, orders, pricing, and fulfillment.",
};

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const profile = await getCurrentProfile();
  return (
    <>
      <Header profile={profile} />
      <main className="container-shell max-w-3xl py-16">
        <p className="section-label" style={{ color: "var(--primary)" }}>Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900">Terms of Use</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          By creating a B2B account and using this platform, you agree to use it for legitimate
          wholesale business purposes and to provide accurate business, contact, and shipping information.
        </p>

        <section className="mt-10 space-y-8 text-sm leading-7 text-gray-600">
          <div>
            <h2 className="text-lg font-bold text-gray-900">B2B Accounts</h2>
            <p className="mt-2">
              Wholesale accounts are reviewed before approval. We may request business documentation
              and reserve the right to approve, decline, or suspend accounts at our discretion.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Orders &amp; Pricing</h2>
            <p className="mt-2">
              Submitting an order request does not collect payment. We review availability, confirm
              final pricing, and send a payment link before any charge. Wholesale prices and minimum
              order quantities may change as inventory is updated.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Shipping &amp; Pickup</h2>
            <p className="mt-2">
              Shipping costs and pickup timing are confirmed after order review. We ship across Canada
              and to the United States and work with carriers to find suitable rates for your order size.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach us at{" "}
              <a href="mailto:jameskimkim1@gmail.com" className="font-semibold text-gray-900 underline">
                jameskimkim1@gmail.com
              </a>{" "}
              or see our{" "}
              <Link href="/faq" className="font-semibold text-gray-900 underline">FAQ</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
