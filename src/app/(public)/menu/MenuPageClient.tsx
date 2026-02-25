"use client";

import { useState, useMemo } from "react";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { MenuSection } from "@/components/menu/MenuSection";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[] | null;
  dietary_labels: string[] | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category: Category;
}

interface MenuPageClientProps {
  categories: Category[];
  items: MenuItem[];
}

export function MenuPageClient({ categories, items }: MenuPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredItems = useMemo(
    () =>
      activeCategory
        ? items.filter((item) => item.category_id === activeCategory)
        : items,
    [items, activeCategory]
  );

  const groupedByCategory = useMemo(() => {
    const groups: Map<
      string,
      { category: Category; items: MenuItem[] }
    > = new Map();

    for (const item of filteredItems) {
      const existing = groups.get(item.category_id);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.category_id, {
          category: item.category,
          items: [item],
        });
      }
    }

    // Sort groups by category sort_order
    return Array.from(groups.values()).sort(
      (a, b) => a.category.sort_order - b.category.sort_order
    );
  }, [filteredItems]);

  if (items.length === 0) {
    return (
      <p className="font-body text-oven/70 text-center py-space-7">
        Het menu wordt binnenkort bijgewerkt.
      </p>
    );
  }

  return (
    <>
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />
      <div className="flex flex-col gap-space-7 mt-space-6">
        {groupedByCategory.map(({ category, items: sectionItems }) => (
          <MenuSection
            key={category.id}
            categoryName={category.name}
            categoryDescription={category.description}
            items={sectionItems}
          />
        ))}
      </div>
    </>
  );
}
