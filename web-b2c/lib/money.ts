export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export const FREE_SHIPPING_THRESHOLD = 99;
export const FLAT_SHIPPING = 9.99;
export const TAX_RATE = 0.13; // Ontario HST — swap for province-aware calculation later

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}
