import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getCurrentProfile } from "@/lib/auth";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Butterfly Fashion Trading collects, uses, and protects business and contact information on its B2B platform.",
  alternates: { canonical: "/privacy" },
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const profile = await getCurrentProfile();
  return (
    <>
      <Header profile={profile} />
      <main className="container-shell max-w-3xl py-16">
        <p className="section-label" style={{ color: "var(--primary)" }}>Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          We collect the information needed to review wholesale accounts, process order requests,
          provide support, and prevent fraud. This can include your business name, contact details,
          shipping address, order history, and payment status.
        </p>

        <section className="mt-10 space-y-8 text-sm leading-7 text-gray-600">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payments</h2>
            <p className="mt-2">
              Payments are processed securely through Stripe. We do not store full card numbers or
              sensitive payment credentials on our servers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Order Communication</h2>
            <p className="mt-2">
              We use your contact details to send account, quote, and order updates, payment links,
              and support replies related to your business with us.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
            <p className="mt-2">
              We may use analytics tools to understand platform performance and improve the
              wholesale ordering experience.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Contact</h2>
            <p className="mt-2">
              For privacy questions or data requests, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-gray-900 underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
