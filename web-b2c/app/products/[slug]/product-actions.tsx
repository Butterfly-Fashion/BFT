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
import { JERSEY_KIT_SLUGS, JERSEY_TIERS, KIDS_KIT_SLUGS, jerseyUnitPrice } from "@/lib/jersey-pricing";
import { formatCAD } from "@/lib/money";
import { WHOLESALE_MODE } from "@/lib/site-mode";
import { WholesaleCta } from "@/components/store/wholesale-cta";

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

  if (WHOLESALE_MODE) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
          <p className="text-sm font-bold text-gray-900">Available wholesale / B2B</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            We supply this and our full Canada 2026 fan-gear range to retailers and
            event organizers. Contact us for B2B pricing and bulk quantities — better
            prices the more you order.
          </p>
        </div>
        <WholesaleCta className="w-full" />
        <div className="grid grid-cols-3 gap-3 pt-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <Truck className="h-5 w-5 text-brand" />
            <span className="text-[11px] font-semibold text-gray-600">Ships across Canada</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RotateCcw className="h-5 w-5 text-brand" />
            <span className="text-[11px] font-semibold text-gray-600">Bulk & repeat orders</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Lock className="h-5 w-5 text-brand" />
            <span className="text-[11px] font-semibold text-gray-600">Trusted Toronto supplier</span>
          </div>
        </div>
      </div>
    );
  }

  const isJerseyKit = JERSEY_KIT_SLUGS.has(product.slug);
  const isKidsKit = KIDS_KIT_SLUGS.has(product.slug);
  const jerseyUnit = isJerseyKit ? jerseyUnitPrice(quantity, isKidsKit) : product.price;

  return (
    <div className="space-y-5">
      {/* Jersey volume pricing */}
      {isJerseyKit && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Buy more, pay less</p>
            <p className="text-[11px] text-gray-500">mix home / away / kids sizes</p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100 text-center">
            {[...JERSEY_TIERS].reverse().map((tier) => {
              const tierPrice = isKidsKit ? tier.kids : tier.adult;
              const active = jerseyUnit === tierPrice;
              return (
                <div
                  key={tier.minQty}
                  className={`px-2 py-3 ${active ? "bg-red-50" : "bg-white"}`}
                >
                  <p className={`text-[11px] font-semibold ${active ? "text-brand" : "text-gray-400"}`}>
                    {tier.label}
                  </p>
                  <p className={`mt-0.5 text-sm font-black ${active ? "text-brand" : "text-gray-900"}`}>
                    {tier.minQty >= 8 ? "$199 / 8" : formatCAD(tierPrice)}
                  </p>
                  <p className="text-[10px] text-gray-400">{tier.minQty >= 8 ? "team rate" : "each"}</p>
                </div>
              );
            })}
          </div>
          <p className="px-4 py-2 text-[11px] leading-4 text-gray-500 border-t border-gray-100">
            Any 8 jersey sets = $199 — mix home, away, adult, and kids. The discount applies
            automatically in the cart across all jersey sets.
          </p>
        </div>
      )}

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
          {isJerseyKit && (
            <p className="mt-2 text-xs text-gray-500">
              Athletic fit — between sizes? Size up. Kids kits use number sizes 12–30.
            </p>
          )}
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
        {isJerseyKit && quantity > 1 && (
          <p className="mt-2 text-sm font-semibold text-brand">
            {formatCAD(jerseyUnit)} each — {formatCAD(jerseyUnit * quantity)} total
          </p>
        )}
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
