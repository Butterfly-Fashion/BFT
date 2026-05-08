export const HST_RATE = 0.13;

export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0));
}

export function calculateTotals(items: Array<{ quantity: number; unitPrice: number }>, adjustments = { shipping: 0, discount: 0, tax: undefined as number | undefined }) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discount = roundMoney(adjustments.discount || 0);
  const shipping = roundMoney(adjustments.shipping || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = roundMoney(adjustments.tax ?? taxable * HST_RATE);
  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: roundMoney(taxable + shipping + tax),
  };
}
