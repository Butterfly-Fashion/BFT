"use client";

import { createContext, useContext, useState } from "react";

const CartOpenContext = createContext<{
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
}>({ cartOpen: false, setCartOpen: () => {} });

export function CartOpenProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <CartOpenContext.Provider value={{ cartOpen, setCartOpen }}>
      {children}
    </CartOpenContext.Provider>
  );
}

export function useCartOpen() {
  return useContext(CartOpenContext);
}
