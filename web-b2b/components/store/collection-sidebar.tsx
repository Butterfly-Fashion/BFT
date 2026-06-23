import Link from "next/link";
import { Layers } from "lucide-react";
import type { Category } from "@/lib/category-utils";

// Floating left sidebar for collection pages: shows the current category group's
// root + its sub-categories (mirrors the all-products CatalogFilterSidebar style).
// Renders nothing when the group has no sub-categories.
export function CollectionSidebar({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug: string;
}) {
  const active = categories.find((c) => c.slug === activeSlug);
  if (!active) return null;

  const rootId = active.parent_id ?? active.id;
  const root = categories.find((c) => c.id === rootId);
  if (!root) return null;

  const children = categories
    .filter((c) => c.parent_id === rootId)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (children.length === 0) return null;

  function itemClass(isActive: boolean, indent = false) {
    return `block w-full rounded-md text-left text-sm transition-colors ${
      indent ? "py-1 pl-5 pr-2.5" : "px-2.5 py-1.5"
    } ${isActive ? "font-semibold text-white" : "text-gray-600 hover:bg-gray-50"}`;
  }

  return (
    <aside className="w-full shrink-0 lg:w-52">
      <div className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-20">
        <div className="mb-3 flex items-center gap-2">
          <Layers size={14} className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700">Categories</h3>
        </div>

        <div className="space-y-0.5">
          {/* Root group header — links to the full group */}
          <Link
            href={`/collections/${root.slug}`}
            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm font-bold transition-colors ${
              active.id === root.id ? "text-white" : "text-gray-700 hover:bg-gray-50"
            }`}
            style={active.id === root.id ? { background: "var(--primary)" } : {}}
          >
            {root.name}
          </Link>

          {/* Sub-categories */}
          <div className="mb-1 ml-2 space-y-0.5 border-l-2 border-gray-100 pl-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/collections/${child.slug}`}
                className={itemClass(active.id === child.id, true)}
                style={active.id === child.id ? { background: "var(--primary)" } : {}}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
