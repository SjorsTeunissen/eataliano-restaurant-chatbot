import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryForm } from "../CategoryForm";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("CategoryForm", () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    render(<CategoryForm onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByLabelText("Naam")).toBeInTheDocument();
    expect(screen.getByLabelText("Beschrijving")).toBeInTheDocument();
    expect(screen.getByLabelText("Sorteervolgorde")).toBeInTheDocument();
    expect(screen.getByLabelText("Actief")).toBeInTheDocument();
  });

  it("pre-fills fields in edit mode", () => {
    const category = {
      id: "cat-1",
      name: "Pasta",
      description: "Italian pasta dishes",
      sort_order: 2,
      is_active: false,
    };

    render(
      <CategoryForm
        category={category}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText("Naam")).toHaveValue("Pasta");
    expect(screen.getByLabelText("Beschrijving")).toHaveValue(
      "Italian pasta dishes"
    );
    expect(screen.getByLabelText("Sorteervolgorde")).toHaveValue(2);
    expect(screen.getByLabelText("Actief")).not.toBeChecked();
  });

  it("validates name required", async () => {
    const user = userEvent.setup();
    render(<CategoryForm onSave={onSave} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    expect(screen.getByText("Naam is verplicht")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    render(<CategoryForm onSave={onSave} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows Opslaan button in edit mode", () => {
    const category = {
      id: "cat-1",
      name: "Pasta",
      description: null,
      sort_order: 0,
      is_active: true,
    };

    render(
      <CategoryForm
        category={category}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByRole("button", { name: "Opslaan" })
    ).toBeInTheDocument();
  });

  it("submits form successfully for new category", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "new-cat" } }),
    });

    render(<CategoryForm onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByLabelText("Naam"), "Desserts");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/menu/categories",
      expect.objectContaining({ method: "POST" })
    );
    expect(onSave).toHaveBeenCalled();
  });
});
