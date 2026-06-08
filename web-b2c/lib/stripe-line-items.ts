// Names used both when creating Stripe Checkout line items (api/checkout) and when
// matching them back out of a session afterwards (verify-payment, webhook, sync-stripe,
// admin emails). Keep these in sync — Stripe matches on these strings, not IDs.
export const SHIPPING_LINE_ITEM_NAME = "Shipping";
export const TAX_LINE_ITEM_NAME = "Tax (HST 13%)";

export function isShippingOrTaxLineItem(description: string | null | undefined) {
  return description === SHIPPING_LINE_ITEM_NAME || description === TAX_LINE_ITEM_NAME;
}
