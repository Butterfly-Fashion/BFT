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

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "D.C." },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

export const CATEGORIES = [
  "Boxing Gloves",
  "Caps",
  "Bucket Hats",
  "Car Flags",
  "Sticker Packs",
  "Figures",
] as const;

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
