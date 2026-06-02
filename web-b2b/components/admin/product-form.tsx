"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud, ChevronDown, ChevronRight, AlertCircle, Loader2, X, Plus, Pencil } from "lucide-react";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { upsertProductAction } from "@/app/actions";
import type { Category } from "@/lib/category-utils";
import { buildCategoryTree } from "@/lib/category-utils";

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Car Flags", slug: "car-flags", sort_order: 1, is_active: true, parent_id: null },
  { id: "2", name: "Caps", slug: "caps", sort_order: 2, is_active: true, parent_id: null },
  { id: "3", name: "Bucket Hats", slug: "bucket-hats", sort_order: 3, is_active: true, parent_id: null },
  { id: "4", name: "Boxing Gloves", slug: "boxing-gloves", sort_order: 4, is_active: true, parent_id: null },
  { id: "5", name: "Rolling Papers", slug: "rolling-papers", sort_order: 5, is_active: true, parent_id: null },
  { id: "6", name: "Bongs & Pipes", slug: "bongs-pipes", sort_order: 6, is_active: true, parent_id: null },
  { id: "7", name: "Lighters", slug: "lighters", sort_order: 7, is_active: true, parent_id: null },
  { id: "8", name: "Winter Items", slug: "winter-items", sort_order: 8, is_active: true, parent_id: null },
  { id: "9", name: "Accessories", slug: "accessories", sort_order: 9, is_active: true, parent_id: null },
];

/** Resize image to max 1200px on longest side, convert to JPEG 85% quality */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const ext = file.name.match(/\.(png|gif|webp)$/i) ? file.name : file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], ext, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

type ProductFormProps = {
  mode: "create" | "edit";
  categories?: Category[];
  product?: {
    id: string; name: string; slug: string; description?: string | null;
    sku: string; barcode?: string | null; unit_price: number;
    case_price?: number | null; case_qty?: number | null; image_url?: string | null;
    category: string; availability_status: string; is_bulk_available: boolean;
    is_hidden: boolean; sales_channels?: string[] | null; weight_kg?: number | null; box_length_cm?: number | null;
    box_width_cm?: number | null; box_height_cm?: number | null;
    stock_qty?: number | null; country?: string | null; lead_time?: string | null;
    stripe_product_id?: string | null; stripe_price_id?: string | null;
    stripe_sync_status?: "pending" | "synced" | "failed" | null;
    stripe_sync_error?: string | null; stripe_synced_at?: string | null;
    additional_images?: string[] | null;
    options?: ProductOption[] | null;
    variants?: ProductVariant[] | null;
    internal_notes?: string | null;
  };
};

function OptionalBadge() {
  return <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Optional</span>;
}

function CollapsibleSection({ title, description, defaultOpen = false, children }: {
  title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div>
          <p className="flex items-center text-sm font-bold text-slate-600">
            {title} <OptionalBadge />
          </p>
          {!open && description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
        </div>
        {open ? <ChevronDown size={14} className="shrink-0 text-slate-400" /> : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-200 p-4">{children}</div>}
    </div>
  );
}

const DRAFT_KEY_PREFIX = "bft-product-draft";

export function ProductForm({ mode, product, categories }: ProductFormProps) {
  const catList = categories?.length ? categories : FALLBACK_CATEGORIES;
  const tree = buildCategoryTree(catList);

  const [state, formAction, isPending] = useActionState(upsertProductAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || "");
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [imageInfo, setImageInfo] = useState<string | null>(null);

  // ── Variants / Options ────────────────────────────────────────────────────
  const [options, setOptions] = useState<ProductOption[]>(
    (product?.options as ProductOption[]) ?? []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    (product?.variants as ProductVariant[]) ?? []
  );
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalValues, setModalValues] = useState("");

  function openAddOption() {
    setEditingOptionIndex(null);
    setModalName("");
    setModalValues("");
    setShowOptionModal(true);
  }

  function openEditOption(index: number) {
    setEditingOptionIndex(index);
    setModalName(options[index].name);
    setModalValues(options[index].values.join(", "));
    setShowOptionModal(true);
  }

  function handleSaveOption() {
    const values = modalValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (!modalName.trim() || !values.length) return;

    if (editingOptionIndex !== null) {
      // Edit mode: replace the option and reconcile variants
      const oldValues = new Set(options[editingOptionIndex].values);
      const newValues = new Set(values);
      setOptions((prev) => prev.map((opt, i) => i === editingOptionIndex ? { name: modalName.trim(), values } : opt));
      // Remove variants that no longer exist, add new ones
      setVariants((prev) => {
        const kept = prev.filter((v) => !oldValues.has(v.label) || newValues.has(v.label));
        const existing = new Set(kept.map((v) => v.label));
        const added = values.filter((v) => !existing.has(v)).map((v) => ({ label: v, barcode: "" }));
        return [...kept, ...added];
      });
    } else {
      // Add mode
      setOptions((prev) => [...prev, { name: modalName.trim(), values }]);
      const existing = new Set(variants.map((v) => v.label));
      setVariants((prev) => [
        ...prev,
        ...values.filter((v) => !existing.has(v)).map((v) => ({ label: v, barcode: "" })),
      ]);
    }

    setModalName("");
    setModalValues("");
    setShowOptionModal(false);
  }

  function removeOption(optIndex: number) {
    const opt = options[optIndex];
    setOptions((prev) => prev.filter((_, i) => i !== optIndex));
    const removing = new Set(opt.values);
    setVariants((prev) => prev.filter((v) => !removing.has(v.label)));
  }

  function updateVariantBarcode(label: string, barcode: string) {
    setVariants((prev) =>
      prev.map((v) => (v.label === label ? { ...v, barcode } : v))
    );
  }

  // Extra image slots
  type ExtraSlot = { previewUrl: string; compressing: boolean; info: string | null };
  const [extraSlots, setExtraSlots] = useState<ExtraSlot[]>(() =>
    (product?.additional_images ?? []).map((url) => ({ previewUrl: url, compressing: false, info: null }))
  );
  const extraInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Draft persistence ──────────────────────────────────────────────────────
  const draftKey = `${DRAFT_KEY_PREFIX}-${product?.id || "new"}`;

  const [draftRestored, setDraftRestored] = useState(false);

  // On mount: restore draft only for edit mode; clear stale "new" draft for create mode
  useEffect(() => {
    if (mode === "create") {
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      return;
    }
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved || !formRef.current) return;
      const draft: Record<string, string> = JSON.parse(saved);
      const form = formRef.current;
      let restored = false;
      Object.entries(draft).forEach(([name, value]) => {
        const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (el && (el as HTMLInputElement).type !== "file") {
          el.value = value;
          restored = true;
        }
      });
      if (restored) setDraftRestored(true);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft whenever form changes (debounced via event delegation)
  function saveDraft() {
    if (!formRef.current) return;
    try {
      const fd = new FormData(formRef.current);
      const draft: Record<string, string> = {};
      fd.forEach((val, key) => {
        if (key !== "image_file" && key !== "image_url" && typeof val === "string") {
          draft[key] = val;
        }
      });
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch { /* ignore */ }
  }

  // Clear draft on successful save (the action redirects, so we clear on unmount if redirected)
  useEffect(() => {
    if (state === null && isPending === false) {
      // action completed without error — if we're still here, an error was returned
      // Draft is intentionally kept so user can fix and resubmit
    }
  }, [state, isPending]);

  // ── Image cleanup ──────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function handleExtraFile(index: number, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setExtraSlots((prev) => prev.map((s, i) => i === index ? { ...s, info: "❌ Not an image file." } : s));
      return;
    }
    setExtraSlots((prev) => prev.map((s, i) => i === index ? { ...s, compressing: true, info: null } : s));
    try {
      const originalKb = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const compressedKb = Math.round(compressed.size / 1024);
      const blobUrl = URL.createObjectURL(compressed);
      if (extraInputRefs.current[index]) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        extraInputRefs.current[index]!.files = dt.files;
      }
      const info = originalKb > compressedKb + 50
        ? `✓ ${originalKb} KB → ${compressedKb} KB`
        : `✓ ${compressedKb} KB`;
      setExtraSlots((prev) => prev.map((s, i) => i === index ? { previewUrl: blobUrl, compressing: false, info } : s));
    } catch {
      setExtraSlots((prev) => prev.map((s, i) => i === index ? { ...s, compressing: false, info: "⚠️ Could not compress." } : s));
    }
  }

  function addExtraSlot() {
    if (extraSlots.length >= 9) return;
    setExtraSlots((prev) => [...prev, { previewUrl: "", compressing: false, info: null }]);
  }

  function removeExtraSlot(index: number) {
    setExtraSlots((prev) => {
      const slot = prev[index];
      if (slot.previewUrl.startsWith("blob:")) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  // defaultCategory falls back to first available after restoring draft
  const defaultCategory = product?.category || (tree[0]?.children[0]?.name ?? tree[0]?.name ?? "");

  const hasInventory = !!(product?.stock_qty != null || product?.country || product?.lead_time);
  const hasShipping = !!(product?.weight_kg || product?.box_length_cm);
  const hasIds = !!(product?.slug || product?.sku || product?.barcode);
  const stripeStatus = product?.stripe_sync_status || (product?.stripe_product_id ? "synced" : "pending");
  const salesChannels = product?.sales_channels?.length ? product.sales_channels : ["b2b"];

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageInfo("❌ Not an image file. Please select a JPG, PNG, or WebP.");
      return;
    }
    setCompressing(true);
    setImageInfo(null);
    try {
      const originalKb = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const compressedKb = Math.round(compressed.size / 1024);

      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(compressed));

      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
      }

      if (originalKb > compressedKb + 50) {
        setImageInfo(`✓ Compressed: ${originalKb} KB → ${compressedKb} KB`);
      } else {
        setImageInfo(`✓ Image ready (${compressedKb} KB)`);
      }
    } catch {
      setImageInfo("⚠️ Could not compress — uploading original.");
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  function openFilePicker() { inputRef.current?.click(); }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <form ref={formRef} action={formAction} onChange={saveDraft} className="grid gap-5">
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      <input name="image_url" type="hidden" value={product?.image_url || ""} />
      <input name="options_json" type="hidden" value={JSON.stringify(options)} />
      <input name="variants_json" type="hidden" value={JSON.stringify(variants)} />
      {/* Extra image existing URLs — synced from extraSlots state */}
      {extraSlots.map((slot, i) => (
        <input key={i} name={`image_url_extra_${i}`} type="hidden" value={slot.previewUrl.startsWith("blob:") ? "" : slot.previewUrl} />
      ))}

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">{mode === "create" ? "New product" : "Edit product"}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {mode === "create" ? "Create product" : product?.name || "Edit product"}
          </h1>
        </div>
        <Link className="btn-secondary" href="/admin/products">← Back to products</Link>
      </div>

      {/* Draft restored banner */}
      {draftRestored && !state?.error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            ↩ Unsaved draft restored from your last session. Review before saving.
          </p>
          <button
            type="button"
            onClick={() => { try { localStorage.removeItem(draftKey); } catch { /**/ } setDraftRestored(false); }}
            className="shrink-0 text-xs font-semibold text-amber-600 hover:text-amber-900 underline"
          >
            Discard draft
          </button>
        </div>
      )}

      {/* Error banner */}
      {state?.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-800">Could not save product</p>
            <p className="mt-0.5 text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* ── Left ── */}
        <div className="grid gap-4">

          {/* Required: basics */}
          <div className="card p-5">
            <p className="mb-4 text-sm font-bold text-slate-700">Basic info</p>
            <div className="grid gap-4">
              <label className="label">
                Product name <span className="text-red-500">*</span>
                <input className="field" name="name" defaultValue={product?.name || ""} required placeholder="e.g. Canada Car Flag" />
              </label>

              <label className="label">
                Category <span className="text-red-500">*</span>
                {tree.length === 0 ? (
                  <div className="field flex items-center text-sm text-amber-700 bg-amber-50 border-amber-200">
                    No categories yet —{" "}
                    <Link href="/admin/categories" className="ml-1 underline font-semibold">add one in Admin → Categories</Link>
                  </div>
                ) : (
                  <select className="field" name="category" defaultValue={defaultCategory} required>
                    {tree.map((parent) =>
                      parent.children.length === 0 ? (
                        <option key={parent.id} value={parent.name}>{parent.name}</option>
                      ) : (
                        <optgroup key={parent.id} label={parent.name}>
                          {parent.children.map((child) => (
                            <option key={child.id} value={child.name}>{child.name}</option>
                          ))}
                        </optgroup>
                      )
                    )}
                  </select>
                )}
              </label>

              <label className="label">
                Description <OptionalBadge />
                <textarea className="field min-h-24" name="description" defaultValue={product?.description || ""} placeholder="Short product description. Leave blank if not needed." />
              </label>
            </div>
          </div>

          {/* Required: pricing */}
          <div className="card p-5">
            <p className="mb-4 text-sm font-bold text-slate-700">Pricing</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label">
                Unit price / ea <span className="text-red-500">*</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input className="field" style={{ paddingLeft: "1.5rem" }} name="unit_price" defaultValue={product?.unit_price ?? ""} required step="0.01" min="0" type="number" placeholder="0.00" />
                </div>
              </label>
              <label className="label">
                Case price <OptionalBadge />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input className="field" style={{ paddingLeft: "1.5rem" }} name="case_price" defaultValue={product?.case_price ?? ""} step="0.01" min="0" type="number" placeholder="0.00" />
                </div>
              </label>
              <label className="label">
                Case qty / MOQ <OptionalBadge />
                <input className="field" name="case_qty" defaultValue={product?.case_qty ?? ""} step="1" min="1" type="number" placeholder="e.g. 12" />
              </label>
            </div>
          </div>

          {/* Optional: variants */}
          <CollapsibleSection
            title="Product variants"
            description="Color, size, or other options — each with their own barcode"
            defaultOpen={options.length > 0}
          >
            <div className="space-y-4">
              {/* Existing options */}
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-700">{opt.name}:</span>
                  <span className="text-slate-500">{opt.values.join(", ")}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditOption(i)}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                      aria-label="Edit option"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="Remove option"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add option button */}
              <button
                type="button"
                onClick={() => openAddOption()}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <Plus size={14} /> 옵션 추가
              </button>

              {/* Variants table */}
              {variants.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">변형별 바코드 (UPC)</p>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                          <th className="px-3 py-2">변형</th>
                          <th className="px-3 py-2">바코드 (UPC)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => (
                          <tr key={v.label} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-semibold text-slate-700">{v.label}</td>
                            <td className="px-3 py-2">
                              <input
                                className="field h-8 text-sm font-mono"
                                placeholder="예: 693454880634"
                                value={v.barcode}
                                onChange={(e) => updateVariantBarcode(v.label, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Optional: inventory */}
          <CollapsibleSection title="Inventory & origin" description="Stock count, country, lead time" defaultOpen={hasInventory}>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label">
                Stock qty
                <input className="field" name="stock_qty" defaultValue={product?.stock_qty ?? ""} step="1" min="0" type="number" placeholder="Leave blank if unknown" />
                <span className="mt-1 block text-xs text-slate-400">Auto-decrements when orders complete.</span>
              </label>
              <label className="label">
                Country / variant
                <input className="field" name="country" defaultValue={product?.country ?? ""} placeholder="e.g. Canada, Mexico" />
              </label>
              <label className="label">
                Lead time
                <input className="field" name="lead_time" defaultValue={product?.lead_time ?? ""} placeholder="e.g. In stock, 2–3 days" />
              </label>
            </div>
          </CollapsibleSection>

          {/* Optional: shipping */}
          <CollapsibleSection title="Shipping dimensions" description="Weight and box size for shipping rate calculation" defaultOpen={hasShipping}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">
                Weight (kg, incl. packaging)
                <input className="field" name="weight_kg" type="number" step="0.01" min="0" placeholder="e.g. 0.25" defaultValue={product?.weight_kg ?? ""} />
              </label>
              <div>
                <p className="label mb-1">Box dimensions (cm)</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="label text-xs">L<input className="field" name="box_length_cm" type="number" step="0.1" min="0" placeholder="L" defaultValue={product?.box_length_cm ?? ""} /></label>
                  <label className="label text-xs">W<input className="field" name="box_width_cm" type="number" step="0.1" min="0" placeholder="W" defaultValue={product?.box_width_cm ?? ""} /></label>
                  <label className="label text-xs">H<input className="field" name="box_height_cm" type="number" step="0.1" min="0" placeholder="H" defaultValue={product?.box_height_cm ?? ""} /></label>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Optional: system IDs */}
          <CollapsibleSection title="System IDs" description="Auto-generated from name — only fill if you need specific values" defaultOpen={hasIds}>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label">Slug<input className="field" name="slug" defaultValue={product?.slug || ""} placeholder="auto-generate" /></label>
              <label className="label">SKU<input className="field" name="sku" defaultValue={product?.sku || ""} placeholder="auto-generate" /></label>
              <label className="label">Barcode<input className="field" name="barcode" defaultValue={product?.barcode || ""} placeholder="—" /></label>
            </div>
          </CollapsibleSection>

          {/* Internal staff notes */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-sm font-bold text-slate-700">직원 메모</p>
              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">직원 전용</span>
            </div>
            <textarea
              className="field min-h-24 resize-y text-sm"
              name="internal_notes"
              defaultValue={product?.internal_notes || ""}
              placeholder="공급처 정보, 특이사항, 주의사항 등 내부 메모. 고객에게 표시되지 않습니다."
            />
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-current"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5A5.5 5.5 0 118 2.5a5.5 5.5 0 010 11zM7.25 5.5h1.5v1.5h-1.5zm0 3h1.5v4h-1.5z"/></svg>
              고객 및 B2B 구매자에게는 표시되지 않는 내부 전용 필드입니다.
            </p>
          </div>
        </div>

        {/* ── Right: image + visibility ── */}
        <div className="grid gap-4">
          {/* Images */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center text-sm font-bold text-slate-700">
                Product images <OptionalBadge />
              </p>
              <p className="text-xs text-slate-400">{1 + extraSlots.length} / 10</p>
            </div>

            {/* Hidden file inputs */}
            <input ref={inputRef} className="hidden" name="image_file" type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
            {extraSlots.map((_, i) => (
              <input
                key={i}
                className="hidden"
                name={`image_file_extra_${i}`}
                type="file"
                accept="image/*"
                ref={(el) => { extraInputRefs.current[i] = el; }}
                onChange={(e) => handleExtraFile(i, e.target.files?.[0])}
              />
            ))}

            <div className="grid grid-cols-2 gap-2">
              {/* Main image slot */}
              <div className="relative">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Main</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openFilePicker}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`cursor-pointer rounded-lg border border-dashed p-1.5 transition-colors ${dragging ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-green-500"}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded border border-slate-200 bg-white">
                    {compressing ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader2 size={16} className="animate-spin text-green-600" />
                      </div>
                    ) : previewUrl ? (
                      <img alt="main" className="h-full w-full object-contain" src={previewUrl} />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <ImagePlus size={20} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
                {imageInfo && (
                  <p className={`mt-1 text-[10px] font-semibold ${imageInfo.startsWith("✓") ? "text-green-600" : imageInfo.startsWith("❌") ? "text-red-500" : "text-amber-600"}`}>
                    {imageInfo}
                  </p>
                )}
              </div>

              {/* Extra slots */}
              {extraSlots.map((slot, i) => (
                <div key={i} className="relative">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Photo {i + 2}</p>
                    <button
                      type="button"
                      onClick={() => removeExtraSlot(i)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => extraInputRefs.current[i]?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") extraInputRefs.current[i]?.click(); }}
                    className="cursor-pointer rounded-lg border border-dashed border-slate-300 p-1.5 transition-colors hover:border-green-500"
                  >
                    <div className="relative aspect-square overflow-hidden rounded border border-slate-200 bg-white">
                      {slot.compressing ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                          <Loader2 size={16} className="animate-spin text-green-600" />
                        </div>
                      ) : slot.previewUrl ? (
                        <img alt={`photo ${i + 2}`} className="h-full w-full object-contain" src={slot.previewUrl} />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImagePlus size={20} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>
                  {slot.info && (
                    <p className={`mt-1 text-[10px] font-semibold ${slot.info.startsWith("✓") ? "text-green-600" : slot.info.startsWith("❌") ? "text-red-500" : "text-amber-600"}`}>
                      {slot.info}
                    </p>
                  )}
                </div>
              ))}

              {/* Add more button */}
              {extraSlots.length < 9 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 invisible">Add</p>
                  <button
                    type="button"
                    onClick={addExtraSlot}
                    className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 transition-colors hover:border-green-500 hover:text-green-500"
                  >
                    <span className="text-2xl leading-none">+</span>
                  </button>
                </div>
              )}
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <UploadCloud size={12} /> Auto-compressed before upload
            </p>
          </div>

          {/* Visibility */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Visibility & status</p>
            <div className="grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Sales channels</p>
                <div className="grid gap-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
                    <input name="sales_channel_b2b" type="checkbox" defaultChecked={salesChannels.includes("b2b")} className="accent-green-600" />
                    B2B Wholesale
                  </label>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
                    <input name="sales_channel_b2c" type="checkbox" defaultChecked={salesChannels.includes("b2c")} className="accent-green-600" />
                    B2C Store
                  </label>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Choose one or both storefronts for this product.</p>
              </div>
              <label className="label">
                Availability
                <select className="field" name="availability_status" defaultValue={product?.availability_status || "Manual Confirm"}>
                  <option value="Available">Available</option>
                  <option value="Limited">Limited stock</option>
                  <option value="Manual Confirm">Manual confirm</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <input name="is_bulk_available" type="checkbox" defaultChecked={product?.is_bulk_available ?? true} className="accent-green-600" />
                Bulk ordering available
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <input name="is_hidden" type="checkbox" defaultChecked={product?.is_hidden ?? false} className="accent-green-600" />
                Hide from storefront
              </label>
            </div>
          </div>

          {/* Stripe sync */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Stripe sync</p>
            <div
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                stripeStatus === "synced"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : stripeStatus === "failed"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {stripeStatus === "synced" ? "Synced automatically" : stripeStatus === "failed" ? "Sync needs attention" : "Will sync after save"}
            </div>
            {product?.stripe_synced_at && (
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Last synced {new Date(product.stripe_synced_at).toLocaleString("en-CA")}
              </p>
            )}
            {product?.stripe_sync_error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {product.stripe_sync_error}
              </p>
            )}
            {(product?.stripe_product_id || product?.stripe_price_id) && (
              <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-400">
                {product.stripe_product_id && <p className="truncate">Product: <span className="font-mono">{product.stripe_product_id}</span></p>}
                {product.stripe_price_id && <p className="truncate">Price: <span className="font-mono">{product.stripe_price_id}</span></p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option modal */}
      {showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{editingOptionIndex !== null ? "제품 옵션 수정" : "제품 옵션 추가"}</h2>
              <button type="button" onClick={() => setShowOptionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-500">나중에 제품 옵션의 가격 및 재고 목록을 관리할 수 있습니다.</p>

            <div className="space-y-3">
              <label className="label">
                옵션 이름
                <input
                  className="field"
                  placeholder="예: 색상, 사이즈"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="label">
                선택 옵션 값
                <input
                  className="field"
                  placeholder="쉼표로 구분 (예: ARMY, BLACK, RED)"
                  value={modalValues}
                  onChange={(e) => setModalValues(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveOption(); } }}
                />
                <span className="mt-1 block text-xs text-slate-400">쉼표(,)로 구분하거나 Enter로 추가</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowOptionModal(false); setEditingOptionIndex(null); setModalName(""); setModalValues(""); }}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveOption}
                disabled={!modalName.trim() || !modalValues.trim()}
                className="btn-primary disabled:opacity-40"
              >
                {editingOptionIndex !== null ? "저장" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-1 py-3 backdrop-blur">
        <p className="text-xs text-slate-400"><span className="text-red-500">*</span> Required fields</p>
        <div className="flex gap-3">
          <Link
            className="btn-secondary"
            href="/admin/products"
            onClick={() => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } }}
          >
            Cancel
          </Link>
          <button className="btn-primary gap-2" type="submit" disabled={isPending || compressing}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
