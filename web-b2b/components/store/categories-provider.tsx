"use client";

import { createContext, useContext } from "react";
import type { Category } from "@/lib/category-utils";

const CategoriesContext = createContext<Category[]>([]);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): Category[] {
  return useContext(CategoriesContext);
}
