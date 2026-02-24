import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders text content", () => {
    render(<Badge>Vegetarian</Badge>);
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("applies default variant styling", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-fiamma/10");
    expect(badge.className).toContain("text-fiamma");
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Available</Badge>);
    const badge = screen.getByText("Available");
    expect(badge.className).toContain("bg-basilico/10");
    expect(badge.className).toContain("text-basilico");
  });

  it("applies warning variant", () => {
    render(<Badge variant="warning">Pending</Badge>);
    const badge = screen.getByText("Pending");
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-700");
  });

  it("applies error variant", () => {
    render(<Badge variant="error">Cancelled</Badge>);
    const badge = screen.getByText("Cancelled");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-700");
  });

  it("has rounded-full for pill shape", () => {
    render(<Badge>Pill</Badge>);
    expect(screen.getByText("Pill").className).toContain("rounded-full");
  });

  it("merges custom className", () => {
    render(<Badge className="ml-2">Custom</Badge>);
    expect(screen.getByText("Custom").className).toContain("ml-2");
  });
});
