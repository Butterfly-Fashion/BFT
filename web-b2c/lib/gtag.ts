export const GA_ID = "G-WPC4HFZ8N3";

declare global {
  interface Window {
    gtag: (command: string, target: string, params?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}

interface GtagItem {
  item_id?: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
  item_category?: string;
}

function send(action: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", action, params);
}

// Fire when user lands on a product detail page
export function trackViewItem(product: {
  id: string;
  name: string;
  price: number;
  category: string;
}) {
  send("view_item", {
    currency: "CAD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
        item_category: product.category,
      } satisfies GtagItem,
    ],
  });
}

// Fire when user clicks "Add to Cart"
export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  category?: string;
}) {
  send("add_to_cart", {
    currency: "CAD",
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_variant: item.size,
        item_category: item.category,
      } satisfies GtagItem,
    ],
  });
}

// Fire when user clicks "Checkout" from cart
export function trackBeginCheckout(params: {
  value: number;
  items: Array<{ id: string; name: string; price: number; quantity: number; size?: string }>;
}) {
  send("begin_checkout", {
    currency: "CAD",
    value: params.value,
    items: params.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
      item_variant: i.size,
    })),
  });
}

// Fire after payment verified on order-confirmation
export function trackPurchase(order: {
  id: string;
  total: number;
  shipping: number;
  tax: number;
  items: Array<{ id: string; name: string; price: number; quantity: number; size?: string }>;
}) {
  send("purchase", {
    transaction_id: order.id,
    currency: "CAD",
    value: order.total,
    shipping: order.shipping,
    tax: order.tax,
    items: order.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
      item_variant: i.size,
    })),
  });
}
