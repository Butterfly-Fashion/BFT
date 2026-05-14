import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/asset/logo.jpg" alt="Butterfly Fashion Trading" width={32} height={32} className="rounded-sm" />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Butterfly Fashion</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Trading · Toronto</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Premium World Cup 2026 merchandise for Canadian fans. Shipped from
            North York, Canada.
          </p>
          <p className="text-xs mt-4 text-gray-500">
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
                href="mailto:jameskimkim1@gmail.com"
                className="hover:text-white transition-colors"
              >
                jameskimkim1@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
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
