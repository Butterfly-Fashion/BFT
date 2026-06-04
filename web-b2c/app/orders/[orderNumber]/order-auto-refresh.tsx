"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const TERMINAL = new Set(["completed", "cancelled", "refunded"]);

export function OrderAutoRefresh({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (TERMINAL.has(status)) return;

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => { router.refresh(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, status, router]);

  return null;
}
