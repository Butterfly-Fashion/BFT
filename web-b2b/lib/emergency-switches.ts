import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SwitchKey = "tier1_payment" | "tier2_b2b_orders" | "tier2_b2c_orders" | "tier3_maintenance";

export const SWITCH_KEYS: SwitchKey[] = ["tier1_payment", "tier2_b2b_orders", "tier2_b2c_orders", "tier3_maintenance"];

export const SWITCH_INFO: Record<SwitchKey, { tier: string; title: string; blocks: string; useWhen: string }> = {
  tier1_payment: {
    tier: "1단계",
    title: "온라인 결제만 차단",
    blocks: "새 Stripe 결제 세션 / 결제 링크 생성을 막습니다. E-Transfer, Card by Text, Pay at Pickup 등 수동 결제는 계속 사용 가능합니다.",
    useWhen: "결제 로직 이상, 이중청구가 의심될 때",
  },
  tier2_b2b_orders: {
    tier: "2단계 (B2B)",
    title: "B2B 주문 생성 차단",
    blocks: "도매 사이트에서 신규 주문 요청 제출을 막습니다. 기존 주문 처리/조회는 영향 없습니다.",
    useWhen: "재고·가격 데이터 오류가 B2B 쪽에서 발견됐을 때",
  },
  tier2_b2c_orders: {
    tier: "2단계 (B2C)",
    title: "B2C 주문 생성 차단",
    blocks: "쇼핑몰 사이트에서 신규 체크아웃 제출을 막습니다. (현재 B2C는 WHOLESALE_MODE로 체크아웃 자체가 꺼져 있어 실질적 영향은 적습니다.)",
    useWhen: "재고·가격 데이터 오류가 B2C 쪽에서 발견됐을 때",
  },
  tier3_maintenance: {
    tier: "3단계",
    title: "사이트 전체 점검 모드",
    blocks: "관리자 페이지를 제외한 두 사이트 전체를 점검 안내 페이지로 전환합니다. DB 조회 실패 시에는 안전하게 사이트를 그대로 열어둡니다(fail-open).",
    useWhen: "보안 사고, 데이터 손상 등 사이트 전체를 내려야 할 때",
  },
};

export interface EmergencySwitchRow {
  key: SwitchKey;
  enabled: boolean;
  customer_message: string;
  reason: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  enabled_by: string | null;
  updated_at: string;
}

export async function getEmergencySwitches(): Promise<EmergencySwitchRow[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("emergency_switches").select("*").order("key");
  return (data as EmergencySwitchRow[]) || [];
}

const FALLBACK_MESSAGE =
  "We hit a temporary issue and paused this for safety. Please try again shortly or contact us directly.";

/**
 * Reads a single switch fresh (no caching) at the exact moment it's needed.
 * Payment/order gates fail closed (DB hiccup = blocked, to avoid a double-charge
 * or bad-data order slipping through undetected). The site-wide maintenance gate
 * is the one exception — it fails open so a transient DB blip can't take the
 * whole storefront down.
 */
export async function checkSwitch(key: SwitchKey, opts?: { failOpen?: boolean }): Promise<{ blocked: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("emergency_switches").select("enabled, customer_message").eq("key", key).single();
  if (error || !data) {
    return { blocked: !opts?.failOpen, message: FALLBACK_MESSAGE };
  }
  return { blocked: data.enabled, message: data.customer_message || FALLBACK_MESSAGE };
}
