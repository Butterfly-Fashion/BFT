"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary gap-2 text-sm print:hidden">
      <Printer size={15} />
      {label}
    </button>
  );
}
