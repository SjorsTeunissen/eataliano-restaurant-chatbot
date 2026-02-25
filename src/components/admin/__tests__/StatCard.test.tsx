import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(
      <StatCard
        title="Bestellingen"
        value={42}
        icon={<span data-testid="icon">I</span>}
      />
    );

    expect(screen.getByText("Bestellingen")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(
      <StatCard
        title="Test"
        value={0}
        icon={<span data-testid="icon">I</span>}
      />
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <StatCard
        title="Test"
        value={10}
        subtitle="Extra info"
        icon={<span>I</span>}
      />
    );

    expect(screen.getByText("Extra info")).toBeInTheDocument();
  });

  it("handles missing subtitle gracefully", () => {
    const { container } = render(
      <StatCard title="Test" value={10} icon={<span>I</span>} />
    );

    // No subtitle element should be present
    const subtitleElements = container.querySelectorAll(".text-xs.text-oven\\/40");
    expect(subtitleElements.length).toBe(0);
  });

  it("renders string values", () => {
    render(
      <StatCard title="Revenue" value="€ 1.234,00" icon={<span>I</span>} />
    );

    expect(screen.getByText("€ 1.234,00")).toBeInTheDocument();
  });
});
