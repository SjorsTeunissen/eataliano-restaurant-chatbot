"use client";

import { Button } from "@/components/ui/Button";

export interface CategoryFilterProps {
  categories: Array<{ id: string; name: string }>;
  activeCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterProps) {
  return (
    <nav
      aria-label="Categoriefilter"
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
    >
      <Button
        variant={activeCategory === null ? "primary" : "ghost"}
        size="sm"
        onClick={() => onSelect(null)}
        aria-pressed={activeCategory === null}
      >
        Alles
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? "primary" : "ghost"}
          size="sm"
          onClick={() => onSelect(category.id)}
          aria-pressed={activeCategory === category.id}
        >
          {category.name}
        </Button>
      ))}
    </nav>
  );
}
