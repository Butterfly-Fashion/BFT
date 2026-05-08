"use client";

import { useActionState } from "react";

type FormState = { error?: string; success?: string } | null;

export function AuthActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="card grid gap-4 p-5">
      {children}
      {state?.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>}
      {state?.success && <p className="rounded border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">{state.success}</p>}
      <button className="btn-primary" disabled={isPending} type="submit">{isPending ? "Working..." : submitLabel}</button>
    </form>
  );
}
