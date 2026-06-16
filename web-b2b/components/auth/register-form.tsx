"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { registerAction } from "@/app/actions";

type State = { error?: string; values?: Record<string, string> } | null;

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function PasswordInput({
  name,
  autoComplete,
}: {
  name: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="field pr-10"
        name={name}
        required
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(registerAction, null);
  const v = state?.values || {};

  return (
    <form key={v._ts || ""} action={formAction} className="grid gap-6">
      {/* Business info */}
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Business information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Business name <Required />
            <input className="field" name="business_name" required defaultValue={v.business_name} />
          </label>
          <label className="label">
            Contact name <Required />
            <input className="field" name="contact_name" required defaultValue={v.contact_name} />
          </label>
          <label className="label">
            Business type <Required />
            <select className="field" name="business_type" required defaultValue={v.business_type || ""}>
              <option value="">Select…</option>
              <option>Retailer</option>
              <option>Wholesaler</option>
              <option>Distributor</option>
            </select>
          </label>
          <label className="label">
            Tax number <span className="normal-case font-semibold">(optional)</span>
            <input className="field" name="tax_number" defaultValue={v.tax_number} />
          </label>
          <label className="label sm:col-span-2">
            Website <span className="normal-case font-semibold">(optional)</span>
            <input className="field" name="website" type="url" placeholder="https://" defaultValue={v.website} />
          </label>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Contact &amp; login</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Email address <Required />
            <input className="field" name="email" required type="email" autoComplete="email" defaultValue={v.email} />
          </label>
          <label className="label">
            Phone number <span className="normal-case font-semibold">(optional)</span>
            <input className="field" name="phone" type="tel" defaultValue={v.phone} />
          </label>
          <label className="label">
            Password <Required />
            <PasswordInput name="password" autoComplete="new-password" />
          </label>
          <label className="label">
            Confirm password <Required />
            <PasswordInput name="confirm_password" autoComplete="new-password" />
          </label>
          <p className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
            Minimum 6 characters. Both fields must match.
          </p>
        </div>
      </div>

      {/* Address */}
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Business address</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">
            Street address <Required />
            <input className="field" name="business_address" required defaultValue={v.business_address} />
          </label>
          <label className="label">
            City <Required />
            <input className="field" name="city" required defaultValue={v.city} />
          </label>
          <label className="label">
            Province / State <Required />
            <input className="field" name="province" required defaultValue={v.province} />
          </label>
          <label className="label">
            Postal / ZIP code <Required />
            <input className="field" name="postal_code" required defaultValue={v.postal_code} />
          </label>
          <label className="label">
            Country <Required />
            <input className="field" name="country" required defaultValue={v.country || "Canada"} />
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Preferences</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Preferred delivery
            <select className="field" name="preferred_delivery_method" defaultValue={v.preferred_delivery_method || ""}>
              <option value="">Select…</option>
              <option>Pickup</option>
              <option>Shipping</option>
            </select>
          </label>
          <label className="label sm:col-span-2">
            Notes <span className="normal-case font-semibold">(optional)</span>
            <textarea
              className="field min-h-20"
              name="notes"
              placeholder="Any additional information about your business or ordering needs"
              defaultValue={v.notes}
            />
          </label>
        </div>
      </div>

      {/* Newsletter consent */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
        <input name="newsletter_consent" type="checkbox" className="mt-0.5 shrink-0 accent-(--primary)" defaultChecked />
        <span>
          <span className="font-semibold">Subscribe to the Butterfly Fashion wholesale newsletter</span>
          <span className="mt-0.5 block text-xs font-normal text-slate-400">
            New arrivals, seasonal promotions, restock alerts, and exclusive wholesale deals. Unsubscribe anytime.
          </span>
        </span>
      </label>

      {/* Terms */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
        <input name="agree_to_terms" required type="checkbox" className="mt-0.5 shrink-0 accent-(--primary)" />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="font-black text-(--primary) hover:underline">Terms of Use</Link>
          {" "}and{" "}
          <Link href="/privacy" target="_blank" className="font-black text-(--primary) hover:underline">Privacy Policy</Link>
          {" "}of the Butterfly Fashion Trading B2B platform.
        </span>
      </label>

      {state?.error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button className="btn-primary" disabled={isPending} type="submit">
        {isPending ? "Working..." : "Create B2B account"}
      </button>
    </form>
  );
}
