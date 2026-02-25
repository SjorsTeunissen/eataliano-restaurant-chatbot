import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MenuManagementPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/menu",
}));

function createChain(data: unknown[] | null) {
  const result = { data, error: null };
  const chain: Record<string, unknown> = {};
  const returnChain = () => chain;
  chain.select = vi.fn(returnChain);
  chain.eq = vi.fn(returnChain);
  chain.order = vi.fn(returnChain);
  chain.then = (
    onFulfilled?: (val: typeof result) => unknown,
    onRejected?: (err: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected?: (err: unknown) => unknown) =>
    Promise.resolve(result).catch(onRejected);
  return chain;
}

const mockCategories = [
  {
    id: "cat-1",
    name: "Pizza",
    description: "Italian pizzas",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "cat-2",
    name: "Pasta",
    description: null,
    sort_order: 2,
    is_active: true,
  },
];

const mockItems = [
  {
    id: "item-1",
    name: "Margherita",
    description: "Classic",
    price: 12.5,
    category_id: "cat-1",
    category: mockCategories[0],
    allergens: ["gluten"],
    dietary_labels: [],
    image_url: null,
    is_available: true,
    is_featured: false,
    sort_order: 1,
  },
  {
    id: "item-2",
    name: "Penne Arrabiata",
    description: "Spicy",
    price: 14.0,
    category_id: "cat-2",
    category: mockCategories[1],
    allergens: ["gluten"],
    dietary_labels: ["vegan"],
    image_url: null,
    is_available: false,
    is_featured: false,
    sort_order: 2,
  },
];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "menu_items") return createChain(mockItems);
      if (table === "menu_categories") return createChain(mockCategories);
      return createChain([]);
    },
  }),
}));

describe("MenuManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders menu management heading", async () => {
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Menubeheer")).toBeInTheDocument();
    });
  });

  it("shows items tab by default", async () => {
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Nieuw Item/ })
      ).toBeInTheDocument();
    });
  });

  it("renders menu items after loading", async () => {
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Margherita")).toBeInTheDocument();
    });

    expect(screen.getByText("Penne Arrabiata")).toBeInTheDocument();
  });

  it("switches to categories tab", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Menubeheer")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Categorieen" }));

    expect(
      screen.getByRole("button", { name: /Nieuwe Categorie/ })
    ).toBeInTheDocument();
  });

  it('renders "Nieuw Item" button', async () => {
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Nieuw Item/ })
      ).toBeInTheDocument();
    });
  });

  it("opens item form modal when Nieuw Item clicked", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Nieuw Item/ })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Nieuw Item/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Nieuw Item" })
      ).toBeInTheDocument();
    });
  });

  it("shows category names as group headers", async () => {
    render(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Margherita")).toBeInTheDocument();
    });

    // Category headers in items view
    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
  });
});
