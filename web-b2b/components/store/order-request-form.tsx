"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Store, AlertCircle, ShoppingCart, Plus, MapPin, Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { createOrderRequestAction } from "@/app/actions";
import { useCart } from "@/components/store/cart-provider";

const ADDR_STORAGE_KEY = "wfg_saved_addresses";

type SavedAddress = {
  id: string;
  nickname: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

type AddressFormState = Omit<SavedAddress, "id">;

const EMPTY_ADDRESS_FORM: AddressFormState = {
  nickname: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
};

function formatAddress(address: AddressFormState | SavedAddress) {
  return [address.street, address.city, `${address.province} ${address.postalCode}`.trim(), address.country]
    .filter(Boolean)
    .join(", ");
}

function normalizeStoredAddress(value: unknown, index: number): SavedAddress | null {
  if (typeof value === "string") {
    return {
      id: `legacy-${index}-${value.slice(0, 12)}`,
      nickname: `Saved address ${index + 1}`,
      street: value,
      city: "",
      province: "",
      postalCode: "",
      country: "",
    };
  }

  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SavedAddress>;
  if (!raw.street && !raw.city && !raw.postalCode) return null;

  return {
    id: raw.id || `saved-${index}-${Date.now()}`,
    nickname: raw.nickname || `Saved address ${index + 1}`,
    street: raw.street || "",
    city: raw.city || "",
    province: raw.province || "",
    postalCode: raw.postalCode || "",
    country: raw.country || "Canada",
  };
}

export function OrderRequestForm({ defaultAddress }: { defaultAddress: string }) {
  const cart = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryMethod, setDeliveryMethod] = useState<"Pickup" | "Shipping">("Pickup");
  const [shippingAddress, setShippingAddress] = useState(defaultAddress);
  const [customerNotes, setCustomerNotes] = useState("");
  const [error, setError] = useState("");

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("default");
  const [showAddNew, setShowAddNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [saveNewAddr, setSaveNewAddr] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ADDR_STORAGE_KEY) || "[]");
      const normalized = Array.isArray(stored)
        ? stored.map(normalizeStoredAddress).filter((addr): addr is SavedAddress => Boolean(addr))
        : [];
      setSavedAddresses(normalized);
      localStorage.setItem(ADDR_STORAGE_KEY, JSON.stringify(normalized));
    } catch { /* ignore */ }
  }, []);

  function persistAddresses(addresses: SavedAddress[]) {
    setSavedAddresses(addresses);
    localStorage.setItem(ADDR_STORAGE_KEY, JSON.stringify(addresses));
  }

  function updateAddressForm(field: keyof AddressFormState, value: string) {
    setAddressForm((current) => ({ ...current, [field]: value }));
  }

  function selectDefaultAddress() {
    setSelectedAddressId("default");
    setShippingAddress(defaultAddress);
    setShowAddNew(false);
    setEditingAddressId(null);
  }

  function selectSavedAddress(address: SavedAddress) {
    setSelectedAddressId(address.id);
    setShippingAddress(formatAddress(address));
    setShowAddNew(false);
    setEditingAddressId(null);
  }

  function openNewAddressForm() {
    setShowAddNew(true);
    setEditingAddressId(null);
    setSelectedAddressId("");
    setAddressForm(EMPTY_ADDRESS_FORM);
    setSaveNewAddr(true);
  }

  function openEditAddressForm(address: SavedAddress) {
    setShowAddNew(true);
    setEditingAddressId(address.id);
    setSelectedAddressId(address.id);
    setAddressForm({
      nickname: address.nickname,
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country || "Canada",
    });
    setSaveNewAddr(true);
  }

  function deleteAddress(addressId: string) {
    const updated = savedAddresses.filter((address) => address.id !== addressId);
    persistAddresses(updated);
    if (selectedAddressId === addressId) selectDefaultAddress();
  }

  function cancelAddressForm() {
    setShowAddNew(false);
    setEditingAddressId(null);
    if (!selectedAddressId) selectDefaultAddress();
  }

  function confirmAddressForm() {
    const trimmed = {
      nickname: addressForm.nickname.trim(),
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      province: addressForm.province.trim(),
      postalCode: addressForm.postalCode.trim(),
      country: addressForm.country.trim(),
    };
    if (!trimmed.street || !trimmed.city || !trimmed.province || !trimmed.postalCode || !trimmed.country) return;

    const addressToUse = {
      ...trimmed,
      nickname: trimmed.nickname || (editingAddressId ? "Saved address" : `Address ${savedAddresses.length + 1}`),
    };
    const formatted = formatAddress(addressToUse);

    if (editingAddressId) {
      const updated = savedAddresses.map((address) =>
        address.id === editingAddressId ? { ...addressToUse, id: editingAddressId } : address
      );
      persistAddresses(updated);
      setSelectedAddressId(editingAddressId);
    } else if (saveNewAddr) {
      const newAddress = { ...addressToUse, id: `addr-${Date.now()}` };
      persistAddresses([...savedAddresses, newAddress]);
      setSelectedAddressId(newAddress.id);
    } else {
      setSelectedAddressId("");
    }

    setShippingAddress(formatted);
    setShowAddNew(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
  }

  const { cartTotal, cartCount } = useMemo(
    () => cart.items.reduce(
      (acc, item) => ({
        cartTotal: acc.cartTotal + (item.price || 0) * item.quantity,
        cartCount: acc.cartCount + item.quantity,
      }),
      { cartTotal: 0, cartCount: 0 }
    ),
    [cart.items]
  );

  function submit() {
    setError("");
    startTransition(async () => {
      const result = await createOrderRequestAction({
        items: cart.items,
        deliveryMethod,
        shippingAddress,
        customerNotes,
      });
      if ("error" in result && result.error) setError(result.error);
      if ("orderId" in result && result.orderId) {
        cart.clearCart();
        router.push(`/account/orders/${result.orderId}?submitted=1`);
      }
    });
  }

  return (
    <>
      {!cart.items.length && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="font-semibold text-amber-800">
            Your cart is empty — add products before submitting a request.
          </span>
          <Link href="/products" className="ml-auto font-semibold underline" style={{ color: "var(--primary)" }}>
            Browse catalog →
          </Link>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      {/* Left: form */}
      <div className="grid gap-5">
        {/* Fulfillment method */}
        <div className="card p-5">
          <h2 className="mb-4 text-base font-black text-slate-900">Fulfillment method</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["Pickup", "Shipping"] as const).map((method) => {
              const Icon = method === "Pickup" ? Store : Truck;
              const active = deliveryMethod === method;
              return (
                <label
                  key={method}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-all ${
                    active
                      ? "border-(--primary) bg-slate-50 ring-1 ring-(--primary)/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    checked={active}
                    name="delivery_method"
                    type="radio"
                    className="mt-0.5 shrink-0 accent-(--primary)"
                    onChange={() => setDeliveryMethod(method)}
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                      <Icon size={14} />
                      {method}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      {method === "Pickup" ? "We confirm pickup timing after review." : "We confirm shipping cost after review."}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Delivery address */}
        <div className={`card p-5 transition-opacity ${deliveryMethod === "Pickup" ? "opacity-50" : ""}`}>
          <h2 className="mb-4 text-base font-black text-slate-900">
            {deliveryMethod === "Pickup" ? "Pickup — no address needed" : "Shipping address"}
          </h2>

          {deliveryMethod === "Shipping" && (
            <>
              {/* Saved address options */}
              <div className="mb-3 grid gap-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-all ${
                    selectedAddressId === "default" && !showAddNew
                      ? "border-(--primary) bg-slate-50 ring-1 ring-(--primary)/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-0.5 shrink-0 accent-(--primary)"
                    checked={selectedAddressId === "default" && !showAddNew}
                    onChange={selectDefaultAddress}
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                      <MapPin size={10} />
                      Default (registered address)
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-800">{defaultAddress}</p>
                  </div>
                </label>

                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-all ${
                      selectedAddressId === address.id && !showAddNew
                        ? "border-(--primary) bg-slate-50 ring-1 ring-(--primary)/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-0.5 shrink-0 accent-(--primary)"
                      checked={selectedAddressId === address.id && !showAddNew}
                      onChange={() => selectSavedAddress(address)}
                    />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectSavedAddress(address)}
                    >
                      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                        <MapPin size={10} />
                        {address.nickname}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-800">{formatAddress(address)}</p>
                    </button>
                    <div className="relative z-10 ml-auto flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAddressForm(address)}
                        className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
                        aria-label={`Edit ${address.nickname}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAddress(address.id)}
                        className="rounded border border-red-100 bg-white p-1.5 text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                        aria-label={`Delete ${address.nickname}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new address */}
                {!showAddNew ? (
                  <button
                    type="button"
                    onClick={openNewAddressForm}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-xs font-bold text-slate-500 transition-colors hover:border-(--primary) hover:text-(--primary)"
                  >
                    <Plus size={13} /> Add a different address
                  </button>
                ) : (
                  <div className="rounded-lg border border-(--primary) bg-slate-50 p-3">
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                      {editingAddressId ? "Edit shipping address" : "New shipping address"}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="label md:col-span-2">
                        Address nickname
                        <input
                          className="field text-sm"
                          value={addressForm.nickname}
                          onChange={(e) => updateAddressForm("nickname", e.target.value)}
                          placeholder="e.g. Main warehouse, Store #2, Home"
                          autoFocus
                        />
                      </label>
                      <label className="label md:col-span-2">
                        Street address
                        <input
                          className="field text-sm"
                          value={addressForm.street}
                          onChange={(e) => updateAddressForm("street", e.target.value)}
                          placeholder="Street address"
                          required
                        />
                      </label>
                      <label className="label">
                        City
                        <input
                          className="field text-sm"
                          value={addressForm.city}
                          onChange={(e) => updateAddressForm("city", e.target.value)}
                          placeholder="City"
                          required
                        />
                      </label>
                      <label className="label">
                        Province / State
                        <input
                          className="field text-sm"
                          value={addressForm.province}
                          onChange={(e) => updateAddressForm("province", e.target.value)}
                          placeholder="ON"
                          required
                        />
                      </label>
                      <label className="label">
                        Postal code
                        <input
                          className="field text-sm"
                          value={addressForm.postalCode}
                          onChange={(e) => updateAddressForm("postalCode", e.target.value)}
                          placeholder="N2L 0B5"
                          required
                        />
                      </label>
                      <label className="label">
                        Country
                        <input
                          className="field text-sm"
                          value={addressForm.country}
                          onChange={(e) => updateAddressForm("country", e.target.value)}
                          placeholder="Canada"
                          required
                        />
                      </label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {!editingAddressId && (
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            className="accent-(--primary)"
                            checked={saveNewAddr}
                            onChange={(e) => setSaveNewAddr(e.target.checked)}
                          />
                          Save for future orders
                        </label>
                      )}
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={cancelAddressForm}
                          className="rounded px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmAddressForm}
                          className="rounded bg-(--primary) px-3 py-1 text-xs font-bold text-white"
                        >
                          {editingAddressId ? "Save address" : "Use this address"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected address display */}
              {!showAddNew && (
                <div className="rounded-lg border border-(--primary-border) bg-(--primary-light) px-3 py-2 text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>
                  Shipping to: {shippingAddress}
                </div>
              )}
            </>
          )}

          {deliveryMethod === "Pickup" && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800">178 Bentworth Ave, North York, ON M6A 1P7</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Mon–Fri · 9 AM – 5 PM ET — we confirm exact pickup timing after review.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h2 className="mb-1 text-base font-black text-slate-900">Order notes</h2>
          <p className="mb-3 text-xs font-semibold text-slate-500">
            Bulk pricing request, delivery date, or special requirements.
          </p>
          <label className="label">
            Notes (optional)
            <textarea
              className="field min-h-24"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Need 200+ units by June 15, please quote bulk rate"
            />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Right: order summary */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-black">
            <ShoppingCart size={15} />
            Order Summary
          </h2>
        </div>

        <div className="max-h-72 overflow-auto px-4 py-3">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  Qty {item.quantity}
                  {item.sku && <> · {item.sku}</>}
                </p>
              </div>
              <span className="shrink-0 text-sm font-black">
                {item.price ? formatMoney(item.price * item.quantity) : "TBD"}
              </span>
            </div>
          ))}
          {!cart.items.length && (
            <p className="py-4 text-center text-sm font-bold text-slate-400">
              Your request cart is empty. Add products before submitting.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>{cartCount} items</span>
            <span className="text-base font-black text-slate-900">{formatMoney(cartTotal)}</span>
          </div>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-800">
            Est. subtotal only — final pricing confirmed after review. No payment collected now.
          </div>
          <button
            className="btn-primary w-full py-3 text-sm text-white"
            disabled={isPending || !cart.items.length}
            onClick={submit}
            type="button"
          >
            {isPending ? "Submitting request…" : "Submit Order Request"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Fulfillment: {deliveryMethod}
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
