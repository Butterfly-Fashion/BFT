import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { FaqAccordion } from "@/components/store/faq-accordion";
import { getCurrentProfile } from "@/lib/auth";
import type { FaqSection } from "@/components/store/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ | Butterfly Fashion Trading Wholesale",
  description: "Frequently asked questions about wholesale ordering, B2B accounts, MOQ, payment, and shipping at Butterfly Fashion Trading.",
};

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Account & Registration",
    items: [
      {
        q: "How do I create a B2B wholesale account?",
        a: "Register with your business name, contact info, and business type. Approval typically takes under 24 hours. Once approved, you'll unlock wholesale pricing and can start ordering.",
      },
      {
        q: "What types of businesses can apply?",
        a: "We work with retailers, convenience stores, variety shops, event resellers, market vendors, and any business that resells products to end consumers. Both brick-and-mortar and online sellers are welcome.",
      },
      {
        q: "How long does B2B approval take?",
        a: "Most applications are reviewed and approved within 24 hours on business days. You'll receive an email once your account is approved.",
      },
      {
        q: "Can I browse products before getting approved?",
        a: "Yes — you can browse the catalog and see product names and images before approval. Wholesale pricing is unlocked after your account is approved.",
      },
    ],
  },
  {
    title: "Ordering & MOQ",
    items: [
      {
        q: "What is the minimum order quantity (MOQ)?",
        a: "Most products start at 1 case, typically 12–50 units depending on the product. There is no dollar minimum on orders. You can mix and match products to build your order.",
      },
      {
        q: "How do I place an order?",
        a: "Add products to your cart, then submit your order. Our team reviews it, confirms availability, and sends you a payment link. No charge is made until the order is approved.",
      },
      {
        q: "Can I request a quote before ordering?",
        a: "Yes. Use the Request a Quote feature in your account to get a custom price quote for large orders or special requests before committing.",
      },
      {
        q: "Can I order products that are out of stock?",
        a: "For out-of-stock items, we run Pre-order Campaigns where you can commit to a quantity. Once enough demand is confirmed, we place the wholesale order. Check the Pre-orders section for active campaigns.",
      },
    ],
  },
  {
    title: "Payment & Invoicing",
    items: [
      {
        q: "How does payment work?",
        a: "After your order is approved, we send you a secure Stripe payment link via email. You pay by credit card through Stripe. No card details are stored on our platform — all payments are processed securely through Stripe.",
      },
      {
        q: "Do you offer NET 30 payment terms?",
        a: "NET 30 terms are available for established accounts with a good payment history. Contact us to discuss NET terms for your account.",
      },
      {
        q: "What currency do you charge in?",
        a: "All prices and invoices are in Canadian dollars (CAD).",
      },
      {
        q: "Do you provide invoices?",
        a: "Yes — every order comes with a professional invoice. You can view and download invoices from your account's order history.",
      },
    ],
  },
  {
    title: "Shipping & Pickup",
    items: [
      {
        q: "Where do you ship from?",
        a: "All orders ship from our Toronto warehouse. We offer same-day pickup or next business day shipping.",
      },
      {
        q: "Do you ship to the USA?",
        a: "Yes — we ship cross-border to US buyers. We handle the shipping documentation. Contact us for US shipping rates.",
      },
      {
        q: "How long does shipping take?",
        a: "Within Ontario: 1–3 business days. Other Canadian provinces: 3–7 business days. USA: 5–10 business days depending on destination.",
      },
      {
        q: "Can I pick up my order in Toronto?",
        a: "Yes — local pickup is available from our North York warehouse. Select Pickup as your delivery method when placing your order and we'll confirm a pickup time.",
      },
    ],
  },
  {
    title: "Products & Pre-orders",
    items: [
      {
        q: "What product categories do you carry?",
        a: "We carry seasonal and winter items (gloves, toques, scarves, masks), novelty and fidget toys, vape and smoke shop supplies (rolling papers and more), and trending variety accessories. New products are added regularly.",
      },
      {
        q: "What is a Pre-order Campaign?",
        a: "When a product is out of stock, we create a Pre-order Campaign to gauge demand before placing the wholesale order. Approved B2B buyers can commit a quantity. Once the campaign closes, we confirm availability and process commitments.",
      },
      {
        q: "How do I know if a product is in stock?",
        a: "Products are marked Available, Limited Stock, or Manual Confirm on the catalog. Manual Confirm means we verify stock before confirming your order.",
      },
      {
        q: "Can I reorder the exact same style?",
        a: "Yes — every product has a unique Item Code (SKU). Use it to reorder exact styles quickly by searching in the catalog or including it in a quote request.",
      },
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default async function FaqPage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header profile={profile} />
      <main>
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell py-10 sm:py-14">
            <span className="section-label">Help & Information</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              Everything you need to know about wholesale ordering, accounts, payment, and shipping.
              Can't find your answer?{" "}
              <Link href="/account/messages" className="font-semibold underline" style={{ color: "var(--primary)" }}>
                Contact us
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="container-shell py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <FaqAccordion sections={FAQ_SECTIONS} />

            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="font-bold text-gray-900">Still have questions?</p>
              <p className="mt-1 text-sm text-gray-500">
                Our team is happy to help with pricing, stock, or shipping questions.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link className="btn-primary min-h-8 px-5 text-sm" href="/account/messages">
                  Send a message
                </Link>
                <Link className="btn-secondary min-h-8 px-5 text-sm" href="/account/quotes">
                  Request a quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
