import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(
  url: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string> }
): NextRequest {
  const { method = "GET", body, headers = {} } = options || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const init: any = { method, headers };
  if (body !== undefined) {
    if (typeof body === "string") {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      (headers as Record<string, string>)["content-type"] = "application/json";
    }
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

// ---------------------------------------------------------------------------
// Chainable Supabase mock builder
// ---------------------------------------------------------------------------

interface MockResult {
  data: unknown;
  error: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createChainableMock(defaultResult: MockResult = { data: null, error: null }): any {
  let result = { ...defaultResult };

  return {
    _setResult: (r: MockResult) => { result = r; },
    _getResult: () => result,
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve(result)),
  };
}

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockAdminClient: any;
let mockAuthClient: { auth: { getUser: ReturnType<typeof vi.fn> } };

// Default test data
const LOCATION_ID = "loc-001";
const MENU_ITEM_ID = "menu-001";
const ORDER_ID = "order-001";

const validPickupBody = {
  location_id: LOCATION_ID,
  customer_name: "Jan de Vries",
  customer_email: "jan@test.nl",
  customer_phone: "+31612345678",
  order_type: "pickup",
  items: [{ menu_item_id: MENU_ITEM_ID, quantity: 2 }],
};

const validDeliveryBody = {
  ...validPickupBody,
  order_type: "delivery",
  delivery_address: "Markt 1, 6811 CG Arnhem",
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockAuthClient),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Re-import after mocks
import { POST as ordersPost, GET as ordersGet } from "@/app/api/orders/route";
import { GET as orderDetailGet, PATCH as orderPatch } from "@/app/api/orders/[id]/route";
import { POST as checkoutPost } from "@/app/api/stripe/checkout/route";
import { POST as webhookPost } from "@/app/api/stripe/webhook/route";
import { stripe } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAdminClient = createChainableMock();
  mockAuthClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }),
    },
  };
});

// ---------------------------------------------------------------------------
// Helper: set up admin client for multi-query flows
// ---------------------------------------------------------------------------

/**
 * Sets up the mock admin client for POST /api/orders which performs multiple
 * chained queries: location lookup, menu item lookup, order insert, order_items insert.
 */
function setupOrderCreationMocks(overrides?: {
  location?: unknown;
  locationError?: unknown;
  menuItems?: unknown;
  menuError?: unknown;
  order?: unknown;
  orderError?: unknown;
  orderItems?: unknown;
  orderItemsError?: unknown;
  deliveryZones?: string[];
}) {
  const location = overrides?.location ?? {
    id: LOCATION_ID,
    is_active: true,
    delivery_zones: overrides?.deliveryZones ?? ["6811", "6812", "6813"],
  };
  const menuItems = overrides?.menuItems ?? [
    { id: MENU_ITEM_ID, name: "Margherita", price: 12.5, is_available: true },
  ];
  const order = overrides?.order ?? {
    id: ORDER_ID,
    location_id: LOCATION_ID,
    customer_name: "Jan de Vries",
    order_type: "pickup",
    subtotal: 25.0,
    delivery_fee: 0,
    total: 25.0,
    status: "pending",
    payment_status: "pending",
  };

  const callTracker = { fromCallCount: 0 };

  // Track calls to `from` to return different results for different tables
  mockAdminClient.from = vi.fn().mockImplementation((table: string) => {
    callTracker.fromCallCount++;
    const tableChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            table === "locations"
              ? { data: overrides?.locationError ? null : location, error: overrides?.locationError || null }
              : { data: null, error: null }
          ),
        }),
        in: vi.fn().mockResolvedValue(
          table === "menu_items"
            ? { data: overrides?.menuError ? null : menuItems, error: overrides?.menuError || null }
            : { data: null, error: null }
        ),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(
          table === "orders"
            ? {
                single: vi.fn().mockResolvedValue({
                  data: overrides?.orderError ? null : order,
                  error: overrides?.orderError || null,
                }),
              }
            : {
                // order_items - no single()
                then: (resolve: (v: unknown) => void) =>
                  resolve({
                    data: overrides?.orderItemsError ? null : overrides?.orderItems ?? [{ id: "item-1", order_id: ORDER_ID }],
                    error: overrides?.orderItemsError || null,
                  }),
              }
        ),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    return tableChain;
  });
}

// ===========================================================================
// ORDER ENDPOINTS
// ===========================================================================

describe("POST /api/orders", () => {
  // 1. Create order (pickup)
  it("creates a pickup order with correct totals and no delivery fee", async () => {
    const orderData = {
      id: ORDER_ID,
      location_id: LOCATION_ID,
      customer_name: "Jan de Vries",
      order_type: "pickup",
      subtotal: 25.0,
      delivery_fee: 0,
      total: 25.0,
      status: "pending",
      payment_status: "pending",
    };
    setupOrderCreationMocks({ order: orderData });

    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: validPickupBody,
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.delivery_fee).toBe(0);
    expect(json.total).toBe(25.0);
    expect(json.order_type).toBe("pickup");
  });

  // 2. Create order (delivery)
  it("creates a delivery order with delivery fee of 2.50", async () => {
    const orderData = {
      id: ORDER_ID,
      location_id: LOCATION_ID,
      customer_name: "Jan de Vries",
      order_type: "delivery",
      subtotal: 25.0,
      delivery_fee: 2.5,
      total: 27.5,
      status: "pending",
      payment_status: "pending",
    };
    setupOrderCreationMocks({ order: orderData });

    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: validDeliveryBody,
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.delivery_fee).toBe(2.5);
    expect(json.total).toBe(27.5);
  });

  // 3. Invalid menu item
  it("returns 404 for non-existent menu item", async () => {
    setupOrderCreationMocks({
      menuItems: [], // No items found
    });

    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: validPickupBody,
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain("Menu items not found");
  });

  // 4. Unavailable menu item
  it("returns 400 for unavailable menu item", async () => {
    setupOrderCreationMocks({
      menuItems: [
        { id: MENU_ITEM_ID, name: "Margherita", price: 12.5, is_available: false },
      ],
    });

    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: validPickupBody,
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("not available");
  });

  // 5. Missing required fields
  it("returns 400 when customer_name is missing", async () => {
    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: { ...validPickupBody, customer_name: undefined },
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  // 6. Invalid order_type
  it("returns 400 for invalid order_type", async () => {
    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: { ...validPickupBody, order_type: "dine_in" },
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("order_type must be");
  });

  // 7. Delivery without address
  it("returns 400 for delivery order without address", async () => {
    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: { ...validPickupBody, order_type: "delivery" },
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("delivery_address is required");
  });

  // 8. Delivery zone violation
  it("returns 422 for delivery address outside zone", async () => {
    setupOrderCreationMocks({
      deliveryZones: ["6811", "6812"],
    });

    const req = createMockRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: {
        ...validDeliveryBody,
        delivery_address: "Straat 1, 1234 AB Amsterdam",
      },
    });

    const res = await ordersPost(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.error).toContain("outside the delivery zone");
    expect(json.error).toContain("1234");
  });
});

describe("GET /api/orders", () => {
  // 9. Admin GET orders
  it("returns orders list for authenticated admin", async () => {
    const orders = [
      { id: ORDER_ID, status: "pending", order_items: [] },
    ];
    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: orders, error: null }),
              }),
            }),
          }),
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: orders, error: null }),
          }),
          lte: vi.fn().mockResolvedValue({ data: orders, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: orders, error: null }),
        }),
      }),
    });

    // Simple case: just make the final result resolve
    // Override with a simpler approach - chain all returns
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: undefined as unknown,
    };
    // Make it thenable so await resolves
    Object.defineProperty(mockQuery, "then", {
      value: function (resolve: (v: unknown) => void) {
        return Promise.resolve({ data: orders, error: null }).then(resolve);
      },
    });
    mockAdminClient.from = vi.fn().mockReturnValue(mockQuery);

    const req = createMockRequest("http://localhost:3000/api/orders");

    const res = await ordersGet(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
  });

  // 10. Admin GET orders filtered by status
  it("filters orders by status when query param provided", async () => {
    const pendingOrders = [{ id: ORDER_ID, status: "pending", order_items: [] }];
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: undefined as unknown,
    };
    Object.defineProperty(mockQuery, "then", {
      value: function (resolve: (v: unknown) => void) {
        return Promise.resolve({ data: pendingOrders, error: null }).then(resolve);
      },
    });
    mockAdminClient.from = vi.fn().mockReturnValue(mockQuery);

    const req = createMockRequest("http://localhost:3000/api/orders?status=pending");

    const res = await ordersGet(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockQuery.eq).toHaveBeenCalledWith("status", "pending");
    expect(json).toEqual(pendingOrders);
  });

  // 11. Unauth GET orders rejected
  it("returns 401 for unauthenticated request", async () => {
    mockAuthClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const req = createMockRequest("http://localhost:3000/api/orders");

    const res = await ordersGet(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});

describe("GET /api/orders/[id]", () => {
  // 12. Admin GET order detail
  it("returns order detail for authenticated admin", async () => {
    const orderDetail = {
      id: ORDER_ID,
      status: "pending",
      order_items: [{ id: "item-1" }],
    };
    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: orderDetail, error: null }),
        }),
      }),
    });

    const req = createMockRequest(`http://localhost:3000/api/orders/${ORDER_ID}`);
    const res = await orderDetailGet(req, {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe(ORDER_ID);
    expect(json.order_items).toHaveLength(1);
  });
});

describe("PATCH /api/orders/[id]", () => {
  // 13. Admin PATCH order status - valid transition
  it("updates order status for valid transition (pending -> confirmed)", async () => {
    const currentOrder = { id: ORDER_ID, status: "pending", order_type: "pickup" };
    const updatedOrder = { ...currentOrder, status: "confirmed", order_items: [] };

    // First call: fetch current order; Second call: update
    let fromCallCount = 0;
    mockAdminClient.from = vi.fn().mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // Fetch current order
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: currentOrder, error: null }),
            }),
          }),
        };
      }
      // Update
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
            }),
          }),
        }),
      };
    });

    const req = createMockRequest(`http://localhost:3000/api/orders/${ORDER_ID}`, {
      method: "PATCH",
      body: { status: "confirmed" },
    });
    const res = await orderPatch(req, {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("confirmed");
  });

  // 14. Invalid status transition
  it("returns 400 for invalid status transition (pending -> completed)", async () => {
    const currentOrder = { id: ORDER_ID, status: "pending", order_type: "pickup" };

    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: currentOrder, error: null }),
        }),
      }),
    });

    const req = createMockRequest(`http://localhost:3000/api/orders/${ORDER_ID}`, {
      method: "PATCH",
      body: { status: "completed" },
    });
    const res = await orderPatch(req, {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid status transition");
  });

  // 15. Unauth PATCH rejected
  it("returns 401 for unauthenticated PATCH", async () => {
    mockAuthClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const req = createMockRequest(`http://localhost:3000/api/orders/${ORDER_ID}`, {
      method: "PATCH",
      body: { status: "confirmed" },
    });
    const res = await orderPatch(req, {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});

// ===========================================================================
// STRIPE ENDPOINTS
// ===========================================================================

describe("POST /api/stripe/checkout", () => {
  // 16. Create checkout session
  it("creates checkout session with valid order_id", async () => {
    const order = {
      id: ORDER_ID,
      total: 25.0,
      payment_status: "pending",
      order_type: "pickup",
      order_items: [{ id: "item-1" }],
    };

    let fromCallCount = 0;
    mockAdminClient.from = vi.fn().mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: order, error: null }),
            }),
          }),
        };
      }
      // Update call for stripe_session_id
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    const mockSession = {
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    };
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
      mockSession as never
    );

    const req = createMockRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: { order_id: ORDER_ID },
    });
    const res = await checkoutPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sessionId).toBe("cs_test_123");
    expect(json.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
  });

  // 17. Checkout for non-existent order
  it("returns 404 for non-existent order", async () => {
    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      }),
    });

    const req = createMockRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: { order_id: "nonexistent" },
    });
    const res = await checkoutPost(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Order not found");
  });

  // 18. Checkout for already-paid order
  it("returns 400 for already-paid order", async () => {
    const paidOrder = {
      id: ORDER_ID,
      total: 25.0,
      payment_status: "paid",
      order_items: [],
    };
    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: paidOrder, error: null }),
        }),
      }),
    });

    const req = createMockRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: { order_id: ORDER_ID },
    });
    const res = await checkoutPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("already");
  });
});

describe("POST /api/stripe/webhook", () => {
  const validPayload = JSON.stringify({ type: "checkout.session.completed" });

  // 19. Webhook: payment success
  it("updates order to paid+confirmed on checkout.session.completed", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { order_id: ORDER_ID },
          payment_intent: "pi_test_123",
        },
      },
    };
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as never);

    // First from call: select for idempotency check; Second: update
    let fromCallCount = 0;
    mockAdminClient.from = vi.fn().mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { payment_status: "pending" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    const req = createMockRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: validPayload,
      headers: { "stripe-signature": "sig_test_123" },
    });
    const res = await webhookPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    // Verify the update was called
    expect(mockAdminClient.from).toHaveBeenCalledTimes(2);
  });

  // 20. Webhook: idempotent (duplicate)
  it("skips update when order is already paid (idempotent)", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { order_id: ORDER_ID },
          payment_intent: "pi_test_123",
        },
      },
    };
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as never);

    // Return already-paid order
    mockAdminClient.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { payment_status: "paid" },
            error: null,
          }),
        }),
      }),
    });

    const req = createMockRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: validPayload,
      headers: { "stripe-signature": "sig_test_123" },
    });
    const res = await webhookPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    // Verify only 1 from() call (the select), no update call
    expect(mockAdminClient.from).toHaveBeenCalledTimes(1);
  });

  // 21. Webhook: invalid signature
  it("returns 400 for invalid webhook signature", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("Webhook signature verification failed");
    });

    const req = createMockRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: validPayload,
      headers: { "stripe-signature": "invalid_sig" },
    });
    const res = await webhookPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Webhook signature verification failed");
  });

  // 22. Webhook: missing signature header
  it("returns 400 when stripe-signature header is missing", async () => {
    const req = createMockRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: validPayload,
    });
    const res = await webhookPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing stripe-signature");
  });
});
