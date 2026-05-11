import type { Metadata } from "next";
import { absoluteUrl, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about World Fan Gear shipping, returns, payments, and Canada 2026-inspired fan merchandise.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    q: "Do I need an account to order?",
    a: "No. We offer guest checkout — just enter your email and shipping details at checkout. No account required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Your payment information is never stored on our servers.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 5–10 business days within Canada. Orders are processed within 1–2 business days.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes! All orders over $99 CAD ship for free within Canada.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can be changed or cancelled within 1 hour of placement. Please contact us immediately at support@fifa2026.ca.",
  },
  {
    q: "Are your products officially licensed?",
    a: "Our merchandise is inspired by the 2026 FIFA World Cup hosted in Canada, USA, and Mexico. Please review individual product descriptions for details.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 30 days of delivery for unused items in original condition. See our Returns page for details.",
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
    url: absoluteUrl("/faq"),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>

      <div className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.q} className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">{faq.q}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
