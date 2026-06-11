"use client";

import Link from "next/link";
import { Lock, RotateCcw, Truck } from "lucide-react";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { calculateTax, formatCAD } from "@/lib/money";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED } from "@/lib/checkout-status";
import { trackBeginCheckout } from "@/lib/gtag";
import { TAX_LINE_ITEM_NAME } from "@/lib/stripe-line-items";
import { isSoldOut } from "@/lib/sold-out";

const ALBUM_SLUG  = "panini-fifa-world-cup-2026-official-sticker-album";
const BOX_SLUG    = "panini-fifa-world-cup-2026-sticker-box-50-packs";
const BUNDLE_SLUG = "panini-fifa-world-cup-2026-bundle-album-sticker-box";

const UPSELL_DATA = {
  album: {
    name: "Panini FIFA World Cup 2026 Sticker Box – 50 Packs",
    slug: BOX_SLUG,
    price: 125,
    image: "/asset/stickers/world_cup_sticker_box_50.png",
    gradient: "linear-gradient(145deg, #4a2d6e 0%, #7c4aa8 100%)",
    message: "You have the album — now fill it.",
    sub: "350 stickers · All 48 nations · Rare parallels inside",
  },
  box: {
    name: "Panini FIFA World Cup 2026 Official Sticker Album",
    slug: ALBUM_SLUG,
    price: 8.99,
    image: "/asset/stickers/fwc26_stickerbook_cover.png",
    gradient: "linear-gradient(145deg, #4a2d6e 0%, #7c4aa8 100%)",
    message: "Don't forget the album.",
    sub: "670 sticker slots · All 48 nations · Only $8.99",
  },
};

function StickerUpsell() {
  const { items, addItem } = useCart();
  const slugs = items.map((i) => i.slug);

  const hasAlbum  = slugs.includes(ALBUM_SLUG);
  const hasBox    = slugs.includes(BOX_SLUG);
  const hasBundle = slugs.includes(BUNDLE_SLUG);

  if (hasBundle) return null;

  let upsell: typeof UPSELL_DATA.album | null = null;
  if (hasAlbum && !hasBox)  upsell = UPSELL_DATA.album;
  if (hasBox   && !hasAlbum) upsell = UPSELL_DATA.box;
  // Never pitch a sold-out product
  if (!upsell || isSoldOut(upsell.slug)) return null;

  return (
    <div className="rounded-xl border-2 border-brand/30 bg-red-50 p-4 flex items-center gap-4">
      <div
        className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden"
        style={{ background: upsell.gradient }}
      >
        <ProductImage src={upsell.image} alt={upsell.name} placeholderGradient={upsell.gradient} sizes="56px" className="object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900">{upsell.message}</p>
        <p className="text-xs text-gray-500 mt-0.5">{upsell.sub}</p>
      </div>
      <button
        onClick={() => addItem({
          id: upsell!.slug,
          slug: upsell!.slug,
          name: upsell!.name,
          price: upsell!.price,
          quantity: 1,
          imageUrl: upsell!.image,
          placeholderGradient: upsell!.gradient,
          weightKg: upsell!.slug === BOX_SLUG ? 1.5 : 0.3,
        })}
        className="shrink-0 px-4 py-2 bg-brand text-white text-xs font-bold rounded-full hover:bg-brand-hover transition-colors whitespace-nowrap"
      >
        Add {formatCAD(upsell.price)}
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, pricedItems, removeItem, updateQuantity, subtotal } = useCart();
  const pickupTax = calculateTax(subtotal, "ON");
  const estimatedTotal = subtotal + pickupTax;
  const checkoutHref = CHECKOUT_ENABLED ? "/checkout" : "/cart";
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-5xl mb-6">Cart</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <p className="text-gray-500 text-sm mb-8">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-brand text-white font-semibold rounded-full hover:bg-brand-hover transition-colors text-sm"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20 md:pb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {pricedItems.map((item) => {
              const key = `${item.id}::${item.size ?? ""}`;

              return (
                <div
                  key={key}
                  className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div
                    className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden"
                    style={{ background: item.placeholderGradient }}
                  >
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderGradient={item.placeholderGradient}
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-0.5 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.size && (
                      <p className="text-xs text-gray-400 mb-2">Size: {item.size}</p>
                    )}
                    <p className="text-base font-black text-gray-900">
                      {formatCAD(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-semibold"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-semibold"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <StickerUpsell />

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCAD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pickup</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <div className="text-xs text-gray-400 -mt-1">
                  Shipping is available and calculated at checkout
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{TAX_LINE_ITEM_NAME}</span>
                  <span className="font-medium text-gray-900">{formatCAD(pickupTax)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-4 block rounded-xl border border-green-200 bg-green-50 px-3 py-3 hover:bg-green-100 transition-colors"
              >
                <p className="text-xs font-bold text-green-900">📍 Free Local Pickup Available</p>
                <p className="text-xs text-green-800 mt-0.5 font-medium">178 Bentworth Ave, North York, ON</p>
                <p className="text-[11px] text-green-700 mt-0.5">Mon–Sat 9 AM–7 PM · <strong>Sun</strong> 11 AM–4:30 PM ET — Select at checkout</p>
              </Link>

              <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between text-gray-900">
                <span className="font-bold text-lg">Pickup Total</span>
                <span className="font-black text-xl text-brand">
                  {formatCAD(estimatedTotal)}
                </span>
              </div>

              <Link
                href={checkoutHref}
                onClick={() => {
                  if (!CHECKOUT_ENABLED) return;
                  trackBeginCheckout({
                    value: estimatedTotal,
                    items: items.map((i) => ({
                      id: i.id,
                      name: i.name,
                      price: i.price,
                      quantity: i.quantity,
                      size: i.size,
                    })),
                  });
                }}
                className="mt-5 block w-full py-3.5 bg-brand text-white font-semibold rounded-full text-center hover:bg-brand-hover transition-colors text-sm shadow-sm"
              >
                {CHECKOUT_ENABLED ? `Checkout - ${formatCAD(estimatedTotal)}` : "Checkout Paused"}
              </Link>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                {CHECKOUT_ENABLED ? "No account needed - guest checkout available" : CHECKOUT_DISABLED_MESSAGE}
              </p>

              <Link
                href="/products"
                className="mt-3 block w-full py-3 text-gray-600 font-medium text-center hover:text-gray-900 transition-colors text-sm"
              >
                Continue Shopping
              </Link>

              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-4 w-4 text-brand" />
                  <span className="text-[10px] font-semibold text-gray-500 leading-tight">Ships from<br/>Toronto</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="h-4 w-4 text-brand" />
                  <span className="text-[10px] font-semibold text-gray-500 leading-tight">30-day<br/>returns</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Lock className="h-4 w-4 text-brand" />
                  <span className="text-[10px] font-semibold text-gray-500 leading-tight">Secure<br/>payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="text-sm">
          <span className="font-bold text-gray-900">{formatCAD(estimatedTotal)}</span>
          <span className="text-gray-400 text-xs ml-1">- pickup available</span>
        </div>
        <Link
          href={checkoutHref}
          onClick={() => {
            if (!CHECKOUT_ENABLED) return;
            trackBeginCheckout({
              value: estimatedTotal,
              items: items.map((i) => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                size: i.size,
              })),
            });
          }}
          className="shrink-0 px-6 py-2.5 bg-brand text-white font-semibold rounded-full text-sm hover:bg-brand-hover transition-colors"
        >
          {CHECKOUT_ENABLED ? "Checkout" : "Paused"}
        </Link>
      </div>
    </>
  );
}
