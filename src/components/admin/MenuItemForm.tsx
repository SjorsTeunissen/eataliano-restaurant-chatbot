"use client";

import { useState, useId, FormEvent } from "react";
import { Button, Input } from "@/components/ui";

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  allergens: string[] | null;
  dietary_labels: string[] | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface MenuItemFormProps {
  item?: MenuItem | null;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}

export function MenuItemForm({
  item,
  categories,
  onSave,
  onCancel,
}: MenuItemFormProps) {
  const descriptionId = useId();
  const categorySelectId = useId();
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [allergens, setAllergens] = useState(
    item?.allergens?.join(", ") ?? ""
  );
  const [dietaryLabels, setDietaryLabels] = useState(
    item?.dietary_labels?.join(", ") ?? ""
  );
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Naam is verplicht";
    if (!price || Number(price) <= 0) newErrors.price = "Prijs moet groter dan 0 zijn";
    if (!categoryId) newErrors.category_id = "Categorie is verplicht";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const url = item ? `/api/menu/${item.id}` : "/api/menu";
      const method = item ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        category_id: categoryId,
        allergens: allergens.trim()
          ? allergens.split(",").map((s) => s.trim())
          : [],
        dietary_labels: dietaryLabels.trim()
          ? dietaryLabels.split(",").map((s) => s.trim())
          : [],
        image_url: imageUrl.trim() || null,
        is_available: isAvailable,
        is_featured: isFeatured,
        sort_order: sortOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Er ging iets mis");
      }

      onSave();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Er ging iets mis",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Naam"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={descriptionId}
          className="text-sm font-medium font-body text-oven"
        >
          Beschrijving
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-base border border-oven/20 px-3 py-2 text-base font-body text-oven placeholder:text-oven/40 transition-colors focus:outline-none focus:ring-2 focus:border-fiamma focus:ring-fiamma/20"
        />
      </div>
      <Input
        label="Prijs"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={categorySelectId}
          className="text-sm font-medium font-body text-oven"
        >
          Categorie
        </label>
        <select
          id={categorySelectId}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-base border border-oven/20 px-3 py-2 text-base font-body text-oven transition-colors focus:outline-none focus:ring-2 focus:border-fiamma focus:ring-fiamma/20"
        >
          <option value="">Selecteer categorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-sm text-red-500" role="alert">
            {errors.category_id}
          </p>
        )}
      </div>
      <Input
        label="Allergenen (komma-gescheiden)"
        value={allergens}
        onChange={(e) => setAllergens(e.target.value)}
      />
      <Input
        label="Dieetlabels (komma-gescheiden)"
        value={dietaryLabels}
        onChange={(e) => setDietaryLabels(e.target.value)}
      />
      <Input
        label="Afbeelding URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-body text-oven">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="rounded"
          />
          Beschikbaar
        </label>
        <label className="flex items-center gap-2 text-sm font-body text-oven">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded"
          />
          Uitgelicht
        </label>
      </div>
      <Input
        label="Sorteervolgorde"
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
      />

      {errors.form && (
        <p className="text-sm text-red-500" role="alert">
          {errors.form}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {item ? "Opslaan" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}
