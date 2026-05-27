import Link from "next/link";
import { ShieldCheck, CheckCircle } from "lucide-react";
import { ButterflyLogo } from "@/components/butterfly-logo";
import { loginAction } from "@/app/actions";
import { AuthActionForm } from "@/components/auth/action-form-status";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container-shell flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 group">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ButterflyLogo size={44} />
            </span>
            <div>
              <span className="block text-sm font-black leading-tight">Butterfly Fashion Trading</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500">B2B Wholesale · Toronto</span>
            </div>
          </Link>

          {registered === "1" && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold leading-relaxed text-emerald-800">
                Account created! Sign in below. B2B pricing will be activated after admin review.
              </p>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 bg-blue-50 px-6 py-4">
              <h1 className="text-xl font-black text-gray-900">Sign in to your account</h1>
              <p className="mt-0.5 text-sm font-medium text-gray-500">
                Access your B2B order history and submit new requests.
              </p>
            </div>

            <div className="p-6">
              <AuthActionForm action={loginAction} submitLabel="Sign in">
                <label className="label">
                  Email address
                  <input className="field" name="email" required type="email" autoComplete="email" />
                </label>
                <label className="label">
                  Password
                  <input className="field" name="password" required type="password" autoComplete="current-password" />
                </label>
                <div className="flex justify-end">
                  <Link className="text-xs font-bold text-(--primary) hover:underline" href="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
              </AuthActionForm>
            </div>
          </div>

          {/* B2B note */}
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-xs font-semibold leading-relaxed text-gray-500">
              This is a B2B platform. Accounts are reviewed before wholesale pricing is activated.
            </p>
          </div>

          <p className="mt-5 text-center text-sm font-semibold text-gray-600">
            Need a B2B account?{" "}
            <Link className="font-black text-(--primary) hover:underline" href="/register">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
