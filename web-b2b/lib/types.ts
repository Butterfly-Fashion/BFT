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

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  barcode?: string | null;
  base_price: number;
  image_url?: string | null;
  category: string;
  availability_status: AvailabilityStatus;
  is_bulk_available: boolean;
  is_hidden: boolean;
};

export type PricedProduct = Product & {
  display_price: number;
  has_customer_price: boolean;
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
