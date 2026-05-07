"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  // ── Confirmed cart ──
  items: CartItem[];
  count: number;
  addItem: (item: CartItem | string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // ── Order pad (cross-page staging area) ──
  orderPadItems: CartItem[];
  orderPadCount: number;
  setOrderQty: (item: CartItem, quantity: number) => void;
  addOrderPadToCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "wfg-next-cart";
const PAD_KEY = "wfg-order-pad";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderPad, setOrderPad] = useState<Record<string, CartItem>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load both from localStorage once on mount
  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    setOrderPad(JSON.parse(localStorage.getItem(PAD_KEY) || "{}"));
    setIsLoaded(true);
  }, []);

  // Persist cart
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [isLoaded, items]);

  // Persist order pad
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(PAD_KEY, JSON.stringify(orderPad));
  }, [isLoaded, orderPad]);

  const value = useMemo<CartContextValue>(() => ({
    // ── Cart ──
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
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

    // ── Order pad ──
    orderPadItems: Object.values(orderPad),
    orderPadCount: Object.values(orderPad).reduce((sum, i) => sum + i.quantity, 0),
    setOrderQty(item, quantity) {
      setOrderPad((current) => {
        if (quantity <= 0) {
          const next = { ...current };
          delete next[item.productId];
          return next;
        }
        return { ...current, [item.productId]: { ...item, quantity } };
      });
    },
    addOrderPadToCart() {
      const padItems = Object.values(orderPad);
      setItems((current) => {
        let next = [...current];
        for (const padItem of padItems) {
          const existing = next.find((i) => i.productId === padItem.productId);
          if (existing) {
            next = next.map((i) =>
              i.productId === padItem.productId
                ? { ...i, ...padItem, quantity: i.quantity + padItem.quantity }
                : i
            );
          } else {
            next = [...next, padItem];
          }
        }
        return next;
      });
      setOrderPad({});
    },
  }), [items, orderPad]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
