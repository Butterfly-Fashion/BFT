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
