import Link from "next/link";
import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { CONTACT_PHONE, contactTel, contactMailto } from "@/lib/contact";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { FaqAccordion } from "@/components/store/faq-accordion";
import { getCurrentProfile } from "@/lib/auth";
import type { FaqSection } from "@/components/store/faq-accordion";

export const metadata: Metadata = {
  title: "Wholesale Ordering FAQ",
  description: "Frequently asked questions about wholesale ordering, B2B accounts, order quantities, payment, and shipping at Butterfly Fashion Trading.",
  alternates: { canonical: "/faq" },
};

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Account & Registration",
    items: [
      {
        q: "How do I create a B2B wholesale account?",
        a: "Register with your business name, contact info, and business type. There's no approval wait — wholesale pricing and ordering unlock as soon as you create your account.",
      },
      {
        q: "What types of businesses can apply?",
        a: "We work with retailers, convenience stores, variety shops, event resellers, market vendors, and any business that resells products to end consumers. Both brick-and-mortar and online sellers are welcome.",
      },
      {
        q: "When can I see wholesale pricing?",
        a: "Immediately after registering. There's no approval step — create your account, sign in, and wholesale pricing is shown across the catalog right away.",
      },
      {
        q: "Can I browse products before registering?",
        a: "Yes — anyone can browse the catalog and see product names and images. Wholesale pricing is shown once you register and sign in.",
      },
    ],
  },
  {
    title: "Ordering",
    items: [
      {
        q: "Is there a minimum order quantity?",
        a: "No — you can order any quantity, from a single unit up to full cases. Case pricing gives you a better per-unit rate on bulk, but it isn't required. You can mix and match products to build your order.",
      },
      {
        q: "How do I place an order?",
        a: "Two easy ways: call or email us directly with the Item Codes and quantities you want, or add products to your cart on the site and submit an order request. Either way our team reviews it, confirms availability, and sends you a payment link. No charge is made until the order is approved.",
      },
      {
        q: "Can I get bulk or custom pricing?",
        a: "Yes. Add the quantities you need to your order request (or call/email us) and note any volume or special requirements — we'll confirm bulk pricing before you commit.",
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
        a: "We confirm exact stock when you place a request — every order is checked against our Toronto warehouse before we confirm it. Items marked Pre-order aren't stocked yet and are handled through a Pre-order Campaign.",
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
                <a className="btn-primary min-h-8 gap-1.5 px-5 text-sm" href={contactTel}>
                  <Phone size={14} /> {CONTACT_PHONE}
                </a>
                <a className="btn-secondary min-h-8 gap-1.5 px-5 text-sm" href={contactMailto}>
                  <Mail size={14} /> Email us
                </a>
                <Link className="btn-ghost min-h-8 px-5 text-sm" href="/account/messages">
                  Send a message
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
