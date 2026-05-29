import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 border border-green-100">
          <Mail size={28} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-black text-slate-900">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          We&apos;ve sent a confirmation link to your email address.
          Click the link to verify your account and complete registration.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-left text-sm text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">What to do next:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-500">
            <li>Open your inbox</li>
            <li>Find the email from Butterfly Fashion Trading</li>
            <li>Click <span className="font-semibold text-green-700">Confirm your email</span></li>
            <li>You&apos;ll be redirected to log in</li>
          </ol>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link href="/register" className="font-semibold text-green-700 hover:underline">
            try again
          </Link>
          .
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Back to log in
        </Link>
      </div>
    </div>
  );
}
