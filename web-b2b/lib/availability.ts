export function availabilityStyle(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("in stock") || s === "available") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s.includes("limited") || s.includes("low")) return "border-amber-200 bg-amber-50 text-amber-900";
  if (s.includes("out") || s.includes("unavailable")) return "border-red-200 bg-red-50 text-red-800";
  if (s.includes("manual") || s.includes("pre-order") || s.includes("preorder")) return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

type StockInput = { availability_status?: string | null; stock_qty?: number | null };

// A product is out of stock when an admin marks it (status "Out of Stock"/"Sold Out")
// or when stock_qty is explicitly zero. Null/unset stock means "unknown" — not out.
export function isOutOfStock(product: StockInput): boolean {
  const s = (product.availability_status || "").toLowerCase();
  if (s.includes("out") || s.includes("sold")) return true;
  return product.stock_qty === 0;
}

export type StockBadge = { label: string; className: string };

// Single source of truth for the customer-facing stock tag. Out of stock wins;
// otherwise "Limited Stock" for limited/low, and everything else (including
// "Manual Confirm") simply reads "Available".
export function stockBadge(product: StockInput): StockBadge {
  if (isOutOfStock(product)) return { label: "Out of Stock", className: "border-red-200 bg-red-50 text-red-800" };
  const s = (product.availability_status || "").toLowerCase();
  if (s.includes("limited") || s.includes("low")) return { label: "Limited Stock", className: "border-amber-200 bg-amber-50 text-amber-900" };
  return { label: "Available", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
}
