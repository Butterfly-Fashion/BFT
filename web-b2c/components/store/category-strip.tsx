import Link from "next/link";

const categories = [
  { name: "Fashion",      emoji: "🧢", href: "/products?category=Fashion" },
  { name: "Collectibles", emoji: "🏆", href: "/products?category=Collectibles" },
  { name: "Accessories",  emoji: "🚗", href: "/products?category=Accessories" },
];

export function CategoryStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 sm:overflow-visible sm:flex-wrap sm:justify-center">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="group shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white hover:border-brand hover:bg-brand/5 transition-all duration-150 shadow-sm"
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-brand transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
