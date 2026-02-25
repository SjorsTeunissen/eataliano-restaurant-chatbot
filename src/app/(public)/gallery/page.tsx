import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Galerij — Eataliano",
  description:
    "Bekijk foto's van onze gerechten, restaurants en sfeer bij Eataliano.",
};

interface GalleryImage {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_active: boolean;
}

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <section className="bg-oven py-16 text-crema">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h1 className="font-headline text-4xl font-bold uppercase tracking-wide md:text-5xl">
            Galerij
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-crema/80">
            Een kijkje in onze keuken en restaurants
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {!images || images.length === 0 ? (
            <div className="py-16 text-center text-oven/50">
              <ImageIcon className="mx-auto h-12 w-12" />
              <p className="mt-4 text-lg">
                Er zijn nog geen foto&apos;s beschikbaar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(images as GalleryImage[]).map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-base shadow-warm-sm transition-shadow hover:shadow-warm-md"
                >
                  <Image
                    src={image.url}
                    alt={image.alt_text || "Eataliano galerij afbeelding"}
                    width={600}
                    height={400}
                    className="aspect-[3/2] object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
