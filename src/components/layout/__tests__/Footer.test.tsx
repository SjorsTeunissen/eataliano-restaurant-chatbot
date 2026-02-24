import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders the brand name", () => {
    render(<Footer />);
    expect(screen.getByText("Eataliano")).toBeInTheDocument();
  });

  it("renders Arnhem location heading", () => {
    render(<Footer />);
    expect(screen.getByText("Arnhem")).toBeInTheDocument();
  });

  it("renders Huissen location heading", () => {
    render(<Footer />);
    expect(screen.getByText("Huissen")).toBeInTheDocument();
  });

  it("renders Arnhem address", () => {
    render(<Footer />);
    expect(
      screen.getByText("Steenstraat 56, 6828 CE Arnhem")
    ).toBeInTheDocument();
  });

  it("renders Huissen address", () => {
    render(<Footer />);
    expect(
      screen.getByText("Langestraat 78, 6851 TH Huissen")
    ).toBeInTheDocument();
  });

  it("renders Arnhem phone number", () => {
    render(<Footer />);
    expect(screen.getByText("Tel: 026-370 21 60")).toBeInTheDocument();
  });

  it("renders Huissen phone number", () => {
    render(<Footer />);
    expect(screen.getByText("Tel: 026-325 37 87")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(
        `\u00A9 ${year} Eataliano. Alle rechten voorbehouden.`
      )
    ).toBeInTheDocument();
  });

  it("renders tagline text", () => {
    render(<Footer />);
    expect(
      screen.getByText(
        "Authentieke Italiaanse keuken in het hart van Gelderland."
      )
    ).toBeInTheDocument();
  });

  it("uses oven background", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.className).toContain("bg-oven");
  });

  it("uses fiamma color for location headings", () => {
    render(<Footer />);
    const arnhem = screen.getByText("Arnhem");
    const huissen = screen.getByText("Huissen");
    expect(arnhem.className).toContain("text-fiamma");
    expect(huissen.className).toContain("text-fiamma");
  });
});
