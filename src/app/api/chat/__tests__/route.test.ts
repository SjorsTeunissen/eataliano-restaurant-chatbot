import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock: OpenAI
// ---------------------------------------------------------------------------
const mockCreate = vi.fn();

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  }),
  SYSTEM_PROMPT: "Test system prompt",
  FUNCTION_DEFINITIONS: [
    {
      type: "function",
      function: { name: "lookup_menu", parameters: {} },
    },
  ],
}));

// ---------------------------------------------------------------------------
// Mock: chat-functions
// ---------------------------------------------------------------------------
const mockExecuteFunctionCall = vi.fn();

vi.mock("@/lib/chat-functions", () => ({
  executeFunctionCall: (...args: unknown[]) => mockExecuteFunctionCall(...args),
}));

// ---------------------------------------------------------------------------
// Mock: Supabase admin client
// ---------------------------------------------------------------------------
let sessionSelectResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};
let sessionInsertResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};
let sessionUpdateResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

const mockAdminFrom = vi.fn();

function createSessionChain(operation: "select" | "insert" | "update") {
  const getResult = () => {
    switch (operation) {
      case "select":
        return sessionSelectResult;
      case "insert":
        return sessionInsertResult;
      case "update":
        return sessionUpdateResult;
    }
  };

  const chain: Record<string, unknown> = {};
  const methods = ["select", "insert", "update", "eq", "single"];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => {
      if (method === "single") return Promise.resolve(getResult());
      return chain;
    });
  });
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockAdminFrom(...args),
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { POST } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockOpenAIResponse(content: string, toolCalls?: unknown[]) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content,
          tool_calls: toolCalls || null,
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockExecuteFunctionCall.mockReset();
  mockCreate.mockReset();
  sessionSelectResult = { data: null, error: null };
  sessionInsertResult = { data: null, error: null };
  sessionUpdateResult = { data: null, error: null };

  // Default: no session found on select
  mockAdminFrom.mockImplementation(() => createSessionChain("select"));
});

describe("POST /api/chat", () => {
  it("returns 400 when message is missing", async () => {
    const req = createRequest({});
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Message is required");
  });

  it("returns 400 when message is empty string", async () => {
    const req = createRequest({ message: "   " });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Message is required");
  });

  it("returns 400 when message is not a string", async () => {
    const req = createRequest({ message: 123 });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Message is required");
  });

  it("returns assistant reply for a simple message", async () => {
    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("Welkom bij Eataliano!")
    );

    const req = createRequest({ message: "Hallo" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe("Welkom bij Eataliano!");
    expect(data.session_id).toBeNull();
  });

  it("sends system prompt and user message to OpenAI", async () => {
    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("Hoi!")
    );

    const req = createRequest({ message: "Hallo" });
    await POST(req as never);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4o");
    expect(callArgs.messages[0]).toEqual({
      role: "system",
      content: "Test system prompt",
    });
    expect(callArgs.messages[1]).toEqual({
      role: "user",
      content: "Hallo",
    });
  });

  it("handles function calling (tool_calls) correctly", async () => {
    // First call returns a tool call
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "lookup_menu",
                  arguments: '{"search_term":"pizza"}',
                },
              },
            ],
          },
        },
      ],
    });

    // Mock the function execution
    mockExecuteFunctionCall.mockResolvedValueOnce(
      JSON.stringify({
        items: [{ id: "1", name: "Margherita", price: 12.5 }],
      })
    );

    // Second call returns the final response
    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("We hebben de Margherita pizza voor €12,50!")
    );

    const req = createRequest({ message: "Welke pizza's hebben jullie?" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe("We hebben de Margherita pizza voor €12,50!");

    // Verify function was called
    expect(mockExecuteFunctionCall).toHaveBeenCalledWith("lookup_menu", {
      search_term: "pizza",
    });

    // Verify two OpenAI calls were made (initial + after function result)
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // Verify tool result was sent back to OpenAI
    const secondCallMessages = mockCreate.mock.calls[1][0].messages;
    const toolMessage = secondCallMessages.find(
      (m: Record<string, unknown>) => m.role === "tool"
    );
    expect(toolMessage).toBeDefined();
    expect(toolMessage.tool_call_id).toBe("call_123");
  });

  it("loads existing session when session_token provided", async () => {
    const existingMessages = [
      { role: "user", content: "Hallo" },
      { role: "assistant", content: "Welkom!" },
    ];

    sessionSelectResult = {
      data: { id: "session-1", messages: existingMessages },
      error: null,
    };

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "chat_sessions") {
        return createSessionChain("select");
      }
      return createSessionChain("select");
    });

    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("Hoe kan ik je helpen?")
    );

    const req = createRequest({
      message: "Wat is het menu?",
      session_token: "tok_abc123",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe("Hoe kan ik je helpen?");
    expect(data.session_id).toBe("session-1");

    // Verify OpenAI received the full conversation history
    // Note: the messages array is mutated after the call (assistant response pushed),
    // so we check the first 4 entries which were present at call time.
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0]).toEqual({
      role: "system",
      content: "Test system prompt",
    });
    expect(callArgs.messages[1]).toEqual({ role: "user", content: "Hallo" });
    expect(callArgs.messages[2]).toEqual({
      role: "assistant",
      content: "Welkom!",
    });
    expect(callArgs.messages[3]).toEqual({
      role: "user",
      content: "Wat is het menu?",
    });
  });

  it("creates new session when session_token provided but not found", async () => {
    sessionSelectResult = { data: null, error: { code: "PGRST116" } };
    sessionInsertResult = { data: { id: "new-session-1" }, error: null };

    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: select for existing session
        return createSessionChain("select");
      }
      // Second call: insert new session
      return createSessionChain("insert");
    });

    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("Welkom bij Eataliano!")
    );

    const req = createRequest({
      message: "Hallo",
      session_token: "tok_new",
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe("Welkom bij Eataliano!");
    expect(data.session_id).toBe("new-session-1");
  });

  it("works without session_token (stateless mode)", async () => {
    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("Hoi!")
    );

    const req = createRequest({ message: "Hallo" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe("Hoi!");
    expect(data.session_id).toBeNull();

    // Supabase should not be called for session management
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("returns 500 when OpenAI call fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const req = createRequest({ message: "Hallo" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to process chat message");
  });

  it("returns 503 when OpenAI API key is invalid", async () => {
    mockCreate.mockRejectedValueOnce(
      new Error("Invalid API key provided")
    );

    const req = createRequest({ message: "Hallo" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toBe("Chat service configuration error");
  });

  it("limits function call loops to prevent infinite recursion", async () => {
    // Simulate 6 consecutive tool call responses (exceeds MAX_FUNCTION_CALLS=5)
    for (let i = 0; i < 6; i++) {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: `call_${i}`,
                  type: "function",
                  function: {
                    name: "lookup_menu",
                    arguments: "{}",
                  },
                },
              ],
            },
          },
        ],
      });
    }

    mockExecuteFunctionCall.mockResolvedValue(
      JSON.stringify({ items: [] })
    );

    const req = createRequest({ message: "Loop test" });
    const res = await POST(req as never);
    const data = await res.json();

    // Should still return 200 but with fallback message
    expect(res.status).toBe(200);
    // Should have been called at most MAX_FUNCTION_CALLS times
    expect(mockExecuteFunctionCall.mock.calls.length).toBeLessThanOrEqual(5);
    expect(data.reply).toBeDefined();
  });

  it("handles multiple simultaneous tool calls in one response", async () => {
    // First call returns two tool calls
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_menu",
                type: "function",
                function: {
                  name: "lookup_menu",
                  arguments: '{"search_term":"pizza"}',
                },
              },
              {
                id: "call_location",
                type: "function",
                function: {
                  name: "get_location_info",
                  arguments: '{"location_name":"all"}',
                },
              },
            ],
          },
        },
      ],
    });

    mockExecuteFunctionCall
      .mockResolvedValueOnce(JSON.stringify({ items: [{ name: "Margherita" }] }))
      .mockResolvedValueOnce(JSON.stringify({ locations: [{ name: "Arnhem" }] }));

    // Second call returns the final response
    mockCreate.mockResolvedValueOnce(
      mockOpenAIResponse("We hebben pizza Margherita in onze vestiging in Arnhem.")
    );

    const req = createRequest({ message: "Welke pizza's en locaties?" });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toContain("Margherita");
    expect(mockExecuteFunctionCall).toHaveBeenCalledTimes(2);
  });
});
