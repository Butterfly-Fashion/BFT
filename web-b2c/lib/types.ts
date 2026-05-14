export interface PlayerCard {
  name: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  comparePrice?: number;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  placeholderGradient: string;
  inStock: boolean;
  badge?: string;
  sizes?: string[];
  playerCards?: PlayerCard[];
  weightKg?: number;
}

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl: string;
  placeholderGradient: string;
  weightKg: number;
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  address: CheckoutAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
}

export function getProvinceName(code: string): string {
  const found = CANADIAN_PROVINCES.find((p) => p.code === code);
  return found ? found.name : code;
}

export const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

export const CATEGORIES = [
  "Boxing Gloves",
  "Caps",
  "Bucket Hats",
  "Car Flags",
  "Sticker Packs",
] as const;

export type Category = (typeof CATEGORIES)[number];

// ─── Supabase order management ──────────────────────────────────────────────

export type OrderStatus =
  | "paid"
  | "packing"
  | "shipped"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "New",
  packing: "Packing",
  shipped: "Shipped",
  ready_for_pickup: "Pickup Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export interface DbOrderItem {
  id: string;
  order_id: string;
  name: string;
  slug: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  image_url: string | null;
}

export interface DbOrder {
  id: string;
  order_number: string;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  channel: string;
  delivery_method: "shipping" | "pickup" | null;
  status: OrderStatus;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: {
    street: string;
    city: string;
    province: string;
    postal: string;
    country: string;
  } | null;
  subtotal: number | null;
  shipping_cost: number | null;
  tax_amount: number | null;
  total: number | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shippo_rate_id: string | null;
  shippo_label_url: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
  _source?: "supabase" | "stripe";
}

// ─── Supabase product management ────────────────────────────────────────────

export type ProductStatus = "active" | "draft" | "archived";

export interface DbProductImage {
  url: string;
  alt: string;
}

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  weight_kg: number;
  box_length_cm: number | null;
  box_width_cm: number | null;
  box_height_cm: number | null;
  badge: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  status: ProductStatus;
  images: DbProductImage[];
  player_cards: PlayerCard[] | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}
