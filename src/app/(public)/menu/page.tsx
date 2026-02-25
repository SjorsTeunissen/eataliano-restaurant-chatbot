import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MenuPageClient } from "./MenuPageClient";

export const metadata: Metadata = {
  title: "Menu — Eataliano",
  description: "Bekijk ons volledige menu met pizza, pasta, grill en meer.",
};

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

export default async function MenuPage() {
  const supabase = await createClient();

  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select("*, category:menu_categories(*)")
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const categories: Category[] = categoriesResult.data ?? [];
  const items: MenuItem[] = itemsResult.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-space-7">
      <h1 className="font-headline text-4xl font-bold text-oven mb-space-5">
        Ons Menu
      </h1>
      <MenuPageClient categories={categories} items={items} />
    </div>
  );
}
