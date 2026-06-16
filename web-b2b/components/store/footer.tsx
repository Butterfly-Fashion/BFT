import Link from "next/link";
import { MapPin, Clock, Mail, Phone } from "lucide-react";
import { ButterflyLogo } from "@/components/butterfly-logo";

const EMAIL = "jameskimkim1@gmail.com";
const PHONE = "+1-416-785-5999";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="container-shell grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + location */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-100 bg-white">
              <ButterflyLogo size={32} />
            </span>
            <div className="leading-tight">
              <span className="block text-sm font-black tracking-tight text-gray-900">Butterfly Fashion</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Wholesale · Toronto</span>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-gray-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
            178 Bentworth Ave, North York, ON M6A 1P7
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} className="shrink-0 text-gray-400" />
            Mon–Fri · 9 AM – 5 PM ET
          </p>
        </div>

        {/* Wholesale */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Wholesale</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-gray-600">
            <li><Link href="/products" className="transition-colors hover:text-gray-900">Catalog</Link></li>
            <li><Link href="/preorders" className="transition-colors hover:text-gray-900">Pre-orders</Link></li>
            <li><Link href="/lookbook" className="transition-colors hover:text-gray-900">Lookbook</Link></li>
            <li><Link href="/account/quotes" className="transition-colors hover:text-gray-900">Request a quote</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-gray-600">
            <li><Link href="/about" className="transition-colors hover:text-gray-900">About</Link></li>
            <li><Link href="/faq" className="transition-colors hover:text-gray-900">FAQ</Link></li>
            <li><Link href="/terms" className="transition-colors hover:text-gray-900">Terms of Use</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-gray-900">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-gray-600">
            <li>
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 transition-colors hover:text-gray-900">
                <Mail size={14} className="shrink-0 text-gray-400" />
                {EMAIL}
              </a>
            </li>
            <li>
              <a href={`tel:${PHONE}`} className="flex items-center gap-2 transition-colors hover:text-gray-900">
                <Phone size={14} className="shrink-0 text-gray-400" />
                {PHONE}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="container-shell flex flex-col items-center justify-between gap-2 py-5 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Butterfly Fashion Trading. All rights reserved.</p>
          <p>B2B wholesale · Toronto, Canada</p>
        </div>
      </div>
    </footer>
  );
}
