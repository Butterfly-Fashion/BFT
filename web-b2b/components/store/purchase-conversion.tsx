"use client";

import { useEffect } from "react";

// Fires the Google Ads "Purchase" conversion on the order confirmation page.
// transaction_id lets Ads de-duplicate if the success URL is reloaded.
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
    w.gtag?.("event", "conversion_event_purchase", {
      value,
      currency,
      transaction_id: transactionId,
    });
  }, [value, currency, transactionId]);

  return null;
}
