"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Badge, Modal, Input } from "@/components/ui";
import { MenuItemForm, CategoryForm } from "@/components/admin";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  category: Category | null;
  allergens: string[] | null;
  dietary_labels: string[] | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
}

type Tab = "items" | "categories";

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Modal state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [itemsRes, categoriesRes] = await Promise.all([
      supabase
        .from("menu_items")
        .select("*, category:menu_categories(*)")
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    setItems(itemsRes.data ?? []);
    const cats = categoriesRes.data ?? [];
    setCategories(cats);
    setExpandedCategories(new Set(cats.map((c: Category) => c.id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleAvailability(item: MenuItem) {
    const newAvailability = !item.is_available;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: newAvailability } : i
      )
    );

    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: newAvailability }),
      });

      if (!res.ok) {
        // Revert on error
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, is_available: !newAvailability }
              : i
          )
        );
      }
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !newAvailability } : i
        )
      );
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // silently fail
    }
    setDeleteConfirmId(null);
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Group items by category
  const groupedItems = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = filteredItems.filter((item) => item.category_id === cat.id);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  // Items without a matching category
  const uncategorized = filteredItems.filter(
    (item) => !categories.find((c) => c.id === item.category_id)
  );

  const formatEur = (amount: number) =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  if (loading) {
    return (
      <div data-testid="menu-loading" className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-white/60 rounded-base" />
        <div className="h-12 w-full bg-white/60 rounded-base" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/60 rounded-base" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-headline text-2xl text-oven mb-6">Menubeheer</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-oven/10">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 text-sm font-body font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "items"
              ? "border-fiamma text-fiamma"
              : "border-transparent text-oven/60 hover:text-oven"
          }`}
        >
          Items
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-sm font-body font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "categories"
              ? "border-fiamma text-fiamma"
              : "border-transparent text-oven/60 hover:text-oven"
          }`}
        >
          Categorieen
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === "items" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-oven/40"
              />
              <Input
                placeholder="Zoek items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setEditingItem(null);
                setItemModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Nieuw Item
            </Button>
          </div>

          {/* Items grouped by category */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const catItems = groupedItems[cat.id] ?? [];
              if (catItems.length === 0 && searchQuery) return null;

              const isExpanded = expandedCategories.has(cat.id);

              return (
                <div key={cat.id}>
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 text-sm font-body font-semibold text-oven/80 mb-2 hover:text-oven"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    {cat.name}
                    <Badge>{catItems.length}</Badge>
                  </button>
                  {isExpanded && (
                    <div className="space-y-2 ml-6">
                      {catItems.map((item) => (
                        <Card
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-headline text-sm text-oven truncate">
                                {item.name}
                              </span>
                              <span className="text-sm text-oven/60 font-body">
                                {formatEur(item.price)}
                              </span>
                              {!item.is_available && (
                                <Badge variant="warning">Niet beschikbaar</Badge>
                              )}
                              {item.is_featured && (
                                <Badge variant="success">Uitgelicht</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.is_available}
                                onChange={() => handleToggleAvailability(item)}
                                className="sr-only peer"
                                aria-label={`${item.name} beschikbaar`}
                              />
                              <div className="w-9 h-5 bg-oven/20 peer-focus:ring-2 peer-focus:ring-fiamma/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fiamma" />
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setItemModalOpen(true);
                              }}
                              aria-label={`Bewerk ${item.name}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(item.id)}
                              aria-label={`Verwijder ${item.name}`}
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {catItems.length === 0 && (
                        <p className="text-sm text-oven/40 font-body py-2">
                          Geen items in deze categorie
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {uncategorized.length > 0 && (
              <div>
                <p className="text-sm font-body font-semibold text-oven/80 mb-2">
                  Zonder categorie
                </p>
                <div className="space-y-2 ml-6">
                  {uncategorized.map((item) => (
                    <Card
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline text-sm text-oven truncate">
                            {item.name}
                          </span>
                          <span className="text-sm text-oven/60 font-body">
                            {formatEur(item.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setItemModalOpen(true);
                          }}
                          aria-label={`Bewerk ${item.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Nieuwe Categorie
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="flex items-center justify-between gap-4 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm text-oven">
                      {cat.name}
                    </span>
                    <Badge variant={cat.is_active ? "success" : "warning"}>
                      {cat.is_active ? "Actief" : "Inactief"}
                    </Badge>
                    <span className="text-xs text-oven/40 font-body">
                      #{cat.sort_order}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-oven/60 font-body mt-0.5 truncate">
                      {cat.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryModalOpen(true);
                  }}
                  aria-label={`Bewerk ${cat.name}`}
                >
                  <Pencil size={14} />
                </Button>
              </Card>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-oven/40 font-body text-center py-8">
                Geen categorieen gevonden
              </p>
            )}
          </div>
        </div>
      )}

      {/* Item form modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? "Item Bewerken" : "Nieuw Item"}
      >
        <MenuItemForm
          item={editingItem}
          categories={categories}
          onSave={() => {
            setItemModalOpen(false);
            fetchData();
          }}
          onCancel={() => setItemModalOpen(false)}
        />
      </Modal>

      {/* Category form modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? "Categorie Bewerken" : "Nieuwe Categorie"}
      >
        <CategoryForm
          category={editingCategory}
          onSave={() => {
            setCategoryModalOpen(false);
            fetchData();
          }}
          onCancel={() => setCategoryModalOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Item Verwijderen"
      >
        <p className="text-sm font-body text-oven mb-4">
          Weet je zeker dat je dit item wilt verwijderen? Het item wordt
          gemarkeerd als niet beschikbaar.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Annuleren
          </Button>
          <Button
            onClick={() => deleteConfirmId && handleDeleteItem(deleteConfirmId)}
            className="bg-red-500 hover:bg-red-600"
          >
            Verwijderen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
