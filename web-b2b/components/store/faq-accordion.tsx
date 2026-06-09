"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqSection = {
  title: string;
  items: { q: string; a: string }[];
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <ChevronDown
          size={16}
          className="mt-0.5 shrink-0 text-gray-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-500">{a}</p>
      )}
    </div>
  );
}

export function FaqAccordion({ sections }: { sections: FaqSection[] }) {
  return (
    <div className="grid gap-8">
      {sections.map((section) => (
        <div key={section.title} className="card p-6">
          <h2 className="mb-1 text-sm font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            {section.title}
          </h2>
          <div>
            {section.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
