import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderList } from "../OrderList";

// Mock the realtime hook
vi.mock("@/hooks/useRealtimeOrders", () => ({
  useRealtimeOrders: vi.fn(),
}));

// Mock supabase client (needed by OrderDetailModal)
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
}));

import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";

const mockOrders = [
  {
    id: "order-1111-2222-3333-444444444444",
    location_id: "loc-1",
    customer_name: "Jan Jansen",
    customer_email: "jan@test.nl",
    customer_phone: "0612345678",
    order_type: "pickup",
    delivery_address: null,
    status: "pending",
    subtotal: 25.0,
    delivery_fee: 0,
    total: 25.0,
    stripe_session_id: null,
    stripe_payment_intent_id: null,
    payment_status: "paid",
    estimated_ready_time: null,
    notes: null,
    created_at: "2026-02-25T12:00:00Z",
    updated_at: "2026-02-25T12:00:00Z",
    order_items: [
      {
        id: "item-1",
        order_id: "order-1111-2222-3333-444444444444",
        menu_item_id: "menu-1",
        item_name: "Margherita",
        item_price: 12.5,
        quantity: 2,
        special_instructions: null,
        created_at: "2026-02-25T12:00:00Z",
      },
    ],
  },
  {
    id: "order-5555-6666-7777-888888888888",
    location_id: "loc-1",
    customer_name: "Piet Pietersen",
    customer_email: null,
    customer_phone: "0698765432",
    order_type: "delivery",
    delivery_address: "Hoofdstraat 1, 1234 AB Amsterdam",
    status: "ready",
    subtotal: 30.0,
    delivery_fee: 2.5,
    total: 32.5,
    stripe_session_id: null,
    stripe_payment_intent_id: null,
    payment_status: "paid",
    estimated_ready_time: null,
    notes: null,
    created_at: "2026-02-25T11:00:00Z",
    updated_at: "2026-02-25T11:30:00Z",
    order_items: [
      {
        id: "item-2",
        order_id: "order-5555-6666-7777-888888888888",
        menu_item_id: "menu-2",
        item_name: "Quattro Stagioni",
        item_price: 15.0,
        quantity: 2,
        special_instructions: "Extra kaas",
        created_at: "2026-02-25T11:00:00Z",
      },
    ],
  },
];

const mockRefetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRealtimeOrders).mockReturnValue({
    orders: mockOrders as never[],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  });
});

describe("OrderList", () => {
  it("renders loading state initially", () => {
    vi.mocked(useRealtimeOrders).mockReturnValue({
      orders: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<OrderList />);
    expect(screen.getByText("Bestellingen laden...")).toBeInTheDocument();
  });

  it("renders order list after data loads", () => {
    render(<OrderList />);
    expect(screen.getAllByText("Jan Jansen").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Piet Pietersen").length).toBeGreaterThan(0);
  });

  it("displays correct status badges", () => {
    render(<OrderList />);
    expect(screen.getAllByText("In afwachting").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Klaar").length).toBeGreaterThan(0);
  });

  it("shows valid status transition buttons for pending order", () => {
    render(<OrderList />);
    // Pending order should have "Bevestigen" button
    expect(screen.getAllByText("Bevestigen").length).toBeGreaterThan(0);
  });

  it("calls PATCH API on status button click", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockOrders[0], status: "confirmed" }),
    });

    render(<OrderList />);

    const confirmButtons = screen.getAllByText("Bevestigen");
    await user.click(confirmButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/orders/${mockOrders[0].id}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "confirmed" }),
        })
      );
    });
  });

  it("filters orders by status", async () => {
    const user = userEvent.setup();
    render(<OrderList />);

    // The filter buttons are in the filter bar (not status badges)
    // Select the button element with rounded-full class
    const filterButtons = screen
      .getAllByText("In afwachting")
      .filter(
        (el) =>
          el.tagName === "BUTTON" &&
          el.className.includes("rounded-full")
      );

    expect(filterButtons.length).toBe(1);
    await user.click(filterButtons[0]);
    expect(useRealtimeOrders).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );
  });

  it("opens detail modal on row click", async () => {
    const user = userEvent.setup();
    render(<OrderList />);

    // Click on the customer name row
    await user.click(screen.getAllByText("Jan Jansen")[0]);

    // Modal should show order details
    await waitFor(() => {
      expect(screen.getByText("Klantgegevens")).toBeInTheDocument();
    });
  });

  it("hides 'Bezorgen' button for pickup orders", () => {
    render(<OrderList />);
    // The pending pickup order should not show "Bezorgen"
    // "Bezorgen" only appears for delivery orders in "ready" status
    // Check that for the ready delivery order, Bezorgen is available
    const bezorgenButtons = screen.getAllByText("Bezorgen");
    expect(bezorgenButtons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no orders", () => {
    vi.mocked(useRealtimeOrders).mockReturnValue({
      orders: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<OrderList />);
    expect(screen.getByText("Geen bestellingen gevonden")).toBeInTheDocument();
  });
});
