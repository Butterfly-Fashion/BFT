import { Plus, Tag, FolderOpen, Folder } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import {
  createCategoryAction,
  renameCategoryAction,
  toggleCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  setCategoryParentAction,
} from "@/app/actions";
import { fetchAllCategories, buildCategoryTree } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await fetchAllCategories();
  const tree = buildCategoryTree(categories);
  const roots = tree;
  const totalCount = categories.length;
  const rootOptions = categories.filter((c) => !c.parent_id);

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Catalog management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Categories</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Organise your catalog into parent and child categories. Changes appear in the storefront immediately.
            </p>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span>{totalCount} total · {roots.length} top-level</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* ── Category tree ── */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {!categories.length ? (
              <div className="p-12 text-center">
                <Tag size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-400">No categories yet. Add your first one.</p>
              </div>
            ) : (
              <div>
                {roots.map((parent, pi) => (
                  <div key={parent.id}>
                    {/* Parent row */}
                    <CategoryRow
                      cat={parent}
                      index={pi}
                      total={roots.length}
                      isParent
                      parentOptions={[]}
                      allCategories={categories}
                    />
                    {/* Children */}
                    {parent.children.map((child, ci) => (
                      <div key={child.id} className="border-t border-slate-50 bg-slate-50/60 pl-6">
                        <CategoryRow
                          cat={child}
                          index={ci}
                          total={parent.children.length}
                          isParent={false}
                          parentOptions={rootOptions}
                          allCategories={categories}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add category ── */}
          <section className="card p-5">
            <h2 className="mb-1 text-base font-bold text-slate-900">Add category</h2>
            <p className="mb-4 text-xs text-slate-500">
              Leave "Parent" blank to create a top-level category. Select a parent to create a sub-category.
            </p>
            <form action={createCategoryAction} className="grid gap-3">
              <label className="label">
                Category name
                <input
                  className="field"
                  name="name"
                  required
                  placeholder="e.g. Winter Gloves"
                  autoComplete="off"
                />
              </label>
              <label className="label">
                Parent category (optional)
                <select className="field" name="parent_id" defaultValue="">
                  <option value="">— Top-level (no parent) —</option>
                  {rootOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <button className="btn-primary gap-2 w-full" type="submit">
                <Plus size={14} />
                Add category
              </button>
            </form>

            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">How it works</p>
              <p>· <strong>Top-level</strong> categories appear in the storefront nav and filter sidebar as group headers</p>
              <p>· <strong>Sub-categories</strong> appear indented under their parent in the filter sidebar</p>
              <p>· Clicking a parent category in the storefront shows all products across its sub-categories</p>
              <p>· Renaming a category here does NOT update existing products — update those manually</p>
              <p>· Deleting a category does NOT delete its products</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function CategoryRow({
  cat,
  index,
  total,
  isParent,
  parentOptions,
  allCategories,
}: {
  cat: { id: string; name: string; is_active: boolean; parent_id: string | null };
  index: number;
  total: number;
  isParent: boolean;
  parentOptions: { id: string; name: string }[];
  allCategories: { id: string; name: string; parent_id: string | null }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 last:border-b-0">
      {/* Icon */}
      <span className="shrink-0 text-slate-400">
        {isParent ? <FolderOpen size={14} /> : <Folder size={13} />}
      </span>

      {/* Order buttons */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <form action={moveCategoryAction.bind(null, cat.id, "up")}>
          <button type="submit" disabled={index === 0} className="flex h-5 w-5 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move up">↑</button>
        </form>
        <form action={moveCategoryAction.bind(null, cat.id, "down")}>
          <button type="submit" disabled={index === total - 1} className="flex h-5 w-5 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move down">↓</button>
        </form>
      </div>

      {/* Rename */}
      <form action={renameCategoryAction} className="flex flex-1 items-center gap-2 min-w-0">
        <input type="hidden" name="id" value={cat.id} />
        <input
          className="field min-w-0 flex-1 text-sm font-semibold"
          name="name"
          defaultValue={cat.name}
          required
        />
        <button type="submit" className="btn-secondary min-h-8 shrink-0 px-3 text-xs">Save</button>
      </form>

      {/* Parent change (only for children) */}
      {!isParent && parentOptions.length > 0 && (
        <form action={setCategoryParentAction} className="flex items-center gap-1.5">
          <input type="hidden" name="id" value={cat.id} />
          <select className="field h-8 min-h-0 py-0.5 text-xs" name="parent_id" defaultValue={cat.parent_id || ""}>
            <option value="">— No parent —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-secondary min-h-8 shrink-0 px-2.5 text-xs">Move</button>
        </form>
      )}

      {/* Visible toggle */}
      <form action={toggleCategoryAction.bind(null, cat.id, !cat.is_active)}>
        <button
          type="submit"
          className={`min-h-7 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
            cat.is_active
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          {cat.is_active ? "Visible" : "Hidden"}
        </button>
      </form>

      {/* Delete */}
      <DangerForm
        action={deleteCategoryAction.bind(null, cat.id)}
        confirmMessage={`Delete "${cat.name}"?\n\nExisting products won't be deleted but may not appear in category filters.`}
        submitLabel="×"
        className="contents"
      />
    </div>
  );
}
