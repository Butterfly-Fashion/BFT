"use client";

import { useEffect, useState, useCallback } from "react";
import { slugify } from "@/lib/slug";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

const EMPTY_FORM = { name: "", slug: "", parent_id: "", sort_order: "0" };

export default function CategoriesDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCategories(json.categories ?? []);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const parents = categories.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  function openNew(parentId?: string) {
    setEditing(null);
    setIsNew(true);
    setForm({ name: "", slug: "", parent_id: parentId ?? "", sort_order: "0" });
    setMsg(null);
  }

  function openEdit(c: Category) {
    setIsNew(false);
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id ?? "", sort_order: String(c.sort_order) });
    setMsg(null);
  }

  function closePanel() {
    setEditing(null);
    setIsNew(false);
    setMsg(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setMsg({ type: "err", text: "Name and slug are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_id: form.parent_id || null,
        sort_order: parseInt(form.sort_order) || 0,
      };
      const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${editing!.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMsg({ type: "ok", text: isNew ? "Category created!" : "Saved!" });
      await fetchCategories();
      if (isNew) closePanel();
      else setEditing(data.category);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      closePanel();
      await fetchCategories();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  const panelOpen = isNew || editing !== null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-gray-900">Categories</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            {categories.length}
          </span>
        </div>
        <button
          onClick={() => openNew()}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition-colors"
        >
          + New Category
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree list */}
        <div className={`flex-1 overflow-auto p-6 ${panelOpen ? "hidden md:block" : ""}`}>
          {parents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-gray-400 mb-4">No categories yet.</p>
              <button onClick={() => openNew()} className="text-sm font-semibold text-brand hover:underline">
                Create your first category →
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {parents.map((parent) => {
                const children = childrenOf(parent.id);
                return (
                  <div key={parent.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    {/* Parent row */}
                    <div
                      className={`flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${editing?.id === parent.id ? "bg-blue-50" : ""}`}
                      onClick={() => openEdit(parent)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{parent.name}</span>
                        <span className="font-mono text-xs text-gray-400">{parent.slug}</span>
                        {children.length > 0 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            {children.length} sub
                          </span>
                        )}
                      </div>
                      <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Children */}
                    {children.length > 0 && (
                      <div className="border-t border-gray-100">
                        {children.map((child, i) => (
                          <div
                            key={child.id}
                            className={`flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-gray-100 ${i < children.length - 1 ? "border-b" : ""} ${editing?.id === child.id ? "bg-blue-50" : ""}`}
                            onClick={() => openEdit(child)}
                          >
                            <div className="flex items-center gap-3 pl-4">
                              <span className="text-gray-300 text-sm">└</span>
                              <span className="text-sm font-medium text-gray-700">{child.name}</span>
                              <span className="font-mono text-xs text-gray-400">{child.slug}</span>
                            </div>
                            <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add sub-category button */}
                    <div className="border-t border-dashed border-gray-100 px-5 py-2">
                      <button
                        onClick={() => openNew(parent.id)}
                        className="text-xs font-semibold text-gray-400 hover:text-brand transition-colors"
                      >
                        + Add sub-category
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit / New panel */}
        {panelOpen && (
          <div className="w-full md:w-96 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <p className="font-bold text-gray-900">{isNew ? "New Category" : "Edit Category"}</p>
              <button onClick={closePanel} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: isNew ? slugify(e.target.value) : f.slug }))}
                  placeholder="e.g. Bucket Hats"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="bucket-hats"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Parent Category</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">— Top level —</option>
                  {parents
                    .filter((p) => p.id !== editing?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>

              {msg && (
                <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${msg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {msg.text}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : isNew ? "Create Category" : "Save Changes"}
              </button>

              {!isNew && editing && (
                <button
                  onClick={() => handleDelete(editing)}
                  disabled={saving}
                  className="w-full rounded-full border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Delete Category
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
