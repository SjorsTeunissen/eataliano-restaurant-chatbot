import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock: Supabase admin client
// ---------------------------------------------------------------------------
let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

function createChain() {
  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop === "then") {
        return (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown
        ) => Promise.resolve(queryResult).then(onFulfilled, onRejected);
      }
      return () => {
        if (prop === "single") {
          return Promise.resolve(queryResult);
        }
        return chain;
      };
    },
  };
  const chain: object = new Proxy({}, handler);
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => createChain(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock: fetch for reservation/order API calls
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { executeFunctionCall } from "../chat-functions";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  queryResult = { data: null, error: null };
});

describe("executeFunctionCall", () => {
  describe("lookup_menu", () => {
    it("returns menu items from Supabase", async () => {
      queryResult = {
        data: [
          {
            id: "item-1",
            name: "Margherita",
            description: "Tomaat, mozzarella, basilicum",
            price: 12.5,
            dietary_labels: ["vegetarisch"],
            allergens: ["gluten", "lactose"],
            category: { name: "Pizza" },
          },
        ],
        error: null,
      };

      const result = JSON.parse(
        await executeFunctionCall("lookup_menu", { search_term: "margherita" })
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Margherita");
      expect(result.items[0].category).toBe("Pizza");
    });

    it("returns message when no items found", async () => {
      queryResult = { data: [], error: null };

      const result = JSON.parse(
        await executeFunctionCall("lookup_menu", { search_term: "sushi" })
      );

      expect(result.message).toContain("Geen menu-items");
    });

    it("filters by dietary labels", async () => {
      queryResult = {
        data: [
          {
            id: "1",
            name: "Bruschetta",
            description: "",
            price: 8,
            dietary_labels: ["vegan"],
            allergens: [],
            category: { name: "Antipasti" },
          },
          {
            id: "2",
            name: "Pasta Carbonara",
            description: "",
            price: 14,
            dietary_labels: null,
            allergens: ["gluten"],
            category: { name: "Pasta" },
          },
        ],
        error: null,
      };

      const result = JSON.parse(
        await executeFunctionCall("lookup_menu", { dietary_filter: "vegan" })
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Bruschetta");
    });

    it("returns error when Supabase query fails", async () => {
      queryResult = { data: null, error: { message: "DB error" } };

      const result = JSON.parse(
        await executeFunctionCall("lookup_menu", {})
      );

      expect(result.error).toContain("Kon menu niet ophalen");
    });
  });

  describe("create_reservation", () => {
    it("calls the reservations API and returns success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "res-1",
            message: "Reservation confirmed for 4 guests",
          }),
      });

      const result = JSON.parse(
        await executeFunctionCall("create_reservation", {
          customer_name: "Jan",
          customer_phone: "06-12345678",
          party_size: 4,
          reservation_date: "2026-03-15",
          reservation_time: "19:00",
          location_id: "loc-1",
        })
      );

      expect(result.success).toBe(true);
      expect(result.reservation_id).toBe("res-1");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/reservations");
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.created_via).toBe("chatbot");
    });

    it("returns error when reservation API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Reservation date cannot be in the past",
          }),
      });

      const result = JSON.parse(
        await executeFunctionCall("create_reservation", {
          customer_name: "Jan",
          customer_phone: "06-12345678",
          party_size: 4,
          reservation_date: "2020-01-01",
          reservation_time: "19:00",
          location_id: "loc-1",
        })
      );

      expect(result.error).toContain("past");
    });
  });

  describe("create_order", () => {
    it("calls the orders API and returns success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "order-1",
            total: 25.0,
            order_type: "pickup",
            status: "pending",
          }),
      });

      const result = JSON.parse(
        await executeFunctionCall("create_order", {
          customer_name: "Piet",
          customer_phone: "06-98765432",
          order_type: "pickup",
          location_id: "loc-1",
          items: [{ menu_item_id: "item-1", quantity: 2 }],
        })
      );

      expect(result.success).toBe(true);
      expect(result.order_id).toBe("order-1");
      expect(result.total).toBe(25.0);
    });

    it("returns error when order API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Menu items not found: item-999",
          }),
      });

      const result = JSON.parse(
        await executeFunctionCall("create_order", {
          customer_name: "Piet",
          customer_phone: "06-98765432",
          order_type: "pickup",
          location_id: "loc-1",
          items: [{ menu_item_id: "item-999", quantity: 1 }],
        })
      );

      expect(result.error).toContain("not found");
    });
  });

  describe("get_location_info", () => {
    it("returns location information", async () => {
      queryResult = {
        data: [
          {
            id: "loc-1",
            name: "Arnhem",
            address: "Korenmarkt 1",
            city: "Arnhem",
            phone: "026-1234567",
            email: "arnhem@eataliano.nl",
            opening_hours: {
              maandag: { open: "16:00", close: "22:00" },
            },
          },
        ],
        error: null,
      };

      const result = JSON.parse(
        await executeFunctionCall("get_location_info", {
          location_name: "Arnhem",
        })
      );

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].name).toBe("Arnhem");
      expect(result.locations[0].phone).toBe("026-1234567");
    });

    it("returns all locations when location_name is 'all'", async () => {
      queryResult = {
        data: [
          { id: "loc-1", name: "Arnhem", address: "Korenmarkt 1", city: "Arnhem", phone: "026-1234567", email: "a@e.nl", opening_hours: {} },
          { id: "loc-2", name: "Huissen", address: "Markt 5", city: "Huissen", phone: "026-7654321", email: "h@e.nl", opening_hours: {} },
        ],
        error: null,
      };

      const result = JSON.parse(
        await executeFunctionCall("get_location_info", { location_name: "all" })
      );

      expect(result.locations).toHaveLength(2);
    });

    it("returns message when no locations found", async () => {
      queryResult = { data: [], error: null };

      const result = JSON.parse(
        await executeFunctionCall("get_location_info", {
          location_name: "Amsterdam",
        })
      );

      expect(result.message).toContain("Geen locaties");
    });
  });

  describe("unknown function", () => {
    it("returns error for unknown function name", async () => {
      const result = JSON.parse(
        await executeFunctionCall("unknown_function", {})
      );

      expect(result.error).toContain("Unknown function");
    });
  });
});
