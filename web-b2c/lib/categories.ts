export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

// Matches the `categories` table in Supabase (IDs are real DB UUIDs)
export const storeCategories: StoreCategory[] = [
  // ── Top-level (parents) ───────────────────────────────────────────────────
  { id: "7e427ee8-888d-4a9e-bae1-acdd6dacb16b",  name: "Fashion",      slug: "fashion",      parent_id: null,                                     sort_order: 1 },
  { id: "2b9d867c-b189-4935-a7e1-8fe8986a0714",  name: "Collectibles", slug: "collectibles", parent_id: null,                                     sort_order: 2 },
  { id: "0b75721b-335e-4474-a7d2-56580ef24976",  name: "Accessories",  slug: "accessories",  parent_id: null,                                     sort_order: 3 },

  // ── Fashion children ──────────────────────────────────────────────────────
  { id: "41f3acc2-a1bc-4edc-8e26-074270531fe1",  name: "Caps",         slug: "caps",         parent_id: "7e427ee8-888d-4a9e-bae1-acdd6dacb16b",   sort_order: 1 },
  { id: "a626e8f3-950d-4ee4-8915-ff57fcfcd443",  name: "Bucket Hats",  slug: "bucket-hats",  parent_id: "7e427ee8-888d-4a9e-bae1-acdd6dacb16b",   sort_order: 2 },

  // ── Collectibles children ─────────────────────────────────────────────────
  { id: "272aade6-6d80-4f52-a4e6-fc8958ceb741",  name: "Boxing Gloves", slug: "boxing-gloves", parent_id: "2b9d867c-b189-4935-a7e1-8fe8986a0714", sort_order: 1 },
  { id: "551c5aed-2898-4c9e-99c8-b2de37f75282",  name: "Figures",       slug: "figures",       parent_id: "2b9d867c-b189-4935-a7e1-8fe8986a0714", sort_order: 2 },
  { id: "37afbb40-8b04-447a-ac1e-1e4310fe71f8",  name: "Sticker Packs", slug: "sticker-packs", parent_id: "2b9d867c-b189-4935-a7e1-8fe8986a0714", sort_order: 3 },
  { id: "9fd75640-6ab8-4df7-b6fc-41bc2382de6d",  name: "Board Games",   slug: "board-games",   parent_id: "2b9d867c-b189-4935-a7e1-8fe8986a0714", sort_order: 4 },

  // ── Accessories children ──────────────────────────────────────────────────
  { id: "b9734988-5c9c-442b-9760-e47c4b8847ac",  name: "Car Flags",    slug: "car-flags",    parent_id: "0b75721b-335e-4474-a7d2-56580ef24976",   sort_order: 1 },
  { id: "e16db8b9-da6b-4515-83ae-1195d325055e",  name: "Scarves",      slug: "scarves",      parent_id: "0b75721b-335e-4474-a7d2-56580ef24976",   sort_order: 3 },
];

/**
 * Returns a map of parent category name → array of child names (or itself if no children).
 * Used by the products page to expand a parent filter to all its children.
 */
export function buildStoreCategoryChildMap(
  categories: StoreCategory[] = storeCategories
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parent_id) {
      const children = categories
        .filter((child) => child.parent_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((child) => child.name);
      // Include parent name itself so products tagged with the parent also appear
      map.set(category.name, children.length > 0 ? [category.name, ...children] : [category.name]);
    }
  }
  return map;
}
