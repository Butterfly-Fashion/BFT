import { Plus, Tag } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import {
  createCategoryAction,
  renameCategoryAction,
  toggleCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
} from "@/app/actions";
import { fetchAllCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await fetchAllCategories();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Catalog management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Categories</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Categories appear in the storefront nav and product filter sidebar. Changes take effect immediately.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Category list */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {!categories.length && (
              <div className="p-12 text-center">
                <Tag size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-400">No categories yet. Add your first one.</p>
              </div>
            )}
            {categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0">
                {/* Order */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <form action={moveCategoryAction.bind(null, cat.id, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="flex h-5 w-5 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveCategoryAction.bind(null, cat.id, "down")}>
                    <button
                      type="submit"
                      disabled={i === categories.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </form>
                </div>

                {/* Name edit */}
                <form action={renameCategoryAction} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="id" value={cat.id} />
                  <input
                    className="field flex-1 text-sm font-semibold"
                    name="name"
                    defaultValue={cat.name}
                    required
                    placeholder="Category name"
                  />
                  <button type="submit" className="btn-secondary min-h-8 px-3 text-xs">
                    Rename
                  </button>
                </form>

                {/* Active toggle */}
                <form action={toggleCategoryAction.bind(null, cat.id, !cat.is_active)}>
                  <button
                    type="submit"
                    className={`min-h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      cat.is_active
                        ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                    title={cat.is_active ? "Hide from storefront" : "Show in storefront"}
                  >
                    {cat.is_active ? "Visible" : "Hidden"}
                  </button>
                </form>

                {/* Delete */}
                <DangerForm
                  action={deleteCategoryAction.bind(null, cat.id)}
                  confirmMessage={`Delete category "${cat.name}"?\n\nExisting products in this category will NOT be deleted, but they won't appear in the category filter until reassigned.`}
                  submitLabel="×"
                  className="contents"
                />
              </div>
            ))}
          </section>

          {/* Add new */}
          <section className="card p-5">
            <h2 className="mb-1 text-base font-bold text-slate-900">Add category</h2>
            <p className="mb-4 text-xs text-slate-500">
              New categories appear in the storefront nav and product form immediately.
            </p>
            <form action={createCategoryAction} className="grid gap-3">
              <label className="label">
                Category name
                <input
                  className="field"
                  name="name"
                  required
                  placeholder="e.g. Rolling Papers"
                  autoComplete="off"
                />
              </label>
              <button className="btn-primary gap-2 w-full" type="submit">
                <Plus size={14} />
                Add category
              </button>
            </form>

            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">How it works</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Categories control the storefront filter sidebar and nav</li>
                <li>Hidden categories still show for existing products in admin</li>
                <li>Renaming updates the category name but not existing products — update those separately</li>
                <li>Deleting a category does not delete its products</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
