import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MobileNav } from "../MobileNav";

const mockPathname = vi.fn().mockReturnValue("/");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

// Need to mock Header's NAV_LINKS export since MobileNav imports it
vi.mock("../Header", () => ({
  NAV_LINKS: [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/about", label: "Over Ons" },
    { href: "/contact", label: "Contact" },
    { href: "/gallery", label: "Galerij" },
  ],
}));

describe("MobileNav", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    onClose.mockClear();
    document.body.style.overflow = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <MobileNav isOpen={false} onClose={onClose} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nav links when open", () => {
    render(<MobileNav isOpen={true} onClose={onClose} />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Over Ons" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Galerij" })).toBeInTheDocument();
  });

  it("renders close button when open", () => {
    render(<MobileNav isOpen={true} onClose={onClose} />);
    expect(
      screen.getByRole("button", { name: "Sluit menu" })
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileNav isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Sluit menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MobileNav isOpen={true} onClose={onClose} />
    );
    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when a nav link is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileNav isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole("link", { name: "Menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies active style to current route link", () => {
    mockPathname.mockReturnValue("/menu");
    render(<MobileNav isOpen={true} onClose={onClose} />);
    const menuLink = screen.getByRole("link", { name: "Menu" });
    expect(menuLink.className).toContain("text-fiamma");
  });

  it("locks body scroll when open", () => {
    render(<MobileNav isOpen={true} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when closed", () => {
    const { rerender } = render(
      <MobileNav isOpen={true} onClose={onClose} />
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<MobileNav isOpen={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("renders Eataliano brand text", () => {
    render(<MobileNav isOpen={true} onClose={onClose} />);
    expect(screen.getByText("Eataliano")).toBeInTheDocument();
  });
});
