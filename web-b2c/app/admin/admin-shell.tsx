"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

type Section = "orders" | "products" | "revenue" | "messages" | "newsletter";

const OrdersDashboard = dynamic(() => import("./orders-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading orders..." />,
});

const ProductsDashboard = dynamic(() => import("./products-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading products..." />,
});

const RevenueDashboard = dynamic(() => import("./revenue-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading revenue..." />,
});

const MessagesDashboard = dynamic(() => import("./messages-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading messages..." />,
});

const NewsletterDashboard = dynamic(() => import("./newsletter-dashboard"), {
  loading: () => <AdminSectionLoader label="Loading subscribers..." />,
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

const SECTIONS: Section[] = ["orders", "products", "revenue", "messages", "newsletter"];

function hashToSection(): Section {
  const hash = window.location.hash.replace("#", "") as Section;
  return SECTIONS.includes(hash) ? hash : "orders";
}

export default function AdminShell({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [section, setSection] = useState<Section>("orders");

  useEffect(() => {
    // Set correct tab from URL hash after hydration
    setSection(hashToSection());

    const onHashChange = () => setSection(hashToSection());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(s: Section) {
    window.location.hash = s;
    setSection(s);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top navigation */}
      <nav className="shrink-0 border-b border-gray-200 bg-white px-6 py-0 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C41E3A] mr-4 py-4">
            World Fan Gear
          </span>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 transition-colors ${
                section === s
                  ? "border-[#C41E3A] text-[#C41E3A]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "orders"
                ? "Orders"
                : s === "products"
                ? "Products"
                : s === "revenue"
                ? "Revenue"
                : s === "messages"
                ? "Messages"
                : "Newsletter"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Site
          </a>
          <button
            onClick={() => logoutAction()}
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Section content */}
      <div className="flex-1 overflow-hidden">
        {section === "orders" ? (
          <OrdersDashboard />
        ) : section === "products" ? (
          <ProductsDashboard />
        ) : section === "revenue" ? (
          <RevenueDashboard />
        ) : section === "messages" ? (
          <MessagesDashboard />
        ) : (
          <NewsletterDashboard />
        )}
      </div>
    </div>
  );
}
