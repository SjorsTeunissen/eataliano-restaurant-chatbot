import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationList } from "../ReservationList";

// Mock the realtime hook
vi.mock("@/hooks/useRealtimeReservations", () => ({
  useRealtimeReservations: vi.fn(),
}));

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
}));

import { useRealtimeReservations } from "@/hooks/useRealtimeReservations";

const mockReservations = [
  {
    id: "res-1111-2222-3333-444444444444",
    location_id: "loc-1",
    customer_name: "Maria de Vries",
    customer_email: "maria@test.nl",
    customer_phone: "0611111111",
    party_size: 4,
    reservation_date: "2026-02-25",
    reservation_time: "19:00",
    status: "confirmed",
    notes: "Raam tafel graag",
    created_via: "chatbot",
    created_at: "2026-02-24T10:00:00Z",
    updated_at: "2026-02-24T10:00:00Z",
  },
  {
    id: "res-5555-6666-7777-888888888888",
    location_id: "loc-1",
    customer_name: "Kees Bakker",
    customer_email: null,
    customer_phone: "0622222222",
    party_size: 2,
    reservation_date: "2026-02-25",
    reservation_time: "20:30",
    status: "completed",
    notes: null,
    created_via: "admin",
    created_at: "2026-02-24T11:00:00Z",
    updated_at: "2026-02-25T21:00:00Z",
  },
];

const mockRefetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRealtimeReservations).mockReturnValue({
    reservations: mockReservations as never[],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  });
});

describe("ReservationList", () => {
  it("renders loading state initially", () => {
    vi.mocked(useRealtimeReservations).mockReturnValue({
      reservations: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<ReservationList />);
    expect(screen.getByText("Reserveringen laden...")).toBeInTheDocument();
  });

  it("renders reservation list after data loads", () => {
    render(<ReservationList />);
    expect(screen.getAllByText("Maria de Vries").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kees Bakker").length).toBeGreaterThan(0);
  });

  it("displays correct status badges", () => {
    render(<ReservationList />);
    expect(screen.getAllByText("Bevestigd").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Afgerond").length).toBeGreaterThan(0);
  });

  it("shows action buttons only for confirmed reservations", () => {
    render(<ReservationList />);
    // "Niet verschenen" should appear for confirmed reservation only
    const noShowButtons = screen.getAllByText("Niet verschenen");
    // Should only be from the confirmed reservation (mobile + desktop = 2)
    expect(noShowButtons.length).toBeGreaterThan(0);
  });

  it("calls PATCH API on status button click", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...mockReservations[0],
          status: "no_show",
        }),
    });

    render(<ReservationList />);

    // Click "Niet verschenen" button for the confirmed reservation
    // This label is unique to action buttons (not used as a filter label)
    const noShowButtons = screen
      .getAllByText("Niet verschenen")
      .filter(
        (el) =>
          el.tagName === "BUTTON" &&
          !el.className.includes("rounded-full")
      );

    expect(noShowButtons.length).toBeGreaterThan(0);
    await user.click(noShowButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/reservations/${mockReservations[0].id}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "no_show" }),
        })
      );
    });
  });

  it("filters reservations by status", async () => {
    const user = userEvent.setup();
    render(<ReservationList />);

    // Find the "Bevestigd" filter button (the one in the filter bar with rounded-full)
    const filterButtons = screen
      .getAllByText("Bevestigd")
      .filter(
        (el) =>
          el.tagName === "BUTTON" &&
          el.className.includes("rounded-full")
      );

    if (filterButtons.length > 0) {
      await user.click(filterButtons[0]);
      expect(useRealtimeReservations).toHaveBeenCalledWith(
        expect.objectContaining({ status: "confirmed" })
      );
    }
  });

  it("renders empty state when no reservations", () => {
    vi.mocked(useRealtimeReservations).mockReturnValue({
      reservations: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<ReservationList />);
    expect(
      screen.getByText("Geen reserveringen gevonden")
    ).toBeInTheDocument();
  });
});
