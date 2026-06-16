const orderStatusClasses: Record<string, string> = {
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-950",
  Approved: "border-lime-300 bg-lime-100 text-lime-900",
  "Payment Link Sent": "border-sky-300 bg-sky-100 text-sky-900",
  Paid: "border-emerald-300 bg-emerald-100 text-emerald-900",
  Processing: "border-blue-300 bg-blue-100 text-blue-900",
  "Ready for Pickup": "border-teal-300 bg-teal-100 text-teal-900",
  "Label Created": "border-indigo-300 bg-indigo-100 text-indigo-900",
  Shipped: "border-violet-300 bg-violet-100 text-violet-900",
  Completed: "border-slate-300 bg-slate-100 text-slate-800",
  Cancelled: "border-rose-300 bg-rose-100 text-rose-900",
  Refunded: "border-orange-300 bg-orange-100 text-orange-900",
};

const paymentStatusClasses: Record<string, string> = {
  Unpaid: "border-slate-300 bg-slate-100 text-slate-800",
  "Payment Link Sent": "border-sky-300 bg-sky-100 text-sky-900",
  Paid: "border-emerald-300 bg-emerald-100 text-emerald-900",
  Refunded: "border-orange-300 bg-orange-100 text-orange-900",
  Failed: "border-rose-300 bg-rose-100 text-rose-900",
};

const quoteStatusClasses: Record<string, string> = {
  Pending: "border-amber-300 bg-amber-100 text-amber-950",
  Responded: "border-blue-300 bg-blue-100 text-blue-900",
  Converted: "border-emerald-300 bg-emerald-100 text-emerald-900",
  Closed: "border-slate-300 bg-slate-100 text-slate-800",
  Cancelled: "border-rose-300 bg-rose-100 text-rose-900",
};

export function StatusBadge({ status, type = "order" }: { status: string; type?: "order" | "payment" | "quote" }) {
  const palette =
    type === "payment" ? paymentStatusClasses : type === "quote" ? quoteStatusClasses : orderStatusClasses;
  const className = palette[status] || "border-slate-300 bg-slate-100 text-slate-800";
  return <span className={`badge ${className}`}>{status}</span>;
}

export function orderRowTone(status: string) {
  if (status === "Pending Review") return "bg-amber-50/60";
  if (status === "Approved") return "bg-lime-50/70";
  if (status === "Payment Link Sent") return "bg-sky-50/60";
  if (status === "Paid") return "bg-emerald-50/60";
  if (status === "Cancelled" || status === "Refunded") return "bg-rose-50/50";
  return "";
}
