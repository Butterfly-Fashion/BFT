import { Truck, RotateCcw, ShieldCheck, Leaf } from "lucide-react";

const signals = [
  {
    icon: Truck,
    title: "Canada-Wide Delivery",
    body: "Ships from Toronto, ON",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    body: "30-day hassle-free returns",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    body: "SSL encrypted payments",
  },
  {
    icon: Leaf,
    title: "Canadian Owned",
    body: "Shipped from Toronto, ON",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
        {signals.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#C41E3A]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#C41E3A]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
