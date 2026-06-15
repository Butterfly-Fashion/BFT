export type StockStatus = "in_stock" | "restock_2_3_days" | "bestseller" | "sold_out";

export const STOCK_STATUS_VALUES: StockStatus[] = [
  "in_stock",
  "restock_2_3_days",
  "bestseller",
  "sold_out",
];

// Shown in the admin product editor dropdown.
export const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In Stock" },
  { value: "restock_2_3_days", label: "Restock in 2–3 Days" },
  { value: "bestseller", label: "Bestseller" },
  { value: "sold_out", label: "Sold Out" },
];

export interface StockStatusDisplay {
  /** Full label for the storefront availability pill (product page). */
  label: string;
  /** Compact label for product cards. */
  shortLabel: string;
  /** Whether the customer can add to cart / buy. */
  purchasable: boolean;
  /** Tailwind classes for the pill background/text/border. */
  pillClass: string;
  /** Tailwind class for the small status dot. */
  dotClass: string;
  /** Tailwind text-color class for the compact card line. */
  textClass: string;
}

const DISPLAY: Record<StockStatus, StockStatusDisplay> = {
  in_stock: {
    label: "In Stock · Pickup today or ships from Toronto",
    shortLabel: "Pickup today · ships from Toronto",
    purchasable: true,
    pillClass: "bg-green-50 border-green-200 text-green-700",
    dotClass: "bg-green-500",
    textClass: "text-green-700",
  },
  restock_2_3_days: {
    label: "Restock in 2–3 Days",
    shortLabel: "Restock in 2–3 Days",
    purchasable: true,
    pillClass: "bg-amber-50 border-amber-200 text-amber-700",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  bestseller: {
    label: "Bestseller · Pickup today or ships from Toronto",
    shortLabel: "🔥 Bestseller · in stock",
    purchasable: true,
    pillClass: "bg-brand/10 border-brand/20 text-brand",
    dotClass: "bg-brand",
    textClass: "text-brand",
  },
  sold_out: {
    label: "Sold Out",
    shortLabel: "Sold Out",
    purchasable: false,
    pillClass: "bg-gray-100 border-gray-200 text-gray-500",
    dotClass: "bg-gray-400",
    textClass: "text-gray-500",
  },
};

export function normalizeStockStatus(value: string | null | undefined): StockStatus {
  return value && STOCK_STATUS_VALUES.includes(value as StockStatus)
    ? (value as StockStatus)
    : "in_stock";
}

export function stockStatusDisplay(status: StockStatus): StockStatusDisplay {
  return DISPLAY[status];
}
