"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import type { CartItem } from "@/lib/types";

type ReorderButtonProps = {
  items: CartItem[];
};

export function ReorderButton({ items }: ReorderButtonProps) {
  const cart = useCart();
  const router = useRouter();

  function reorder() {
    cart.clearCart();
    for (const item of items) {
      cart.addItem(item);
    }
    router.push("/cart");
  }

  return (
    <button onClick={reorder} className="btn-secondary gap-2 text-xs" type="button">
      <RefreshCw size={13} />
      Reorder
    </button>
  );
}
