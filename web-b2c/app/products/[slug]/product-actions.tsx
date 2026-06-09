"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/components/store/cart-provider";
import { useToast } from "@/components/store/toast-provider";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Lock, RotateCcw, Truck } from "lucide-react";
import { trackViewItem, trackAddToCart } from "@/lib/gtag";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED } from "@/lib/checkout-status";
import { StickyAddToCart } from "@/components/store/sticky-add-to-cart";

interface Props {
  product: Product;
}

export function ProductActions({ product }: Props) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const buildCartItem = () => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    quantity,
    size: selectedSize,
    imageUrl: product.imageUrl,
    placeholderGradient: product.placeholderGradient,
    weightKg: product.weightKg ?? 0.5,
  });

  const handleAddToCart = () => {
    addItem(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    showToast("Added to cart ✓");
    window.dispatchEvent(new Event("cart:open"));
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize,
      category: product.category,
    });
  };

  const handleBuyNow = () => {
    if (!CHECKOUT_ENABLED) {
      showToast(CHECKOUT_DISABLED_MESSAGE);
      return;
    }
    addItem(buildCartItem());
    router.push("/checkout");
  };

  return (
    <div className="space-y-5">
      {/* Size selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Size</p>
            {selectedSize && (
              <p className="text-xs text-gray-500">{selectedSize}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`min-w-11 h-10 px-3 rounded-lg text-sm font-semibold border-2 transition-all duration-150 ${
                  selectedSize === size
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">Quantity</p>
        <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg font-medium"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg font-medium"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* CTAs */}
      <div ref={ctaRef} className="flex flex-col gap-3 pt-1">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="w-full py-3.5 rounded-full font-semibold text-sm border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {added ? "Added to Cart ✓" : product.inStock ? "Add to Cart" : "Sold Out"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!product.inStock || !CHECKOUT_ENABLED}
          className="w-full py-3.5 rounded-full font-semibold text-sm bg-brand text-white hover:bg-brand-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {CHECKOUT_ENABLED ? "Buy Now" : "Checkout Paused"}
        </button>
        {!CHECKOUT_ENABLED && (
          <p className="text-xs leading-5 text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
            {CHECKOUT_DISABLED_MESSAGE}
          </p>
        )}
      </div>

      <StickyAddToCart
        price={product.price}
        inStock={product.inStock}
        added={added}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        anchorRef={ctaRef}
      />

      <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <Truck className="h-5 w-5 text-brand" />
          <span className="text-[11px] font-semibold text-gray-600">Pickup or ships from Toronto</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RotateCcw className="h-5 w-5 text-brand" />
          <span className="text-[11px] font-semibold text-gray-600">30-day returns</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Lock className="h-5 w-5 text-brand" />
          <span className="text-[11px] font-semibold text-gray-600">Secure payments</span>
        </div>
      </div>
    </div>
  );
}
