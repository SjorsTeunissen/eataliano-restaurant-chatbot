import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock Supabase admin client
const mockAdminFrom = vi.fn();
const mockAdminClient = {
  from: mockAdminFrom,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Import after mocks
import { POST, GET } from "../route";
import { PATCH } from "../[id]/route";

function createRequest(
  method: string,
  body?: Record<string, unknown>,
  url = "http://localhost:3000/api/reservations"
): Request {
  if (method === "GET") {
    return new Request(url, { method });
  }
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper to build a chainable Supabase query mock
function createQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "gte",
    "lte",
    "order",
    "single",
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => {
      if (method === "single") return Promise.resolve(result);
      return chain;
    });
  });
  // Make non-terminal methods return the chain
  return chain;
}

const VALID_LOCATION = {
  id: "loc-123",
  name: "Arnhem",
  is_active: true,
  opening_hours: {
    maandag: { open: "16:00", close: "22:00" },
    dinsdag: { open: "16:00", close: "22:00" },
    woensdag: { open: "16:00", close: "22:00" },
    donderdag: { open: "16:00", close: "22:00" },
    vrijdag: { open: "16:00", close: "23:00" },
    zaterdag: { open: "15:00", close: "23:00" },
    zondag: { open: "15:00", close: "22:00" },
  },
};

// Get a future date that is a Monday (maandag)
function getFutureMonday(): string {
  const date = new Date();
  date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
  return date.toISOString().split("T")[0];
}

const FUTURE_MONDAY = getFutureMonday();

const VALID_RESERVATION_BODY = {
  location_id: "loc-123",
  customer_name: "Jan de Vries",
  customer_email: "jan@example.com",
  customer_phone: "06-12345678",
  party_size: 4,
  reservation_date: FUTURE_MONDAY,
  reservation_time: "18:00",
};

describe("POST /api/reservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a reservation with valid data", async () => {
    const insertedReservation = {
      id: "res-1",
      ...VALID_RESERVATION_BODY,
      status: "confirmed",
      created_via: "chatbot",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock admin location lookup
    const locationChain = createQueryChain({
      data: VALID_LOCATION,
      error: null,
    });
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "locations") return locationChain;
      // For insert (reservations table)
      const insertChain = createQueryChain({
        data: insertedReservation,
        error: null,
      });
      return insertChain;
    });

    const req = createRequest("POST", VALID_RESERVATION_BODY);
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe("res-1");
    expect(data.message).toContain("Reservation confirmed");
    expect(data.message).toContain("4 guests");
    expect(data.message).toContain("Arnhem");
  });

  it("returns 422 when required fields are missing", async () => {
    const req = createRequest("POST", { location_id: "loc-123" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toBe("Missing required fields");
    expect(data.details).toContain("customer_name");
    expect(data.details).toContain("customer_phone");
    expect(data.details).toContain("party_size");
  });

  it("returns 422 when party_size is out of range (too small)", async () => {
    const locationChain = createQueryChain({
      data: VALID_LOCATION,
      error: null,
    });
    mockAdminFrom.mockReturnValue(locationChain);

    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      party_size: 0,
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("Party size");
  });

  it("returns 422 when party_size is out of range (too large)", async () => {
    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      party_size: 21,
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("Party size");
  });

  it("returns 422 when reservation_date is in the past", async () => {
    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      reservation_date: "2020-01-01",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("past");
  });

  it("returns 400 when location is not found", async () => {
    const locationChain = createQueryChain({
      data: null,
      error: { message: "Not found" },
    });
    mockAdminFrom.mockReturnValue(locationChain);

    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      location_id: "nonexistent",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Location not found");
  });

  it("returns 422 when time is outside opening hours", async () => {
    const locationChain = createQueryChain({
      data: VALID_LOCATION,
      error: null,
    });
    mockAdminFrom.mockReturnValue(locationChain);

    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      reservation_time: "10:00", // Before 16:00 opening on maandag
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("between");
  });

  it("returns 422 for invalid date format", async () => {
    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      reservation_date: "01-01-2030",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("YYYY-MM-DD");
  });

  it("returns 422 for invalid time format", async () => {
    const req = createRequest("POST", {
      ...VALID_RESERVATION_BODY,
      reservation_time: "6pm",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("HH:MM");
  });

  it("defaults created_via to chatbot", async () => {
    const insertedReservation = {
      id: "res-2",
      ...VALID_RESERVATION_BODY,
      status: "confirmed",
      created_via: "chatbot",
    };

    let insertCalledWith: Record<string, unknown> | undefined;
    const insertChain = createQueryChain({
      data: insertedReservation,
      error: null,
    });
    (insertChain.insert as ReturnType<typeof vi.fn>).mockImplementation(
      (data: Record<string, unknown>) => {
        insertCalledWith = data;
        return insertChain;
      }
    );

    const locationChain = createQueryChain({
      data: VALID_LOCATION,
      error: null,
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "locations") return locationChain;
      return insertChain;
    });

    const req = createRequest("POST", VALID_RESERVATION_BODY);
    await POST(req as never);

    expect(insertCalledWith).toBeDefined();
    expect(insertCalledWith!.created_via).toBe("chatbot");
  });
});

describe("GET /api/reservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = createRequest("GET");
    const res = await GET(req as never);

    expect(res.status).toBe(401);
  });

  it("returns reservations when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    const reservations = [
      { id: "res-1", customer_name: "Jan" },
      { id: "res-2", customer_name: "Piet" },
    ];

    const queryChain = createQueryChain({
      data: reservations,
      error: null,
    });
    // Override order to return the chain (not a promise)
    (queryChain.order as ReturnType<typeof vi.fn>).mockReturnValue(queryChain);
    // The final call in the chain returns data directly (no .single())
    // We need to make the chain resolve when awaited
    const finalPromise = Promise.resolve({
      data: reservations,
      error: null,
    });
    (queryChain.order as ReturnType<typeof vi.fn>).mockReturnValue({
      ...queryChain,
      then: finalPromise.then.bind(finalPromise),
      catch: finalPromise.catch.bind(finalPromise),
    });

    mockFrom.mockReturnValue(queryChain);

    const req = createRequest(
      "GET",
      undefined,
      "http://localhost:3000/api/reservations"
    );
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("applies filters when provided", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    const result = { data: [], error: null };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: (val: unknown) => void) => Promise.resolve(result).then(resolve),
    };
    mockFrom.mockReturnValue(chain);

    const url =
      "http://localhost:3000/api/reservations?location_id=loc-1&status=confirmed&date_from=2025-01-01&date_to=2025-12-31";
    const req = createRequest("GET", undefined, url);
    const res = await GET(req as never);

    expect(res.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith("location_id", "loc-1");
    expect(chain.eq).toHaveBeenCalledWith("status", "confirmed");
    expect(chain.gte).toHaveBeenCalledWith("reservation_date", "2025-01-01");
    expect(chain.lte).toHaveBeenCalledWith("reservation_date", "2025-12-31");
  });
});

describe("PATCH /api/reservations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = createRequest("PATCH", { status: "cancelled" });
    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "res-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("updates reservation status when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    // Mock the select (existence check)
    const selectChain = createQueryChain({
      data: { id: "res-1" },
      error: null,
    });

    // Mock the update
    const updatedReservation = {
      id: "res-1",
      status: "cancelled",
      customer_name: "Jan",
    };
    const updateChain = createQueryChain({
      data: updatedReservation,
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      return updateChain;
    });

    const req = createRequest("PATCH", { status: "cancelled" });
    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "res-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("cancelled");
  });

  it("returns 400 for invalid status value", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    const req = createRequest("PATCH", { status: "invalid_status" });
    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "res-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid status");
  });

  it("returns 400 when status is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    const req = createRequest("PATCH", {});
    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "res-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("required");
  });

  it("returns 404 when reservation not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });

    const selectChain = createQueryChain({
      data: null,
      error: { message: "Not found" },
    });
    mockFrom.mockReturnValue(selectChain);

    const req = createRequest("PATCH", { status: "cancelled" });
    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Reservation not found");
  });
});
