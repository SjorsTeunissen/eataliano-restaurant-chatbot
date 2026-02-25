import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MenuItemForm } from "../MenuItemForm";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const categories = [
  { id: "cat-1", name: "Pizza" },
  { id: "cat-2", name: "Pasta" },
];

describe("MenuItemForm", () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(
      <MenuItemForm
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText("Naam")).toBeInTheDocument();
    expect(screen.getByLabelText("Beschrijving")).toBeInTheDocument();
    expect(screen.getByLabelText("Prijs")).toBeInTheDocument();
    expect(screen.getByLabelText("Categorie")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Allergenen (komma-gescheiden)")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Dieetlabels (komma-gescheiden)")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Afbeelding URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Beschikbaar")).toBeInTheDocument();
    expect(screen.getByLabelText("Uitgelicht")).toBeInTheDocument();
    expect(screen.getByLabelText("Sorteervolgorde")).toBeInTheDocument();
  });

  it("shows empty fields in create mode", () => {
    render(
      <MenuItemForm
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText("Naam")).toHaveValue("");
    expect(screen.getByLabelText("Prijs")).toHaveValue(null);
    expect(screen.getByLabelText("Categorie")).toHaveValue("");
  });

  it("pre-fills fields in edit mode", () => {
    const item = {
      id: "item-1",
      name: "Margherita",
      description: "Classic pizza",
      price: 12.5,
      category_id: "cat-1",
      allergens: ["gluten", "lactose"],
      dietary_labels: ["vegetarisch"],
      image_url: "https://example.com/img.jpg",
      is_available: true,
      is_featured: true,
      sort_order: 1,
    };

    render(
      <MenuItemForm
        item={item}
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText("Naam")).toHaveValue("Margherita");
    expect(screen.getByLabelText("Prijs")).toHaveValue(12.5);
    expect(screen.getByLabelText("Categorie")).toHaveValue("cat-1");
    expect(
      screen.getByLabelText("Allergenen (komma-gescheiden)")
    ).toHaveValue("gluten, lactose");
    expect(screen.getByLabelText("Beschikbaar")).toBeChecked();
    expect(screen.getByLabelText("Uitgelicht")).toBeChecked();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <MenuItemForm
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    expect(screen.getByText("Naam is verplicht")).toBeInTheDocument();
    expect(
      screen.getByText("Prijs moet groter dan 0 zijn")
    ).toBeInTheDocument();
    expect(screen.getByText("Categorie is verplicht")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    render(
      <MenuItemForm
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows loading state on submit", async () => {
    const user = userEvent.setup();
    // Never resolve to keep loading
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(
      <MenuItemForm
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    await user.type(screen.getByLabelText("Naam"), "Test");
    await user.type(screen.getByLabelText("Prijs"), "10");
    await user.selectOptions(screen.getByLabelText("Categorie"), "cat-1");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    // The submit button should be disabled while loading
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((b) => b.textContent?.includes("Toevoegen"));
    expect(submitButton).toBeDisabled();
  });

  it("shows Opslaan button in edit mode", () => {
    const item = {
      id: "item-1",
      name: "Margherita",
      description: null,
      price: 10,
      category_id: "cat-1",
      allergens: null,
      dietary_labels: null,
      image_url: null,
      is_available: true,
      is_featured: false,
      sort_order: 0,
    };

    render(
      <MenuItemForm
        item={item}
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByRole("button", { name: "Opslaan" })
    ).toBeInTheDocument();
  });
});
