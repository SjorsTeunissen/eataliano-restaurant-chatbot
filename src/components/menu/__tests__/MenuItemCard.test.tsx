import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MenuItemCard } from "../MenuItemCard";

describe("MenuItemCard", () => {
  it("renders item name", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={null}
        dietaryLabels={null}
      />
    );
    expect(screen.getByText("Margherita")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description="Tomaat, mozzarella, basilicum"
        price={12.5}
        allergens={null}
        dietaryLabels={null}
      />
    );
    expect(
      screen.getByText("Tomaat, mozzarella, basilicum")
    ).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    const { container } = render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={null}
        dietaryLabels={null}
      />
    );
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(0);
  });

  it("formats price correctly in euros", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={null}
        dietaryLabels={null}
      />
    );
    // Dutch locale formats as "€ 12,50"
    expect(screen.getByText(/€\s*12,50/)).toBeInTheDocument();
  });

  it("renders allergen badges when allergens provided", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={["gluten", "dairy"]}
        dietaryLabels={null}
      />
    );
    expect(screen.getByText("gluten")).toBeInTheDocument();
    expect(screen.getByText("dairy")).toBeInTheDocument();
  });

  it("renders dietary label badges when dietary_labels provided", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={null}
        dietaryLabels={["vegetarian", "vegan"]}
      />
    );
    expect(screen.getByText("vegetarian")).toBeInTheDocument();
    expect(screen.getByText("vegan")).toBeInTheDocument();
  });

  it("does not render badge section when both arrays are null", () => {
    const { container } = render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={null}
        dietaryLabels={null}
      />
    );
    const badges = container.querySelectorAll("span");
    // Only the price span should exist, no badge spans
    expect(badges).toHaveLength(1);
  });

  it("does not render badge section when both arrays are empty", () => {
    const { container } = render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={[]}
        dietaryLabels={[]}
      />
    );
    const badges = container.querySelectorAll("span");
    expect(badges).toHaveLength(1);
  });

  it("renders both allergen and dietary badges together", () => {
    render(
      <MenuItemCard
        name="Margherita"
        description={null}
        price={12.5}
        allergens={["gluten"]}
        dietaryLabels={["vegetarian"]}
      />
    );
    expect(screen.getByText("gluten")).toBeInTheDocument();
    expect(screen.getByText("vegetarian")).toBeInTheDocument();
  });
});
