import Link from "next/link";
import { Info } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { ButterflyLogo } from "@/components/butterfly-logo";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="container-shell max-w-3xl">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 group">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-sm border border-slate-200 bg-white">
            <ButterflyLogo size={44} />
          </span>
          <div>
            <span className="block text-sm font-black leading-tight">Butterfly Fashion Trading</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">B2B Wholesale · Toronto</span>
          </div>
        </Link>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
            <h1 className="text-2xl font-black text-slate-900">Create a B2B account</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Fill in your business details below. Your account will be reviewed before B2B pricing is unlocked.
            </p>
          </div>

          <div className="p-6">
            <RegisterForm />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs font-semibold leading-relaxed text-slate-500">
            After registration, your account will be reviewed by our team. Once approved, you will have access to B2B pricing and can submit order requests.
          </p>
        </div>

        <p className="mt-5 text-center text-sm font-semibold text-slate-600">
          Already have an account?{" "}
          <Link className="font-black text-(--accent) hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
