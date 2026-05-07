import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import { AuthActionForm } from "@/components/auth/action-form-status";
import { ButterflyLogo } from "@/components/butterfly-logo";

export default function ForgotPasswordPage() {
  return (
    <main className="container-shell grid min-h-screen place-items-center py-8">
      <section className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-sm border border-slate-200 bg-white">
            <ButterflyLogo size={40} />
          </span>
          <div>
            <span className="block text-sm font-black leading-tight">Butterfly Fashion Trading</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Trading · Toronto</span>
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-black">Forgot password?</h1>
        <p className="mb-5 text-sm font-semibold text-slate-600">Enter your account email. If an account exists, reset instructions will be sent.</p>
        <AuthActionForm action={forgotPasswordAction} submitLabel="Send reset email">
          <label className="label">Email<input className="field" name="email" required type="email" /></label>
        </AuthActionForm>
        <Link className="mt-4 inline-flex text-sm font-black text-(--accent)" href="/login">Back to login</Link>
      </section>
    </main>
  );
}
