import { resetPasswordAction } from "@/app/actions";
import { AuthActionForm } from "@/components/auth/action-form-status";
import { ButterflyLogo } from "@/components/butterfly-logo";

export const metadata = { robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
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
        <h1 className="mb-2 text-3xl font-black">Reset password</h1>
        <p className="mb-5 text-sm font-semibold text-slate-600">Enter a new password for your account.</p>
        <AuthActionForm action={resetPasswordAction} submitLabel="Save new password">
          <label className="label">New password<input className="field" name="password" required type="password" /></label>
        </AuthActionForm>
      </section>
    </main>
  );
}
