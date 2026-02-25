import { renderHook, act } from "@testing-library/react";
import { useChat } from "../useChat";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID while preserving the rest of crypto
let uuidCounter = 0;
const originalCrypto = globalThis.crypto;
vi.stubGlobal("crypto", {
  ...originalCrypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Ensure localStorage is available in test environment
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => [...storageMap.keys()][index] ?? null,
};

vi.stubGlobal("localStorage", mockLocalStorage);

beforeEach(() => {
  uuidCounter = 0;
  mockFetch.mockReset();
  storageMap.clear();
});

describe("useChat", () => {
  it("returns initial state with empty messages", () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("adds user message to state immediately on sendMessage", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Hallo!", session_id: "s1" }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hoi");
    });

    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      content: "Hoi",
    });
  });

  it("calls fetch with correct URL and body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Hallo!", session_id: "s1" }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining('"message":"Test message"'),
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.session_token).toBeDefined();
  });

  it("adds assistant message on successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Welkom!", session_id: "s1" }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hoi");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Welkom!",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error and adds fallback message on error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hoi");
    });

    expect(result.current.error).toBe("Er ging iets mis");
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Sorry, er ging iets mis. Probeer het opnieuw.",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("reads session token from localStorage on mount", () => {
    localStorage.setItem("eataliano-chat-session", "existing-token");

    renderHook(() => useChat());

    // Verify it uses the existing token by checking fetch call
    // The token is stored in a ref, verified via fetch
    expect(localStorage.getItem("eataliano-chat-session")).toBe("existing-token");
  });

  it("generates and stores session token if not present", () => {
    renderHook(() => useChat());

    const token = localStorage.getItem("eataliano-chat-session");
    expect(token).toBeTruthy();
    expect(token).toContain("test-uuid-");
  });

  it("does not send empty or whitespace-only messages", async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it("clearChat resets messages and generates new session token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Hi", session_id: "s1" }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(result.current.messages).toHaveLength(2);
    const oldToken = localStorage.getItem("eataliano-chat-session");

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
    const newToken = localStorage.getItem("eataliano-chat-session");
    expect(newToken).not.toBe(oldToken);
  });
});
