export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

export const storeCategories: StoreCategory[] = [
  { id: "fashion", name: "Fashion", slug: "fashion", parent_id: null, sort_order: 10 },
  { id: "collectibles", name: "Collectibles", slug: "collectibles", parent_id: null, sort_order: 20 },
  { id: "accessories", name: "Accessories", slug: "accessories", parent_id: null, sort_order: 30 },
];

export function buildStoreCategoryChildMap(categories = storeCategories): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parent_id) {
      const children = categories
        .filter((child) => child.parent_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((child) => child.name);
      map.set(category.name, children.length > 0 ? children : [category.name]);
    }
  }
  return map;
}
