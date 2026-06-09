import { BadgeCheck, MapPin, PackageCheck } from "lucide-react";

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Official Panini stock",
    body: "Sealed World Cup 2026 sticker products with clear pack and sticker counts before checkout.",
  },
  {
    icon: MapPin,
    title: "Toronto pickup",
    body: "Free local pickup at 178 Bentworth Ave in North York for buyers who want it today.",
  },
  {
    icon: PackageCheck,
    title: "Transparent totals",
    body: "Pickup total is shown before payment. Shipping is optional and calculated only when selected.",
  },
];

export function SocialProof() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">
            Buyer Confidence
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Clear, Local, Ready to Pick Up
          </h2>
        </div>

        <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <article
                key={point.title}
                className="shrink-0 w-72 sm:w-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">{point.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
