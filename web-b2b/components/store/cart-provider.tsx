"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  addItem: (item: CartItem | string, quantity?: number) => void;
  setItem: (item: CartItem, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "wfg-next-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    setIsLoaded(true);
  }, []);

  // Persist cart
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [isLoaded, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    hydrated: isLoaded,
    addItem(item, quantity = 1) {
      const next: CartItem =
        typeof item === "string"
          ? { productId: item, quantity }
          : { ...item, quantity: item.quantity || quantity };
      setItems((current) => {
        const existing = current.find((i) => i.productId === next.productId);
        if (existing) {
          return current.map((i) =>
            i.productId === next.productId
              ? { ...i, ...next, quantity: i.quantity + next.quantity }
              : i
          );
        }
        return [...current, next];
      });
    },
    // Set an absolute quantity for a product, creating or removing as needed.
    setItem(item, quantity) {
      setItems((current) => {
        if (quantity <= 0) return current.filter((i) => i.productId !== item.productId);
        const existing = current.find((i) => i.productId === item.productId);
        if (existing) {
          return current.map((i) => (i.productId === item.productId ? { ...i, ...item, quantity } : i));
        }
        return [...current, { ...item, quantity }];
      });
    },
    setQuantity(productId, quantity) {
      setItems((current) =>
        quantity <= 0
          ? current.filter((i) => i.productId !== productId)
          : current.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    },
    clearCart() {
      setItems([]);
    },
  }), [items, isLoaded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
