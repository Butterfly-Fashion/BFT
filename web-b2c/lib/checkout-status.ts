export const CHECKOUT_ENABLED = true;

export const CHECKOUT_DISABLED_MESSAGE =
  "Checkout is temporarily paused while we update our shipping options. Please check back soon.";

// Orders below this merchandise subtotal (pre-tax, CAD) are pickup-only: we don't
// ship small retail orders right now, to avoid packaging/courier overhead. Pickup
// stays open at any size. Change this single value to adjust or lift the threshold.
export const SHIPPING_MIN_SUBTOTAL = 200;

export const SHIPPING_MIN_MESSAGE =
  "Orders under $200 are pickup only right now. Add more items to unlock shipping, or pick up free in North York.";
