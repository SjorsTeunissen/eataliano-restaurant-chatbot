import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Header, NAV_LINKS } from "../Header";

const mockPathname = vi.fn().mockReturnValue("/");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("Header", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("renders the logo linking to home", () => {
    render(<Header />);
    const logo = screen.getByRole("link", { name: "Eataliano" });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("href", "/");
  });

  it("renders all desktop nav links", () => {
    render(<Header />);
    for (const { label, href } of NAV_LINKS) {
      const links = screen.getAllByRole("link", { name: label });
      const desktopLink = links.find((l) => l.getAttribute("href") === href);
      expect(desktopLink).toBeDefined();
    }
  });

  it("renders hamburger button visible on mobile", () => {
    render(<Header />);
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toBeInTheDocument();
  });

  it("applies active style to the current route link", () => {
    mockPathname.mockReturnValue("/menu");
    render(<Header />);
    const menuLinks = screen.getAllByRole("link", { name: "Menu" });
    const hasActive = menuLinks.some((link) =>
      link.className.includes("text-fiamma")
    );
    expect(hasActive).toBe(true);
  });

  it("applies default style to non-active links", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    const menuLinks = screen.getAllByRole("link", { name: "Menu" });
    const hasDefault = menuLinks.some((link) =>
      link.className.includes("text-crema")
    );
    expect(hasDefault).toBe(true);
  });

  it("opens mobile nav when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const button = screen.getByRole("button", { name: "Open menu" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Sluit menu" })).toBeInTheDocument();
  });

  it("has sticky positioning", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");
  });

  it("uses oven background color", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("bg-oven");
  });

  it("applies active style to Home link on root path", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    const hasActive = homeLinks.some((link) =>
      link.className.includes("text-fiamma")
    );
    expect(hasActive).toBe(true);
  });

  it("does not mark Home as active on nested paths", () => {
    mockPathname.mockReturnValue("/menu");
    render(<Header />);
    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    const allDefault = homeLinks.every(
      (link) =>
        link.className.includes("text-crema") ||
        !link.className.includes("text-fiamma")
    );
    expect(allDefault).toBe(true);
  });

  it("exports NAV_LINKS with correct entries", () => {
    expect(NAV_LINKS).toHaveLength(5);
    expect(NAV_LINKS.map((l) => l.href)).toEqual([
      "/",
      "/menu",
      "/about",
      "/contact",
      "/gallery",
    ]);
  });
});
