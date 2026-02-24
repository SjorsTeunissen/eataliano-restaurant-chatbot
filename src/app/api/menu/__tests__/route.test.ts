import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

// Result that the final query chain call will resolve with
let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

// Track the last chained query so tests can inspect calls
let chainCalls: { method: string; args: unknown[] }[] = [];

/**
 * A chainable mock that also implements PromiseLike so it can be awaited
 * directly (for queries without .single()) or via .single() (which returns
 * a plain Promise).
 */
function createChain() {
  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      // Make the chain a thenable so `await query` works
      if (prop === "then") {
        return (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown
        ) => Promise.resolve(queryResult).then(onFulfilled, onRejected);
      }
      // Return a function for every other property (select, eq, order, etc.)
      return (...args: unknown[]) => {
        chainCalls.push({ method: prop, args });
        if (prop === "single") {
          return Promise.resolve(queryResult);
        }
        return chain; // keep chaining
      };
    },
  };

  const chain: object = new Proxy({}, handler);
  return chain;
}

let authResult: {
  data: { user: unknown };
  error: unknown;
} = { data: { user: null }, error: { message: "not authenticated" } };

const mockSupabase = {
  from: (_table: string) => createChain(),
  auth: {
    getUser: () => Promise.resolve(authResult),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock next/headers so the server.ts createClient doesn't blow up if it leaks
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: () => {},
    })
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; json?: unknown }
): NextRequest {
  const { json: jsonBody, method, headers } = init ?? {};
  const body = jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined;
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    body,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

function setAuth(user: unknown) {
  if (user) {
    authResult = { data: { user }, error: null };
  } else {
    authResult = { data: { user: null }, error: { message: "not authenticated" } };
  }
}

const ADMIN_USER = { id: "admin-uuid", email: "admin@example.com" };
const SAMPLE_ITEM = {
  id: "item-1",
  name: "Margherita",
  price: 12.5,
  category_id: "cat-1",
  is_available: true,
  category: { id: "cat-1", name: "Pizza" },
};
const SAMPLE_CATEGORY = {
  id: "cat-1",
  name: "Pizza",
  is_active: true,
  sort_order: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  queryResult = { data: null, error: null };
  chainCalls = [];
  setAuth(null);
});

// === GET /api/menu =========================================================

describe("GET /api/menu", () => {
  it("returns 200 with array of menu items", async () => {
    const { GET } = await import("../route");
    queryResult = { data: [SAMPLE_ITEM], error: null };

    const req = makeRequest("http://localhost:3000/api/menu");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([SAMPLE_ITEM]);
  });

  it("filters by category when query param present", async () => {
    const { GET } = await import("../route");
    queryResult = { data: [SAMPLE_ITEM], error: null };

    const req = makeRequest("http://localhost:3000/api/menu?category=cat-1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    // Verify eq was called with category_id
    const eqCalls = chainCalls.filter((c) => c.method === "eq");
    const hasCategoryFilter = eqCalls.some(
      (c) => c.args[0] === "category_id" && c.args[1] === "cat-1"
    );
    expect(hasCategoryFilter).toBe(true);
  });
});

// === GET /api/menu/[id] ====================================================

describe("GET /api/menu/[id]", () => {
  it("returns 200 with single item", async () => {
    const { GET } = await import("../[id]/route");
    queryResult = { data: SAMPLE_ITEM, error: null };

    const req = makeRequest("http://localhost:3000/api/menu/item-1");
    const res = await GET(req, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(SAMPLE_ITEM);
  });

  it("returns 404 when item not found", async () => {
    const { GET } = await import("../[id]/route");
    queryResult = { data: null, error: { message: "not found", code: "PGRST116" } };

    const req = makeRequest("http://localhost:3000/api/menu/nonexistent");
    const res = await GET(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Menu item not found");
  });
});

// === POST /api/menu ========================================================

describe("POST /api/menu", () => {
  it("creates item with valid body and admin session (201)", async () => {
    const { POST } = await import("../route");
    setAuth(ADMIN_USER);
    const created = { ...SAMPLE_ITEM, id: "new-item" };
    queryResult = { data: created, error: null };

    const req = makeRequest("http://localhost:3000/api/menu", {
      method: "POST",
      json: { name: "Margherita", price: 12.5, category_id: "cat-1" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toEqual(created);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("../route");
    setAuth(null);

    const req = makeRequest("http://localhost:3000/api/menu", {
      method: "POST",
      json: { name: "Margherita", price: 12.5, category_id: "cat-1" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("../route");
    setAuth(ADMIN_USER);

    // Missing price and category_id
    const req = makeRequest("http://localhost:3000/api/menu", {
      method: "POST",
      json: { name: "Margherita" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// === PATCH /api/menu/[id] ==================================================

describe("PATCH /api/menu/[id]", () => {
  it("updates item with admin session (200)", async () => {
    const { PATCH } = await import("../[id]/route");
    setAuth(ADMIN_USER);
    const updated = { ...SAMPLE_ITEM, name: "Updated Pizza" };
    queryResult = { data: updated, error: null };

    const req = makeRequest("http://localhost:3000/api/menu/item-1", {
      method: "PATCH",
      json: { name: "Updated Pizza" },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("Updated Pizza");
  });

  it("returns 401 without auth", async () => {
    const { PATCH } = await import("../[id]/route");
    setAuth(null);

    const req = makeRequest("http://localhost:3000/api/menu/item-1", {
      method: "PATCH",
      json: { name: "Updated Pizza" },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });
});

// === DELETE /api/menu/[id] =================================================

describe("DELETE /api/menu/[id]", () => {
  it("soft-deletes item with admin session (200)", async () => {
    const { DELETE } = await import("../[id]/route");
    setAuth(ADMIN_USER);
    queryResult = { data: { ...SAMPLE_ITEM, is_available: false }, error: null };

    const req = makeRequest("http://localhost:3000/api/menu/item-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.message).toBe("Menu item deleted");
  });

  it("returns 401 without auth", async () => {
    const { DELETE } = await import("../[id]/route");
    setAuth(null);

    const req = makeRequest("http://localhost:3000/api/menu/item-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });
});

// === GET /api/menu/categories ==============================================

describe("GET /api/menu/categories", () => {
  it("returns active categories ordered by sort_order", async () => {
    const { GET } = await import("../categories/route");
    queryResult = { data: [SAMPLE_CATEGORY], error: null };

    const req = makeRequest("http://localhost:3000/api/menu/categories");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([SAMPLE_CATEGORY]);
  });
});

// === POST /api/menu/categories =============================================

describe("POST /api/menu/categories", () => {
  it("creates category with admin session (201)", async () => {
    const { POST } = await import("../categories/route");
    setAuth(ADMIN_USER);
    queryResult = { data: SAMPLE_CATEGORY, error: null };

    const req = makeRequest("http://localhost:3000/api/menu/categories", {
      method: "POST",
      json: { name: "Pizza" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toEqual(SAMPLE_CATEGORY);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("../categories/route");
    setAuth(null);

    const req = makeRequest("http://localhost:3000/api/menu/categories", {
      method: "POST",
      json: { name: "Pizza" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });
});

// === PATCH /api/menu/categories/[id] =======================================

describe("PATCH /api/menu/categories/[id]", () => {
  it("updates category with admin session (200)", async () => {
    const { PATCH } = await import("../categories/[id]/route");
    setAuth(ADMIN_USER);
    const updated = { ...SAMPLE_CATEGORY, name: "Pasta" };
    queryResult = { data: updated, error: null };

    const req = makeRequest("http://localhost:3000/api/menu/categories/cat-1", {
      method: "PATCH",
      json: { name: "Pasta" },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cat-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("Pasta");
  });
});
