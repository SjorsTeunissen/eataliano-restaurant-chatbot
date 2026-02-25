import Link from "next/link";
import { Card, Badge } from "@/components/ui";

export interface FeaturedDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string }[] | null;
}

function formatPrice(price: number): string {
  return `EUR ${price.toFixed(2).replace(".", ",")}`;
}

export function FeaturedDishes({ items }: { items: FeaturedDish[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="font-headline text-3xl text-oven md:text-4xl">
          Onze Favorieten
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between">
              <div>
                <h3 className="font-headline text-xl text-oven">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="mt-2 line-clamp-2 font-body text-sm text-oven/70">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-headline text-lg text-fiamma">
                  {formatPrice(item.price)}
                </span>
                {item.category?.[0] && (
                  <Badge>{item.category[0].name}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/menu"
            className="font-body text-fiamma underline underline-offset-4 hover:text-fiamma/80"
          >
            Bekijk het volledige menu
          </Link>
        </div>
      </div>
    </section>
  );
}
