import { WholesaleCta } from "./wholesale-cta";

export function WholesaleNotice() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-black text-gray-900 mb-3">We&apos;re wholesale only</h1>
      <p className="text-sm leading-6 text-gray-600 mb-8">
        We no longer sell individual orders through this site. We supply our full
        Canada 2026 fan-gear range to retailers and event organizers at B2B prices.
        Send us your product list and quantities and we&apos;ll get you a great price.
      </p>
      <div className="flex justify-center">
        <WholesaleCta />
      </div>
    </div>
  );
}
