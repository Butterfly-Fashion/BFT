import { Header } from "@/components/store/header";
import { OrderRequestForm } from "@/components/store/order-request-form";
import { requireProfile } from "@/lib/auth";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const profile = await requireProfile();
  const defaultAddress = [
    profile.business_address,
    profile.city,
    `${profile.province} ${profile.postal_code}`.trim(),
    profile.country,
  ].filter(Boolean).join(", ");

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        {/* Page header */}
        <div className="mb-7">
          <p className="section-label">Order</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-slate-900">
            <Truck size={26} />
            Checkout
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Choose fulfillment, add any notes, and submit your request.
            <span className="ml-1 font-semibold text-amber-700">No payment collected now</span> —
            we review and send a Pay Now link after approval.
          </p>
        </div>
        <OrderRequestForm defaultAddress={defaultAddress} />
      </main>
    </>
  );
}
