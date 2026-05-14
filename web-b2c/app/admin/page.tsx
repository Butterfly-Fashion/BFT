import { verifyAdminCookie } from "@/lib/admin-auth";
import { adminLogin, adminLogout } from "./actions";
import AdminShell from "./admin-shell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isAuthenticated = await verifyAdminCookie();

  if (!isAuthenticated) {
    return (
      <main className="max-w-md mx-auto px-4 py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Admin — Orders</h1>
        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Incorrect password
          </p>
        )}
        <form action={adminLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Password</span>
            <input
              type="password"
              name="password"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[#C41E3A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A01830]"
          >
            View Orders
          </button>
        </form>
      </main>
    );
  }

  return <AdminShell logoutAction={adminLogout} />;
}
