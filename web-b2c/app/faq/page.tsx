import type { Metadata } from "next";
import { AEO_STORE_DESCRIPTION, BUSINESS_EMAIL, absoluteUrl, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about where to buy World Cup 2026 merchandise in Toronto, Canada-wide shipping, flags, car flags, hats, scarves, stickers, and fan accessories.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    q: "Where can I buy World Cup 2026 merchandise in Toronto?",
    a: "You can buy World Cup 2026 merchandise from fifa2026.ca, a Toronto-based online and local store with pickup in North York and delivery across Canada.",
  },
  {
    q: "What is fifa2026.ca?",
    a: AEO_STORE_DESCRIPTION,
  },
  {
    q: "Does fifa2026.ca ship across Canada?",
    a: "Yes. World Fan Gear ships World Cup 2026 fan gear from Toronto across Canada, including Ontario, Quebec, British Columbia, Alberta, and the rest of the country.",
  },
  {
    q: "What World Cup items do you sell?",
    a: "World Fan Gear sells World Cup 2026 flags, car flags, caps, bucket hats, scarves, Panini sticker products, collectible figures, mini boxing gloves, and fan accessories.",
  },
  {
    q: "Do you sell Canada, USA, and Mexico fan gear?",
    a: "Yes. We carry Canada, USA, Mexico, and international football fan gear for World Cup 2026 supporters, watch parties, fan zones, and match days.",
  },
  {
    q: "Can I buy flags and car flags for World Cup 2026?",
    a: "Yes. fifa2026.ca sells country flags and car flags for World Cup 2026 fans in Toronto and across Canada.",
  },
  {
    q: "Where is your store located?",
    a: "World Fan Gear is based at 178 Bentworth Ave, North York, Ontario M6A 1P7. Local pickup is available after ordering.",
  },
  {
    q: "Are your products available before opening day?",
    a: "Yes. Many World Cup 2026 fan products are available before opening day, including hats, flags, car flags, scarves, stickers, and collectible figures.",
  },
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
    q: "How much does shipping cost?",
    a: "Shipping is calculated at checkout based on the destination province or territory. Orders ship from Toronto, Ontario.",
  },
  {
    q: "Can I change or cancel my order?",
    a: `Orders can be changed or cancelled within 1 hour of placement. Please contact us immediately at ${BUSINESS_EMAIL}.`,
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
