"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

type Section = "orders" | "products" | "revenue";

const OrdersDashboard = dynamic(() => import("./orders-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading orders..." />,
});

const ProductsDashboard = dynamic(() => import("./products-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading products..." />,
});

const RevenueDashboard = dynamic(() => import("./revenue-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading revenue..." />,
});

function AdminSectionLoader({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#C41E3A]" />
        <p className="text-sm font-semibold text-gray-400">{label}</p>
      </div>
    </div>
  );
}

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
          {(["orders", "products", "revenue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 transition-colors ${
                section === s
                  ? "border-[#C41E3A] text-[#C41E3A]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "orders" ? "Orders" : s === "products" ? "Products" : "Revenue"}
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
        ) : section === "products" ? (
          <ProductsDashboard />
        ) : (
          <RevenueDashboard />
        )}
      </div>
    </div>
  );
}
