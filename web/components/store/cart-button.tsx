"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";

export function CartButton() {
  const cart = useCart();
  return (
    <Link className="btn-primary gap-2" href="/cart">
      <ShoppingCart size={16} />
      Cart
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-[var(--primary)]">{cart.count}</span>
    </Link>
  );
}
