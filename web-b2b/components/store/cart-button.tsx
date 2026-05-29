"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { CartDrawer } from "@/components/store/cart-drawer";

type Props = { defaultAddress?: string };

export function CartButton({ defaultAddress = "" }: Props) {
  const cart = useCart();
  const [open, setOpen] = useState(false);

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
          {cart.count}
        </span>
      </button>

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        defaultAddress={defaultAddress}
      />
    </>
  );
}
