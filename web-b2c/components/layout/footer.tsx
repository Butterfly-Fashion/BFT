import Link from "next/link";
import { NewsletterForm } from "@/components/store/newsletter-form";
import {
  AEO_STORE_DESCRIPTION,
  BUSINESS_EMAIL,
  BUSINESS_LOCALITY,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_POSTAL_CODE,
  BUSINESS_REGION,
  BUSINESS_STREET_ADDRESS,
} from "@/lib/seo";

const popularSearches = [
  { href: "/collections/best-fifa-2026-merch-canada", label: "Best FIFA 2026 merch" },
  { href: "/collections/world-cup-bucket-hats-toronto", label: "Bucket hats Toronto" },
  { href: "/collections/canada-soccer-fan-gear", label: "Canada soccer fan gear" },
  { href: "/collections/world-cup-party-supplies-canada", label: "Party supplies Canada" },
  { href: "/collections/world-cup-fan-gear-toronto", label: "Fan gear Toronto" },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-24">
      {/* Newsletter section */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-[#FFD700] text-xs font-black uppercase tracking-widest mb-1">
                Join the 2026 Fan List
              </p>
              <p className="text-white text-lg font-bold">
                Be first for drops, deals &amp; game day tips
              </p>
              <p className="text-gray-400 text-sm mt-1">
                No spam. Just the best Canada 2026 fan gear news.
              </p>
            </div>
            <NewsletterForm source="footer" variant="dark" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/asset/logo.jpg" alt="Butterfly Fashion Trading" width={32} height={32} className="rounded-sm" />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Butterfly Fashion</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Trading · Toronto</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            {AEO_STORE_DESCRIPTION}
          </p>
          <p className="mt-3 text-xs leading-5 text-gray-200">
            {BUSINESS_NAME}
            <br />
            {BUSINESS_STREET_ADDRESS}, {BUSINESS_LOCALITY}, {BUSINESS_REGION} {BUSINESS_POSTAL_CODE}
            <br />
            <a href={`tel:${BUSINESS_PHONE}`} className="hover:text-white transition-colors">{BUSINESS_PHONE}</a>
          </p>
          <p className="text-xs mt-4 text-gray-400">
            Not affiliated with FIFA or any official organizing body.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-white transition-colors">
                Shop All
              </Link>
            </li>
            <li>
              <Link
                href="/collections/souvenir-boxing-gloves"
                className="hover:text-white transition-colors"
              >
                Boxing Gloves
              </Link>
            </li>
            <li>
              <Link
                href="/collections/world-cup-caps"
                className="hover:text-white transition-colors"
              >
                Caps
              </Link>
            </li>
            <li>
              <Link
                href="/collections/world-cup-bucket-hats"
                className="hover:text-white transition-colors"
              >
                Bucket Hats
              </Link>
            </li>
            <li>
              <Link
                href="/collections/world-cup-car-flags"
                className="hover:text-white transition-colors"
              >
                Car Flags
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                Fan Gear Guides
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About Butterfly Fashion Trading
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Customer Care</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shipping" className="hover:text-white transition-colors">
                Shipping Info
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-white transition-colors">
                Returns & Exchanges
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="hover:text-white transition-colors"
              >
                {BUSINESS_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Popular Searches</h3>
          <ul className="space-y-2 text-sm">
            {popularSearches.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Butterfly Fashion Trading. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
