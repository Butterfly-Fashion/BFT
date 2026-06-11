"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";
import { applyJerseyTiers } from "@/lib/jersey-pricing";
import { isSoldOut } from "@/lib/sold-out";

interface CartContextType {
  /** Raw items as added (base prices). Use pricedItems for display/checkout. */
  items: CartItem[];
  /** Items with jersey volume pricing applied — what the customer actually pays. */
  pricedItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, size: string | undefined, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

function cartKey(id: string, size?: string) {
  return `${id}::${size ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("b2c-cart");
      if (stored) {
        // Drop anything that has sold out since it was added
        const parsed = (JSON.parse(stored) as CartItem[]).filter((i) => !isSoldOut(i.slug));
        setItems(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("b2c-cart", JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (item: CartItem) => {
    if (isSoldOut(item.slug)) return; // sold-out products can never enter the cart
    setItems((prev) => {
      const key = cartKey(item.id, item.size);
      const existing = prev.find((i) => cartKey(i.id, i.size) === key);
      if (existing) {
        return prev.map((i) =>
          cartKey(i.id, i.size) === key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string, size?: string) => {
    const key = cartKey(id, size);
    setItems((prev) => prev.filter((i) => cartKey(i.id, i.size) !== key));
  };

  const updateQuantity = (id: string, size: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeItem(id, size);
      return;
    }
    const key = cartKey(id, size);
    setItems((prev) =>
      prev.map((i) => (cartKey(i.id, i.size) === key ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const pricedItems = applyJerseyTiers(items);
  const subtotal = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, pricedItems, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
