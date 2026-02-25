import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminDashboardPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin",
}));

function createChain(data: unknown[] | null) {
  const result = { data, error: null };
  const chain: Record<string, unknown> = {};
  const returnChain = () => chain;
  chain.select = vi.fn(returnChain);
  chain.eq = vi.fn(returnChain);
  chain.gte = vi.fn(returnChain);
  chain.lte = vi.fn(returnChain);
  chain.order = vi.fn(returnChain);
  // Make it a proper thenable for Promise.all
  chain.then = (
    onFulfilled?: (val: typeof result) => unknown,
    onRejected?: (err: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected?: (err: unknown) => unknown) =>
    Promise.resolve(result).catch(onRejected);
  return chain;
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "orders")
        return createChain([{ total_amount: 50 }, { total_amount: 30 }]);
      if (table === "reservations")
        return createChain([{ id: "r1" }, { id: "r2" }, { id: "r3" }]);
      if (table === "menu_items")
        return createChain([{ id: "m1" }, { id: "m2" }]);
      if (table === "menu_categories") return createChain([{ id: "c1" }]);
      return createChain([]);
    },
  }),
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard heading", () => {
    render(<AdminDashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Beheer Menu link", () => {
    render(<AdminDashboardPage />);
    expect(
      screen.getByRole("link", { name: "Beheer Menu" })
    ).toHaveAttribute("href", "/admin/menu");
  });

  it("renders 4 stat cards after loading", async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Bestellingen Vandaag")).toBeInTheDocument();
    });

    expect(screen.getByText("Reserveringen Vandaag")).toBeInTheDocument();
    expect(screen.getByText("Menu Items")).toBeInTheDocument();
    expect(screen.getByText("Categorieen")).toBeInTheDocument();
  });

  it("shows correct stat values", async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Bestellingen Vandaag")).toBeInTheDocument();
    });

    // 2 orders and 2 menu items, 3 reservations, 1 category
    const twos = screen.getAllByText("2");
    expect(twos.length).toBe(2); // orders + menu items
    expect(screen.getByText("3")).toBeInTheDocument(); // reservations
    expect(screen.getByText("1")).toBeInTheDocument(); // categories
  });

  it("shows loading state initially", () => {
    render(<AdminDashboardPage />);
    expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();
  });
});
