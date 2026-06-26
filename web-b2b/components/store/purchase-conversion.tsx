"use client";

import { useEffect } from "react";

// Google Ads "Purchase" conversion, fired on the order confirmation page.
// transaction_id de-duplicates if the success URL is reloaded.
export function PurchaseConversion({
  value,
  currency,
  transactionId,
}: {
  value: number;
  currency: string;
  transactionId: string;
}) {
  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", "conversion", {
      send_to: "AW-18182505943/AYL5CPyd3cUcENeLjN5D",
      value,
      currency,
      transaction_id: transactionId,
    });
  }, [value, currency, transactionId]);

  return null;
}
