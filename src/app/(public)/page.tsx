import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  HeroSection,
  FeaturedDishes,
  LocationCards,
  WhyEataliano,
} from "@/components/home";

export const metadata: Metadata = {
  title: "Eataliano — Italiaans Restaurant in Arnhem & Huissen",
  description:
    "Authentieke Italiaanse pizza, pasta en meer. Bestel online of reserveer een tafel bij Eataliano in Arnhem of Huissen.",
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredItems } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category:menu_categories(name)")
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, phone, opening_hours")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <>
      <HeroSection />
      <FeaturedDishes items={featuredItems ?? []} />
      <LocationCards locations={locations ?? []} />
      <WhyEataliano />
    </>
  );
}
