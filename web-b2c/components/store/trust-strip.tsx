import { Truck, RotateCcw, ShieldCheck, Zap, Award } from "lucide-react";

const signals = [
  {
    icon: Award,
    title: "Since 1987",
    body: "Toronto's trusted fan gear retailer",
  },
  {
    icon: Truck,
    title: "Canada-Wide Delivery",
    body: "Ships from Toronto, ON",
  },
  {
    icon: Zap,
    title: "Same-Day Dispatch",
    body: "Order before 2 PM ET",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    body: "30-day hassle-free returns",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    body: "SSL encrypted checkout",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4">
        {signals.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`flex flex-col items-center text-center gap-2 ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-[#003876]/10" : "bg-[#C41E3A]/10"}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${i === 0 ? "text-[#003876]" : "text-[#C41E3A]"}`} />
            </div>
            <p className={`text-xs sm:text-sm font-semibold ${i === 0 ? "text-[#003876]" : "text-gray-900"}`}>{title}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
