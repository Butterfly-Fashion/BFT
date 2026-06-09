export type Role = "guest" | "customer" | "admin";
export type OrderStatus =
  | "Pending Review"
  | "Approved"
  | "Payment Link Sent"
  | "Paid"
  | "Processing"
  | "Label Created"
  | "Ready for Pickup"
  | "Shipped"
  | "Completed"
  | "Cancelled"
  | "Refunded";
export type PaymentStatus = "Unpaid" | "Payment Link Sent" | "Paid" | "Refunded" | "Failed";
export type DeliveryMethod = "Pickup" | "Shipping";
export type AvailabilityStatus = "Available" | "Limited" | "Manual Confirm" | "Hidden";
export type PreorderStatus = "open" | "closed" | "cancelled";
export type SalesChannel = "b2c" | "b2b";

export type Profile = {
  id: string;
  auth_user_id: string;
  role: Role;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  business_type: string;
  is_b2b_approved: boolean;
  tax_number?: string | null;
  website?: string | null;
  notes?: string | null;
  preferred_delivery_method?: DeliveryMethod | null;
};

export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductVariant = {
  label: string;
  barcode: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  barcode?: string | null;
  unit_price: number;
  case_price?: number | null;
  case_qty?: number | null;
  image_url?: string | null;
  additional_images?: string[] | null;
  options?: ProductOption[] | null;
  variants?: ProductVariant[] | null;
  internal_notes?: string | null;
  category: string;
  availability_status: AvailabilityStatus;
  is_bulk_available: boolean;
  is_hidden: boolean;
  sales_channels?: SalesChannel[] | null;
  /* B2B wholesale fields */
  stock_qty?: number | null;
  country?: string | null;
  lead_time?: string | null;
  weight_kg?: number | null;
  box_length_cm?: number | null;
  box_width_cm?: number | null;
  box_height_cm?: number | null;
};

export type PricedProduct = Product & {
  display_price: number;
  display_case_price: number | null;
  has_customer_price: boolean;
};

export type CustomerPrice = {
  id: string;
  customer_id: string;
  product_id: string;
  unit_price: number | null;
  case_price: number | null;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
  name?: string;
  sku?: string;
  price?: number;
  imageUrl?: string | null;
  slug?: string;
};

export type Order = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  delivery_method: DeliveryMethod;
  shipping_address?: string | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  stripe_payment_link?: string | null;
  stripe_session_id?: string | null;
  paid_at?: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
};

export type PreorderCampaign = {
  id: string;
  product_id: string;
  title: string;
  description: string;
  unit_price: number;
  case_price: number | null;
  case_qty: number | null;
  status: PreorderStatus;
  closes_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PreorderCommitment = {
  id: string;
  campaign_id: string;
  customer_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LookbookItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  season: string | null;
  linked_product_slug: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};
