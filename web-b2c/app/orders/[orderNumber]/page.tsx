import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { formatCAD } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber}`,
    robots: { index: false, follow: false },
  };
}

const STATUS_STEPS: OrderStatus[] = ["paid", "packing", "shipped", "completed"];
const PICKUP_STEPS: OrderStatus[] = ["paid", "packing", "ready_for_pickup", "completed"];

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  paid: "We've received your order and payment.",
  packing: "We're preparing your items for shipment.",
  shipped: "Your order is on its way!",
  ready_for_pickup: "Your order is ready to be picked up at our location.",
  completed: "Order delivered / picked up. Thank you!",
  cancelled: "This order has been cancelled.",
  refunded: "This order has been refunded.",
};

export default async function OrderTrackingPage({ params }: Props) {
  const { orderNumber } = await params;

  const supabase = supabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("order_number", orderNumber)
    .single();

  if (!order) notFound();

  const isPickup = order.delivery_method === "pickup";
  const steps = isPickup ? PICKUP_STEPS : STATUS_STEPS;
  const currentStepIndex = steps.indexOf(order.status as OrderStatus);
  const isIssue = order.status === "cancelled" || order.status === "refunded";

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Continue Shopping
      </Link>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">Order Tracking</h1>
        <p className="text-sm font-mono text-gray-500 mt-1">{order.order_number}</p>
      </div>

      {/* Status bar */}
      {!isIssue && (
        <div className="mt-8">
          <div className="flex items-center">
            {steps.map((step, i) => {
              const done = currentStepIndex >= i;
              const active = currentStepIndex === i;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        done
                          ? "bg-[#C41E3A] text-white"
                          : "bg-gray-100 text-gray-400"
                      } ${active ? "ring-4 ring-[#C41E3A]/20" : ""}`}
                    >
                      {done && !active ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <p className={`mt-1.5 text-xs font-semibold text-center max-w-[72px] leading-tight ${done ? "text-gray-900" : "text-gray-400"}`}>
                      {ORDER_STATUS_LABELS[step]}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 ${currentStepIndex > i ? "bg-[#C41E3A]" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {STATUS_DESCRIPTIONS[order.status as OrderStatus]}
          </p>
        </div>
      )}

      {isIssue && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            {STATUS_DESCRIPTIONS[order.status as OrderStatus]}
          </p>
        </div>
      )}

      {/* Tracking info */}
      {order.tracking_number && (
        <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Tracking</p>
          <p className="font-bold text-gray-900">{order.carrier ?? "Carrier"}</p>
          <p className="font-mono text-sm text-gray-700">{order.tracking_number}</p>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              Track Package →
            </a>
          )}
        </div>
      )}

      {/* Pickup info */}
      {isPickup && (order.status === "ready_for_pickup" || order.status === "paid" || order.status === "packing") && (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Pickup Location</p>
          <p className="text-sm font-semibold text-gray-900">178 Bentworth Ave</p>
          <p className="text-sm text-gray-600">North York, ON M6A 1P7</p>
          <p className="text-xs text-gray-500 mt-1">Mon–Sat: 9 AM – 7 PM &nbsp;|&nbsp; Sun: Closed</p>
        </div>
      )}

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Items Ordered</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item: { name: string; quantity: number; unit_price: number; size: string | null }, i: number) => (
              <li key={i} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-gray-700">
                  <span className="font-semibold">{item.quantity}×</span> {item.name}
                  {item.size && <span className="text-gray-400 ml-1">({item.size})</span>}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCAD(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="space-y-1 text-sm">
              {order.subtotal != null && (
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatCAD(order.subtotal)}</span>
                </div>
              )}
              {order.shipping_cost != null && (
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>{order.shipping_cost === 0 ? "Free" : formatCAD(order.shipping_cost)}</span>
                </div>
              )}
              {order.tax_amount != null && (
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span><span>{formatCAD(order.tax_amount)}</span>
                </div>
              )}
              {order.total != null && (
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                  <span>Total</span>
                  <span className="text-[#C41E3A]">{formatCAD(order.total)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Shipping To</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {order.customer_name && <>{order.customer_name}<br /></>}
            {order.shipping_address.street}<br />
            {order.shipping_address.city}, {order.shipping_address.province}{" "}
            {order.shipping_address.postal}<br />
            {order.shipping_address.country}
          </p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Need help?{" "}
        <a href="mailto:jameskimkim1@gmail.com" className="text-[#C41E3A] hover:underline">
          jameskimkim1@gmail.com
        </a>
      </p>
    </main>
  );
}
