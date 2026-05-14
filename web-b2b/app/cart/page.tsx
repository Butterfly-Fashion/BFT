import { ShoppingCart } from "lucide-react";
import { Header } from "@/components/store/header";
import { OrderRequestForm } from "@/components/store/order-request-form";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const profile = await requireProfile();
  const defaultAddress = `${profile.business_address}, ${profile.city}, ${profile.province} ${profile.postal_code}, ${profile.country}`;

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <div className="mb-7 border-b border-slate-200 pb-5">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--accent)">B2B checkout</p>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900">
            <ShoppingCart size={26} />
            Submit Order Request
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            No payment collected now — we review and send a <strong>Pay Now</strong> link after approval.
          </p>
        </div>
        <OrderRequestForm profile={profile} />
      </main>
    </>
  );
}
