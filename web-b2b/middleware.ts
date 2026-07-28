import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Runs on every non-admin, non-api, non-static request. Only checks the
// Tier 3 "site-wide maintenance" emergency switch — everything else
// (payment/order blocks) is enforced at its own choke point in app code.
export const config = {
  matcher: ["/((?!admin|api|_next|.*\\..*).*)"],
};

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Fails open on any error/timeout: a Supabase hiccup must never take the
// whole storefront down by itself.
async function getMaintenanceState(): Promise<{ on: boolean; message: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { on: false, message: "" };
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await withTimeout(
      admin.from("emergency_switches").select("enabled, customer_message").eq("key", "tier3_maintenance").single(),
      800
    );
    if (error || !data) return { on: false, message: "" };
    return { on: Boolean(data.enabled), message: data.customer_message || "" };
  } catch {
    return { on: false, message: "" };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

export async function middleware(_req: NextRequest) {
  const { on, message } = await getMaintenanceState();
  if (!on) return NextResponse.next();

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Down for maintenance</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
div{max-width:480px}h1{font-size:1.5rem;margin-bottom:.75rem}p{color:#cbd5e1;line-height:1.6}</style>
</head><body><div><h1>Down for maintenance</h1><p>${escapeHtml(message)}</p></div></body></html>`;

  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
}
