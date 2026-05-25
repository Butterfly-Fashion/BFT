"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const POPULAR_TEAMS = [
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇺🇸", name: "USA" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "England" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇲🇦", name: "Morocco" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇰🇷", name: "Korea" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇸🇳", name: "Senegal" },
];

export function HomeSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleTeam = (name: string) => {
    router.push(`/products?search=${encodeURIComponent(name)}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 sm:pt-10 sm:pb-4">
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-2 text-center sm:text-left">
        Find your team
      </p>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Morocco, Brazil, Canada, Japan..."
          className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-12 pr-28 py-4 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#C41E3A] focus:ring-4 focus:ring-[#C41E3A]/10 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#C41E3A] px-5 py-2.5 text-sm font-black text-white hover:bg-[#A01830] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Popular team chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {POPULAR_TEAMS.map((team) => (
          <button
            key={team.name}
            onClick={() => handleTeam(team.name)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#C41E3A] hover:text-[#C41E3A] transition-colors"
          >
            <span>{team.flag}</span>
            <span>{team.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
