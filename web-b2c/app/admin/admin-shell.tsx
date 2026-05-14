"use client";

import { useState } from "react";
import OrdersDashboard from "./orders-dashboard";
import ProductsDashboard from "./products-dashboard";

type Section = "orders" | "products";

export default function AdminShell({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [section, setSection] = useState<Section>("orders");

  return (
    <div className="flex h-full flex-col">
      {/* Top navigation */}
      <nav className="shrink-0 border-b border-gray-200 bg-white px-6 py-0 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C41E3A] mr-4 py-4">
            World Fan Gear
          </span>
          {(["orders", "products"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 transition-colors ${
                section === s
                  ? "border-[#C41E3A] text-[#C41E3A]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "orders" ? "Orders" : "Products"}
            </button>
          ))}
        </div>
        <button
          onClick={() => logoutAction()}
          className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors"
        >
          Log out
        </button>
      </nav>

      {/* Section content */}
      <div className="flex-1 overflow-hidden">
        {section === "orders" ? (
          <OrdersDashboard />
        ) : (
          <ProductsDashboard />
        )}
      </div>
    </div>
  );
}
