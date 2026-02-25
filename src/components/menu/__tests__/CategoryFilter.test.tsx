import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CategoryFilter } from "../CategoryFilter";

const mockCategories = [
  { id: "cat-1", name: "Pizza's" },
  { id: "cat-2", name: "Pasta" },
  { id: "cat-3", name: "Grill" },
];

describe("CategoryFilter", () => {
  it('renders "Alles" tab plus all category names', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory={null}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("Alles")).toBeInTheDocument();
    expect(screen.getByText("Pizza's")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText("Grill")).toBeInTheDocument();
  });

  it('calls onSelect(null) when "Alles" is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory="cat-1"
        onSelect={onSelect}
      />
    );
    await user.click(screen.getByText("Alles"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect(categoryId) when a category tab is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory={null}
        onSelect={onSelect}
      />
    );
    await user.click(screen.getByText("Pasta"));
    expect(onSelect).toHaveBeenCalledWith("cat-2");
  });

  it('highlights "Alles" when activeCategory is null', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory={null}
        onSelect={() => {}}
      />
    );
    const allesButton = screen.getByText("Alles").closest("button")!;
    expect(allesButton.className).toContain("bg-fiamma");
  });

  it("highlights the active category tab", () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory="cat-2"
        onSelect={() => {}}
      />
    );
    const pastaButton = screen.getByText("Pasta").closest("button")!;
    expect(pastaButton.className).toContain("bg-fiamma");

    const allesButton = screen.getByText("Alles").closest("button")!;
    expect(allesButton.className).not.toContain("bg-fiamma");
  });

  it("sets aria-pressed on active tab", () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        activeCategory="cat-1"
        onSelect={() => {}}
      />
    );
    const pizzaButton = screen.getByText("Pizza's").closest("button")!;
    expect(pizzaButton).toHaveAttribute("aria-pressed", "true");

    const allesButton = screen.getByText("Alles").closest("button")!;
    expect(allesButton).toHaveAttribute("aria-pressed", "false");
  });
});
