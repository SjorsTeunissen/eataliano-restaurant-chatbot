import { MenuItemCard } from "./MenuItemCard";

export interface MenuSectionItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  allergens: string[] | null;
  dietary_labels: string[] | null;
}

export interface MenuSectionProps {
  categoryName: string;
  categoryDescription: string | null;
  items: MenuSectionItem[];
}

export function MenuSection({
  categoryName,
  categoryDescription,
  items,
}: MenuSectionProps) {
  return (
    <section>
      <h2 className="font-headline text-2xl text-oven">{categoryName}</h2>
      {categoryDescription && (
        <p className="font-body text-sm text-oven/70 mt-1">
          {categoryDescription}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-5 mt-space-4">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            allergens={item.allergens}
            dietaryLabels={item.dietary_labels}
          />
        ))}
      </div>
    </section>
  );
}
