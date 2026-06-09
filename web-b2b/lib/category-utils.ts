export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
};

export type CategoryTree = Category & {
  children: Category[];
};

export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const roots = categories.filter((c) => !c.parent_id);
  return roots.map((parent) => ({
    ...parent,
    children: categories.filter((c) => c.parent_id === parent.id),
  }));
}

export function resolveFilterCategories(name: string, tree: CategoryTree[]): string[] {
  const parent = tree.find((t) => t.name === name);
  if (parent && parent.children.length > 0) {
    return parent.children.map((c) => c.name);
  }
  return [name];
}

export function navCategories(categories: Category[]) {
  const roots = categories.filter((c) => !c.parent_id);
  const display = roots.length > 0 ? roots : categories;
  return display.map((c) => ({
    label: c.name,
    href: c.slug ? `/collections/${c.slug}` : `/products?category=${encodeURIComponent(c.name)}`,
  }));
}
