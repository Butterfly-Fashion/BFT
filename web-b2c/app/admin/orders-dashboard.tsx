"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { DbOrder, DbOrderItem, OrderStatus, ORDER_STATUS_LABELS } from "@/lib/types";
import { formatCAD } from "@/lib/money";
import { supabaseBrowser } from "@/lib/supabase";

type StatusLabel = typeof ORDER_STATUS_LABELS;

const STATUS_LABELS: StatusLabel = {
  paid: "New",
  packing: "Packing",
  shipped: "Shipped",
  ready_for_pickup: "Pickup Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  paid: "bg-white text-gray-500 border-gray-200",
  packing: "bg-amber-50 text-amber-700 border-amber-200",
  shipped: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ready_for_pickup: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
  refunded: "bg-gray-100 text-gray-500 border-gray-300",
};

const ROW_BG: Record<OrderStatus, string> = {
  paid: "bg-white hover:bg-gray-100",
  packing: "bg-amber-50 hover:bg-amber-100",
  shipped: "bg-yellow-50 hover:bg-yellow-100",
  ready_for_pickup: "bg-yellow-50 hover:bg-yellow-100",
  completed: "bg-green-50 hover:bg-green-100",
  cancelled: "bg-gray-100 hover:bg-gray-200",
  refunded: "bg-gray-100 hover:bg-gray-200",
};

const ROW_ACCENT: Record<OrderStatus, string> = {
  paid: "border-l-gray-300",
  packing: "border-l-amber-400",
  shipped: "border-l-yellow-400",
  ready_for_pickup: "border-l-yellow-400",
  completed: "border-l-green-400",
  cancelled: "border-l-gray-400",
  refunded: "border-l-gray-400",
};

const CARRIERS = ["Canada Post", "UPS", "FedEx", "Purolator", "DHL", "Other"];

type Tab = "all" | OrderStatus | "issues";

interface OrdersResponse {
  orders: DbOrder[];
  source: "supabase";
}

interface OrderDetailResponse {
  order: DbOrder;
  error?: string;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "shipping" | "pickup">("all");

  const [selected, setSelected] = useState<DbOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [linkingLabel, setLinkingLabel] = useState(false);
  const [reshiping, setReshiping] = useState(false);
  const [reshipeRates, setReshipeRates] = useState<Array<{ rate_id: string; provider: string; service: string; amount: number; estimated_days: number | null }> | null>(null);
  const [reshipeRatesLoading, setReshipeRatesLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [linkTrackingInput, setLinkTrackingInput] = useState("");
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncInput, setSyncInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  // Side panel edit state
  const [editStatus, setEditStatus] = useState<OrderStatus>("paid");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editTrackingUrl, setEditTrackingUrl] = useState("");
  const [editNote, setEditNote] = useState("");

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OrdersResponse = await res.json();
      setOrders(data.orders);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Supabase Realtime subscription — push changes instantly without polling
  const realtimeReady = useRef(false);
  useEffect(() => {
    fetchOrders();

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("admin-orders-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "channel=eq.b2c" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // New order — prepend to list (full refetch to get order_items too)
            fetchOrders(true);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DbOrder;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
            // Also update the open side-panel if it's this order
            setSelected((prev) =>
              prev && prev.id === updated.id ? { ...prev, ...updated } : prev
            );
          }
        }
      )
      .subscribe((status) => {
        realtimeReady.current = status === "SUBSCRIBED";
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  async function openPanel(order: DbOrder) {
    setSelected(order);
    setDetailLoading(true);
    setEditStatus(order.status);
    setRefundOpen(false);
    setRefundAmount("");
    setEditCarrier(order.carrier ?? "");
    setEditTracking(order.tracking_number ?? "");
    setEditTrackingUrl(order.tracking_url ?? "");
    setEditNote(order.admin_note ?? "");
    setSaveMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const data: OrderDetailResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load order details");
      const detailed = { ...data.order, _source: "supabase" as const };
      setSelected(detailed);
      setEditStatus(detailed.status);
      setEditCarrier(detailed.carrier ?? "");
      setEditTracking(detailed.tracking_number ?? "");
      setEditTrackingUrl(detailed.tracking_url ?? "");
      setEditNote(detailed.admin_note ?? "");
    } catch (e) {
      setSaveMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to load order details",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function closePanel() {
    setSelected(null);
    setSaveMsg(null);
  }

  async function handleSave() {
    if (!selected || selected._source === "stripe") return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          carrier: editCarrier || null,
          tracking_number: editTracking || null,
          tracking_url: editTrackingUrl || null,
          admin_note: editNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      // Update in list
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...data.order, _source: "supabase" } : o)));
      setSelected({ ...data.order, _source: "supabase" as const });
      setSaveMsg({ type: "ok", text: "Saved!" });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelNoRefund() {
    if (!selected || selected._source !== "supabase") return;
    if (!confirm(`Cancel order ${selected.order_number} without a Stripe refund? This cannot be undone.`)) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...data.order, _source: "supabase" as const } : o)));
      setSelected({ ...data.order, _source: "supabase" as const });
      setEditStatus("cancelled");
      setSaveMsg({ type: "ok", text: "Order cancelled (no Stripe refund)." });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRefund() {
    if (!selected || selected._source !== "supabase") return;
    const amountStr = refundAmount.trim();
    const isPartial = amountStr !== "";
    const label = isPartial
      ? `Issue a $${amountStr} CAD partial refund for order ${selected.order_number}?`
      : `Issue a FULL refund for order ${selected.order_number}? This cannot be undone.`;
    if (!confirm(label)) return;
    setProcessingRefund(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (isPartial) body.amount = parseFloat(amountStr);
      const res = await fetch(`/api/admin/orders/${selected.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      const updatedOrder = { ...data.order, _source: "supabase" as const };
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updatedOrder : o)));
      setSelected(updatedOrder);
      setEditStatus(data.new_status);
      setRefundOpen(false);
      setRefundAmount("");
      setSaveMsg({
        type: "ok",
        text: `Refunded $${data.amount_refunded_cad.toFixed(2)} CAD via Stripe (${data.is_full_refund ? "full" : "partial"}).`,
      });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Refund failed" });
    } finally {
      setProcessingRefund(false);
    }
  }

  async function handleSendEmail() {
    if (!selected || selected._source === "stripe") return;
    setSendingEmail(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/send-tracking`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setSaveMsg({ type: "ok", text: "Email sent to customer!" });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Email failed" });
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleCreateLabel() {
    if (!selected || selected._source !== "supabase") return;
    if (!confirm(`Purchase shipping label for order ${selected.order_number}?\nThis will charge your Shippo account.`)) return;
    setCreatingLabel(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/create-label`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create label");
      const updated: DbOrder = {
        ...selected,
        shippo_label_url: data.label_url,
        tracking_number: data.tracking_number ?? selected.tracking_number,
        tracking_url: data.tracking_url ?? selected.tracking_url,
        carrier: data.carrier ?? selected.carrier,
        status: "packing",
      };
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
      setSelected(updated);
      setEditStatus("packing");
      setEditTracking(data.tracking_number ?? "");
      setEditTrackingUrl(data.tracking_url ?? "");
      setEditCarrier(data.carrier ?? "");
      setSaveMsg({ type: "ok", text: "Label created! Print it below." });
    } catch (e) {
      // Before re-enabling the button, check actual DB state.
      // The label may have been created server-side even if the response was lost.
      try {
        const checkRes = await fetch(`/api/admin/orders/${selected.id}`);
        if (checkRes.ok) {
          const { order: dbOrder } = await checkRes.json();
          if (dbOrder?.shippo_label_url) {
            const refreshed: DbOrder = { ...selected, ...dbOrder, _source: "supabase" as const };
            setOrders((prev) => prev.map((o) => (o.id === selected.id ? refreshed : o)));
            setSelected(refreshed);
            if (dbOrder.shippo_label_url !== "__pending__") {
              setEditStatus(dbOrder.status ?? "packing");
              setEditTracking(dbOrder.tracking_number ?? "");
              setEditTrackingUrl(dbOrder.tracking_url ?? "");
              setEditCarrier(dbOrder.carrier ?? "");
              setSaveMsg({ type: "ok", text: "Label was created — linked!" });
            } else {
              setSaveMsg({ type: "ok", text: "Label is processing — please wait, it will appear automatically." });
            }
            return;
          }
        }
      } catch {
        // ignore check failure
      }
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Label creation failed" });
    } finally {
      setCreatingLabel(false);
    }
  }

  async function handleLinkLabel() {
    if (!selected || selected._source !== "supabase" || !linkTrackingInput.trim()) return;
    setLinkingLabel(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/link-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: linkTrackingInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to link label");
      const updated: DbOrder = {
        ...selected,
        shippo_label_url: data.label_url,
        tracking_number: data.tracking_number ?? selected.tracking_number,
        tracking_url: data.tracking_url ?? selected.tracking_url,
        carrier: data.carrier ?? selected.carrier,
        status: "packing",
      };
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
      setSelected(updated);
      setEditStatus("packing");
      setEditTracking(data.tracking_number ?? "");
      setEditTrackingUrl(data.tracking_url ?? "");
      setEditCarrier(data.carrier ?? "");
      setLinkTrackingInput("");
      setSaveMsg({ type: "ok", text: "Label linked! Print it below." });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Link failed" });
    } finally {
      setLinkingLabel(false);
    }
  }

  async function handlePrintLabel() {
    if (!selected?.shippo_label_url) return;
    try {
      // Proxy through our API to avoid CORS, then embed in 4×6 print page
      const proxyUrl = `/api/admin/label-proxy?url=${encodeURIComponent(selected.shippo_label_url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("proxy failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const win = window.open("", "_blank", "width=432,height=648");
      if (!win) return;
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shipping Label</title>
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 4in; height: 6in; overflow: hidden; background: #fff; }
    embed { width: 4in; height: 6in; display: block; }
  </style>
</head>
<body>
  <embed src="${blobUrl}" type="application/pdf" width="100%" height="100%">
  <script>
    setTimeout(function() {
      window.focus();
      window.print();
    }, 800);
  </script>
</body>
</html>`);
      win.document.close();
    } catch {
      // fallback: open PDF directly
      window.open(selected.shippo_label_url, "_blank");
    }
  }

  async function openReshipeRates() {
    if (!selected || selected._source !== "supabase") return;
    setReshipeRatesLoading(true);
    setReshipeRates(null);
    setSelectedRateId(null);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/reship-rates`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get rates");
      setReshipeRates(data.rates ?? []);
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Failed to fetch rates" });
    } finally {
      setReshipeRatesLoading(false);
    }
  }

  async function handleReship() {
    if (!selected || selected._source !== "supabase") return;
    const rate = reshipeRates?.find((r) => r.rate_id === selectedRateId);
    if (!rate) return;
    if (!confirm(`⚠️ This purchases a BRAND NEW label with ${rate.provider} — ${rate.service} for an ADDITIONAL $${rate.amount.toFixed(2)} CAD charge (on top of the existing label).\nUse this only for lost/damaged replacement shipments — not to fix or re-sync an existing label.\nA tracking email will be sent to the customer. Continue?`)) return;
    setReshiping(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/reship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_id: rate.rate_id, provider: rate.provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reship failed");
      setReshipeRates(null);
      setSelectedRateId(null);
      const updated: DbOrder = {
        ...selected,
        shippo_label_url: data.label_url,
        tracking_number: data.tracking_number ?? null,
        tracking_url: data.tracking_url ?? null,
        carrier: data.carrier ?? null,
        status: "packing",
      };
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
      setSelected(updated);
      setEditStatus("packing");
      setEditTracking(data.tracking_number ?? "");
      setEditTrackingUrl(data.tracking_url ?? "");
      setEditCarrier(data.carrier ?? "");
      setSaveMsg({ type: "ok", text: "New label created! Tracking email sent to customer." });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Reship failed" });
    } finally {
      setReshiping(false);
    }
  }

  async function handleSync() {
    if (!selected || selected._source !== "supabase") return;
    setSyncing(true);
    setSaveMsg(null);
    try {
      const input = syncInput.trim();
      const body: Record<string, string> = {};
      if (input.length > 30 && !input.includes(" ")) {
        // heuristic: long alphanumeric = transaction ID, shorter = tracking number
        if (input.startsWith("shippo_") || input.length >= 32) {
          body.transaction_id = input;
        } else {
          body.tracking_number = input;
        }
      }
      const res = await fetch(`/api/admin/orders/${selected.id}/sync-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      const updated: DbOrder = {
        ...selected,
        shippo_label_url: data.label_url,
        tracking_number: data.tracking_number ?? null,
        tracking_url: data.tracking_url ?? null,
        carrier: data.carrier ?? null,
        status: "packing",
      };
      setSelected(updated);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
      setEditStatus("packing");
      setEditTracking(data.tracking_number ?? "");
      setEditTrackingUrl(data.tracking_url ?? "");
      setEditCarrier(data.carrier ?? "");
      setSyncOpen(false);
      setSyncInput("");
      setSaveMsg({ type: "ok", text: "Label synced from Shippo!" });
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    let result = orders;

    if (activeTab !== "all") {
      if (activeTab === "issues") {
        result = result.filter((o) => o.status === "cancelled" || o.status === "refunded");
      } else {
        result = result.filter((o) => o.status === activeTab);
      }
    }

    if (deliveryFilter !== "all") {
      result = result.filter((o) => o.delivery_method === deliveryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.customer_email ?? "").toLowerCase().includes(q) ||
          (o.customer_name ?? "").toLowerCase().includes(q) ||
          (o.tracking_number ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeTab, deliveryFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, issues: 0 };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
      if (o.status === "cancelled" || o.status === "refunded") c.issues++;
    }
    return c;
  }, [orders]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "New" },
    { key: "packing", label: "Packing" },
    { key: "shipped", label: "Shipped" },
    { key: "ready_for_pickup", label: "Pickup" },
    { key: "completed", label: "Done" },
    { key: "issues", label: "Issues" },
  ];

  const isEditable = selected?._source === "supabase";

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Orders</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Search by order #, name, email, tracking…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
          />
          <div className="flex gap-2">
            {(["all", "shipping", "pickup"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDeliveryFilter(d)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  deliveryFilter === d
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                {d === "all" ? "All" : d === "shipping" ? "🚚 Ship" : "🏪 Pickup"}
              </button>
            ))}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-[#C41E3A] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {counts[tab.key] !== undefined && counts[tab.key] > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Orders Table */}
        <div className={`flex-1 overflow-auto ${selected ? "hidden md:block" : ""}`}>
          {error ? (
            <div className="p-6">
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#C41E3A]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-gray-400 text-sm">
              No orders found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 font-bold">Method</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openPanel(order)}
                    className={`cursor-pointer border-l-4 transition-all duration-100 ${ROW_ACCENT[order.status]} ${
                      selected?.id === order.id
                        ? `${ROW_BG[order.status].split(" ")[0]} ring-1 ring-inset ring-[#C41E3A]/20 shadow-sm`
                        : `${ROW_BG[order.status]} hover:shadow-sm`
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {order.customer_name && (
                        <p className="font-semibold text-gray-900 text-xs">{order.customer_name}</p>
                      )}
                      <p className="text-xs text-gray-500">{order.customer_email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-xs text-gray-700 truncate max-w-35">
                              {item.name}
                              {item.quantity > 1 && (
                                <span className="text-gray-400 ml-1">×{item.quantity}</span>
                              )}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.delivery_method === "pickup" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">
                          🏪 Pickup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          🚚 Ship
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                      {order.tracking_number && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{order.tracking_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#C41E3A]">
                      {order.total != null ? formatCAD(order.total) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Side Panel */}
        {selected && (
          <div className="w-full md:w-105 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="font-mono text-sm font-bold text-gray-900">{selected.order_number}</p>
                <p className="text-xs text-gray-400">
                  {new Date(selected.created_at).toLocaleString("en-CA", {
                    dateStyle: "medium", timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                onClick={closePanel}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Customer + delivery */}
              <div className="border-b border-gray-100 px-5 py-4 space-y-1">
                <div className="flex items-center gap-2">
                  {selected.delivery_method === "pickup" ? (
                    <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700">🏪 Pickup</span>
                  ) : (
                    <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-semibold text-sky-700">🚚 Shipping</span>
                  )}
                  <StatusBadge status={selected.status} />
                </div>
                {selected.customer_name && (
                  <p className="font-semibold text-gray-900">{selected.customer_name}</p>
                )}
                {selected.customer_email && (
                  <p className="text-sm text-gray-500">{selected.customer_email}</p>
                )}
              </div>

              {/* Items */}
              {detailLoading ? (
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="mb-3 h-3 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ) : selected.items && selected.items.length > 0 && (
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Items</p>
                  <ul className="space-y-1.5">
                    {selected.items.map((item: DbOrderItem) => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-semibold">{item.quantity}×</span> {item.name}
                          {item.size && <span className="text-gray-400"> ({item.size})</span>}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {formatCAD(item.unit_price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Shipping address */}
              {selected.shipping_address && (
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Ship To</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.shipping_address.street}<br />
                    {selected.shipping_address.city}, {selected.shipping_address.province}{" "}
                    {selected.shipping_address.postal}<br />
                    {selected.shipping_address.country}
                  </p>
                </div>
              )}

              {/* Amounts */}
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Summary</p>
                <div className="space-y-1 text-sm">
                  {selected.subtotal != null && (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>{formatCAD(selected.subtotal)}</span>
                    </div>
                  )}
                  {selected.shipping_cost != null && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{selected.shipping_cost === 0 ? "Free" : formatCAD(selected.shipping_cost)}</span>
                    </div>
                  )}
                  {selected.tax_amount != null && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span><span>{formatCAD(selected.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1 mt-1">
                    <span>Total</span>
                    <span className="text-[#C41E3A]">{selected.total != null ? formatCAD(selected.total) : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Label */}
              {selected.delivery_method !== "pickup" && isEditable && (
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Shipping Label</p>

                  {selected.shippo_label_url === "__pending__" ? (
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
                      <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      <span className="text-xs font-semibold text-blue-700">Creating label… will update automatically</span>
                    </div>
                  ) : selected.shippo_label_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
                        <span className="text-green-600 text-sm">✓</span>
                        <span className="text-xs font-semibold text-green-700">Label ready</span>
                      </div>
                      {selected.tracking_number && (
                        <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          {selected.carrier && <span className="font-bold text-gray-800 mr-2">{selected.carrier}</span>}
                          {selected.tracking_number}
                        </p>
                      )}

                      {/* Inline PDF preview */}
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <iframe
                          src={selected.shippo_label_url}
                          title="Shipping Label"
                          className="w-full"
                          style={{ height: "260px", border: "none" }}
                        />
                      </div>

                      <button
                        onClick={handlePrintLabel}
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-gray-900 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
                      >
                        🖨️ Print Label
                      </button>
                      <a
                        href={selected.shippo_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                      >
                        ↓ Open / Download PDF
                      </a>
                      {selected.tracking_url && (
                        <a
                          href={selected.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Track Package →
                        </a>
                      )}
                      {reshipeRates ? (
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
                          <p className="text-xs font-bold text-orange-800 mb-1">Select a shipping rate:</p>
                          {reshipeRates.map((r) => (
                            <label key={r.rate_id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${selectedRateId === r.rate_id ? "border-orange-400 bg-white" : "border-gray-200 bg-white hover:border-orange-300"}`}>
                              <input
                                type="radio"
                                name="reship-rate"
                                value={r.rate_id}
                                checked={selectedRateId === r.rate_id}
                                onChange={() => setSelectedRateId(r.rate_id)}
                                className="accent-orange-500"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-semibold text-gray-900">{r.provider} — {r.service}</span>
                                <span className="block text-[11px] text-gray-500">{r.estimated_days != null ? `Est. ${r.estimated_days} day${r.estimated_days !== 1 ? "s" : ""}` : "Est. days N/A"}</span>
                              </span>
                              <span className="text-sm font-bold text-gray-800 shrink-0">${r.amount.toFixed(2)}</span>
                            </label>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleReship}
                              disabled={!selectedRateId || reshiping}
                              className="flex-1 rounded-full bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                              {reshiping ? "Creating label…" : "↩ Confirm & Create Label"}
                            </button>
                            <button
                              onClick={() => { setReshipeRates(null); setSelectedRateId(null); }}
                              disabled={reshiping}
                              className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={openReshipeRates}
                          disabled={reshipeRatesLoading || reshiping}
                          className="w-full rounded-full border border-orange-300 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          {reshipeRatesLoading ? "Loading rates…" : "↩ Reship (New Label)"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!selected.shippo_rate_id && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          No rate ID — this order was placed before label tracking was enabled. Enter tracking manually below.
                        </p>
                      )}
                      {selected.shippo_rate_id && (
                        <div className="space-y-2">
                          <button
                            onClick={handleCreateLabel}
                            disabled={creatingLabel || linkingLabel || syncing}
                            className="w-full rounded-full bg-[#003876] py-2.5 text-sm font-bold text-white hover:bg-[#002a5a] transition-colors disabled:opacity-60"
                          >
                            {creatingLabel ? "Purchasing label…" : "🏷️ Create Shipping Label"}
                          </button>
                        </div>
                      )}

                      {/* Sync from Shippo — fallback when label was purchased but not saved */}
                      {syncOpen ? (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
                          <p className="text-xs font-bold text-blue-800">Sync from Shippo</p>
                          <p className="text-[11px] text-blue-600">Leave blank to auto-search, or paste a tracking number / Shippo transaction ID.</p>
                          <input
                            type="text"
                            value={syncInput}
                            onChange={(e) => setSyncInput(e.target.value)}
                            placeholder="Tracking no. or transaction ID (optional)"
                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-blue-400"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleSync} disabled={syncing} className="flex-1 rounded-full bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                              {syncing ? "Syncing…" : "⟳ Sync"}
                            </button>
                            <button onClick={() => { setSyncOpen(false); setSyncInput(""); }} disabled={syncing} className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setSyncOpen(true)} disabled={creatingLabel || linkingLabel} className="w-full rounded-full border border-blue-200 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
                          ⟳ Sync from Shippo
                        </button>
                      )}

                      {/* 트래킹 번호로 직접 라벨 연결 */}
                      <div className="pt-1 space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-500">Link label by tracking number</p>
                        <input
                          type="text"
                          value={linkTrackingInput}
                          onChange={(e) => setLinkTrackingInput(e.target.value)}
                          placeholder="e.g. 1Z2KW3552036265629"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
                        />
                        <button
                          onClick={handleLinkLabel}
                          disabled={!linkTrackingInput.trim() || linkingLabel || creatingLabel}
                          className="w-full rounded-full border border-[#003876] py-2 text-xs font-semibold text-[#003876] hover:bg-[#003876] hover:text-white transition-colors disabled:opacity-50"
                        >
                          {linkingLabel ? "Linking…" : "🔗 Link Label"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit form */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Management</p>

                {!isEditable && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 font-semibold">
                    Run the Supabase migration to enable order management for this order.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    disabled={!isEditable}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    {(Object.entries(STATUS_LABELS) as [OrderStatus, string][])
                      .filter(([val]) => val !== "cancelled" && val !== "refunded")
                      .map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                  </select>
                </div>

                {selected.delivery_method !== "pickup" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Carrier</label>
                      <select
                        value={editCarrier}
                        onChange={(e) => setEditCarrier(e.target.value)}
                        disabled={!isEditable}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">— Select carrier —</option>
                        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking Number</label>
                      <input
                        type="text"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                        placeholder="e.g. 1234 5678 9012"
                        disabled={!isEditable}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking URL</label>
                      <input
                        type="url"
                        value={editTrackingUrl}
                        onChange={(e) => setEditTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        disabled={!isEditable}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Admin Note</label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={2}
                    placeholder="Internal notes…"
                    disabled={!isEditable}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
                  />
                </div>

                {saveMsg && (
                  <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    saveMsg.type === "ok"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {saveMsg.text}
                  </div>
                )}

                {isEditable && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-full bg-[#C41E3A] py-2.5 text-sm font-bold text-white hover:bg-[#A01830] transition-colors disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                )}

                {isEditable && (
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors disabled:opacity-60"
                  >
                    {sendingEmail
                      ? "Sending…"
                      : selected.delivery_method === "pickup"
                        ? "📨 Send Pickup Ready Email"
                        : "📨 Send Tracking Email"}
                  </button>
                )}

                {isEditable && selected.status !== "cancelled" && selected.status !== "refunded" && (
                  <div className="flex flex-col gap-2 pt-1">
                    {!refundOpen ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRefundAmount(selected.total != null ? selected.total.toFixed(2) : "");
                            setRefundOpen(true);
                            setSaveMsg(null);
                          }}
                          disabled={saving || processingRefund}
                          className="flex-1 rounded-full border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          Refund & Cancel
                        </button>
                        <button
                          onClick={handleCancelNoRefund}
                          disabled={saving || processingRefund}
                          className="flex-1 rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancel (No Refund)
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3 space-y-2">
                        <p className="text-xs font-semibold text-red-700">Stripe Refund Amount (CAD)</p>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-red-600 font-medium">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={selected.total != null ? selected.total.toFixed(2) : "0.00"}
                            className="flex-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                          />
                          <span className="text-xs text-red-600">CAD</span>
                        </div>
                        <p className="text-[10px] text-red-500 leading-snug">
                          Leave blank or enter full amount for a full refund. Partial refund sets status to "cancelled".
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRefund}
                            disabled={processingRefund}
                            className="flex-1 rounded-full bg-red-500 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {processingRefund ? "Processing…" : "Confirm Refund"}
                          </button>
                          <button
                            onClick={() => { setRefundOpen(false); setRefundAmount(""); }}
                            disabled={processingRefund}
                            className="flex-1 rounded-full border border-gray-200 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selected.stripe_payment_intent && (
                  <a
                    href={`https://dashboard.stripe.com/payments/${selected.stripe_payment_intent}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    View in Stripe →
                  </a>
                )}

                <p className="text-xs text-gray-400 text-center pt-2">
                  Updated {new Date(selected.updated_at).toLocaleString("en-CA", {
                    dateStyle: "short", timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
