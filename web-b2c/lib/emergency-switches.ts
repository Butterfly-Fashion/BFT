import { supabaseAdmin } from "@/lib/supabase";

export type SwitchKey = "tier1_payment" | "tier2_b2b_orders" | "tier2_b2c_orders" | "tier3_maintenance";

const FALLBACK_MESSAGE =
  "We hit a temporary issue and paused this for safety. Please try again shortly or contact us directly.";

/**
 * Reads a single switch fresh (no caching) from the shared Supabase project —
 * this table is owned/managed from the B2B admin (web-b2b/app/admin/emergency),
 * B2C only reads it. Order/payment gates fail closed (DB hiccup = blocked);
 * the site-wide maintenance gate fails open so a transient DB blip can't take
 * the whole storefront down.
 */
export async function checkSwitch(key: SwitchKey, opts?: { failOpen?: boolean }): Promise<{ blocked: boolean; message: string }> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("emergency_switches").select("enabled, customer_message").eq("key", key).single();
  if (error || !data) {
    return { blocked: !opts?.failOpen, message: FALLBACK_MESSAGE };
  }
  return { blocked: data.enabled, message: data.customer_message || FALLBACK_MESSAGE };
}
