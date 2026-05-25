"use client";

import { useEffect, useState, type RefObject } from "react";
import { formatCAD } from "@/lib/money";

interface Props {
  price: number;
  inStock: boolean;
  added: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  anchorRef: RefObject<HTMLDivElement | null>;
}

export function StickyAddToCart({ price, inStock, added, onAddToCart, onBuyNow, anchorRef }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anchorRef]);

  if (!inStock) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-gray-200 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <p className="text-center text-[10px] font-semibold text-[#C41E3A] bg-red-50 py-1.5 border-b border-red-100">
        ⚡ Order by June 9 · Arrive before World Cup opening day
      </p>
      <div className="px-4 py-3 flex gap-3">
        <button
          onClick={onAddToCart}
          className="flex-1 py-3 rounded-full border-2 border-gray-900 text-gray-900 font-semibold text-sm hover:bg-gray-900 hover:text-white transition-colors"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
        <button
          onClick={onBuyNow}
          className="flex-1 py-3 rounded-full bg-[#C41E3A] text-white font-semibold text-sm hover:bg-[#A01830] transition-colors"
        >
          Buy Now — {formatCAD(price)}
        </button>
      </div>
    </div>
  );
}
