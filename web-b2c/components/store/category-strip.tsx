import Link from "next/link";

const categories = [
  { name: "Boxing Gloves", emoji: "🥊", href: "/products?category=Boxing+Gloves" },
  { name: "Caps", emoji: "🧢", href: "/products?category=Caps" },
  { name: "Bucket Hats", emoji: "🪣", href: "/products?category=Bucket+Hats" },
  { name: "Car Flags", emoji: "🚩", href: "/products?category=Car+Flags" },
];

export function CategoryStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white hover:border-[#C41E3A] hover:bg-[#C41E3A]/5 transition-all duration-150 shadow-sm"
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#C41E3A] transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
