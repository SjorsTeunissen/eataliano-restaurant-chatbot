import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies default styling", () => {
    render(<Card>Styled</Card>);
    const card = screen.getByText("Styled").closest("div")!;
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("shadow-warm-sm");
    expect(card.className).toContain("rounded-base");
    expect(card.className).toContain("border-oven/8");
  });

  it("merges custom className", () => {
    render(<Card className="p-8">Custom</Card>);
    const card = screen.getByText("Custom").closest("div")!;
    expect(card.className).toContain("p-8");
  });

  it("passes through HTML attributes", () => {
    render(<Card data-testid="test-card">Content</Card>);
    expect(screen.getByTestId("test-card")).toBeInTheDocument();
  });

  it("renders complex children", () => {
    render(
      <Card>
        <h3>Title</h3>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
