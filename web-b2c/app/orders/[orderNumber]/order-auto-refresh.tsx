"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TERMINAL_STATUSES = new Set(["completed", "cancelled", "refunded"]);

export function OrderAutoRefresh({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (TERMINAL_STATUSES.has(status)) return;
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [status, router]);

  return null;
}
