"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const POPULAR_SEARCHES = [
  { label: "Panini Stickers" },
  { label: "Sticker Box" },
  { label: "Flag" },
  { label: "Car Flag" },
  { label: "Bucket Hat" },
  { label: "Cap" },
  { label: "Scarf" },
  { label: "Canada" },
  { label: "Brazil" },
  { label: "Argentina" },
  { label: "Mexico" },
  { label: "USA" },
];

export function HomeSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 sm:pt-10 sm:pb-4">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stickers, flags, caps, teams..."
          className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-12 pr-28 py-4 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand px-5 py-2.5 text-sm font-black text-white hover:bg-brand-hover transition-colors"
        >
          Search
        </button>
      </form>

      {/* Popular search chips — desktop only */}
      <div className="mt-3 hidden sm:flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(`/products?search=${encodeURIComponent(item.label)}`)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand hover:text-brand transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
