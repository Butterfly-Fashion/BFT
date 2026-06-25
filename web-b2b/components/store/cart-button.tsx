"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useCartOpen } from "@/components/store/cart-open-context";
import { CartDrawer } from "@/components/store/cart-drawer";

export function CartButton() {
  const cart = useCart();
  const { cartOpen: open, setCartOpen: setOpen } = useCartOpen();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary gap-2"
      >
        <ShoppingCart size={16} />
        Cart
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-(--primary)">
          {cart.hydrated ? cart.count : ""}
        </span>
      </button>

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
