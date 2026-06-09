export function availabilityStyle(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("in stock") || s === "available") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s.includes("limited") || s.includes("low")) return "border-amber-200 bg-amber-50 text-amber-900";
  if (s.includes("out") || s.includes("unavailable")) return "border-red-200 bg-red-50 text-red-800";
  if (s.includes("manual") || s.includes("pre-order") || s.includes("preorder")) return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}
