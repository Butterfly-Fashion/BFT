"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitWholesaleLeadAction } from "@/app/actions";

export function CatalogRequestForm() {
  const [state, action, pending] = useActionState(submitWholesaleLeadAction, null);
  const sourceRef = useRef<HTMLInputElement>(null);

  // Capture acquisition source (UTM params + referrer) so we know where leads come from.
  useEffect(() => {
    if (!sourceRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const utm = ["utm_source", "utm_medium", "utm_campaign"]
      .map((k) => params.get(k))
      .filter(Boolean)
      .join(" / ");
    const ref = document.referrer || "direct";
    sourceRef.current.value = utm ? `${utm} (ref: ${ref})` : ref;
  }, []);

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-black text-green-800">Thanks — request received! ✓</p>
        <p className="mt-1 text-sm text-green-700">
          We&apos;ll email you our wholesale catalog and pricing shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="source" ref={sourceRef} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          Your name
          <input className="field" name="name" autoComplete="name" />
        </label>
        <label className="label">
          Company / store *
          <input className="field" name="company" required autoComplete="organization" />
        </label>
        <label className="label">
          Email *
          <input className="field" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="label">
          Phone
          <input className="field" name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      <label className="label">
        Estimated order quantity
        <select className="field" name="expected_quantity" defaultValue="">
          <option value="">Select…</option>
          <option>1–5 cases</option>
          <option>5–20 cases</option>
          <option>20+ cases</option>
          <option>Pallet / container</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <label className="label">
        What are you looking for? (optional)
        <textarea className="field min-h-20" name="message" placeholder="Products, quantities, timeline…" />
      </label>

      {state?.error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      )}

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request wholesale catalog"}
      </button>
      <p className="text-xs text-slate-400">
        No spam. We&apos;ll only use your details to send the catalog and follow up about wholesale orders.
      </p>
    </form>
  );
}
