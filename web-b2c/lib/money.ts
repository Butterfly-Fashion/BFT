export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export const FREE_SHIPPING_THRESHOLD = 99;
export const FLAT_SHIPPING = 9.99;
// Set to true to waive shipping over FREE_SHIPPING_THRESHOLD
const FREE_SHIPPING_ENABLED = false;

// Province-based flat shipping tiers (CAD)
export const PROVINCE_SHIPPING_RATES: Record<string, number> = {
  ON: 9.99,  QC: 9.99,
  BC: 14.99, AB: 14.99,
  MB: 12.99, SK: 12.99,
  NB: 14.99, NS: 14.99, NL: 19.99, PE: 14.99,
  NT: 29.99, NU: 29.99, YT: 29.99,
};

// Province tax rates (GST/HST/PST) — CRA compliant
export const PROVINCE_TAX_RATES: Record<string, number> = {
  AB: 0.05,       // GST only
  BC: 0.12,       // GST 5% + PST 7%
  MB: 0.12,       // GST 5% + PST 7%
  NB: 0.15,       // HST
  NL: 0.15,       // HST
  NS: 0.15,       // HST
  NT: 0.05,       // GST only
  NU: 0.05,       // GST only
  ON: 0.13,       // HST
  PE: 0.15,       // HST
  QC: 0.14975,    // GST 5% + QST 9.975%
  SK: 0.11,       // GST 5% + PST 6%
  YT: 0.05,       // GST only
};

export const PROVINCE_TAX_LABELS: Record<string, string> = {
  AB: "GST (5%)",
  BC: "GST + PST (12%)",
  MB: "GST + PST (12%)",
  NB: "HST (15%)",
  NL: "HST (15%)",
  NS: "HST (15%)",
  NT: "GST (5%)",
  NU: "GST (5%)",
  ON: "HST (13%)",
  PE: "HST (15%)",
  QC: "GST + QST (14.975%)",
  SK: "GST + PST (11%)",
  YT: "GST (5%)",
};

export function calculateShipping(subtotal: number, province = "ON"): number {
  if (FREE_SHIPPING_ENABLED && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return PROVINCE_SHIPPING_RATES[province] ?? FLAT_SHIPPING;
}

export function calculateTax(subtotal: number, province = "ON"): number {
  const rate = PROVINCE_TAX_RATES[province] ?? 0.13;
  return Math.round(subtotal * rate * 100) / 100;
}

export function getTaxLabel(province = "ON"): string {
  return PROVINCE_TAX_LABELS[province] ?? "Tax";
}
