"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface MenuItemCardProps {
  name: string;
  description: string | null;
  price: number;
  allergens: string[] | null;
  dietaryLabels: string[] | null;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);

export function MenuItemCard({
  name,
  description,
  price,
  allergens,
  dietaryLabels,
}: MenuItemCardProps) {
  const hasAllergens = allergens && allergens.length > 0;
  const hasDietaryLabels = dietaryLabels && dietaryLabels.length > 0;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline font-semibold text-lg text-oven">
          {name}
        </h3>
        <span className="text-fiamma font-semibold whitespace-nowrap">
          {formatPrice(price)}
        </span>
      </div>

      {description && (
        <p className="font-body text-sm text-oven/70">{description}</p>
      )}

      {(hasDietaryLabels || hasAllergens) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {hasDietaryLabels &&
            dietaryLabels.map((label) => (
              <Badge key={label} variant="success">
                {label}
              </Badge>
            ))}
          {hasAllergens &&
            allergens.map((allergen) => (
              <Badge key={allergen} variant="warning">
                {allergen}
              </Badge>
            ))}
        </div>
      )}
    </Card>
  );
}
