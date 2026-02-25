"use client";

import { useState, useRef, useCallback } from "react";

export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "eataliano-chat-session";

function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionTokenRef = useRef<string>(getOrCreateSessionToken());

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatUIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          session_token: sessionTokenRef.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();

      const assistantMessage: ChatUIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setError("Er ging iets mis");
      const fallbackMessage: ChatUIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, er ging iets mis. Probeer het opnieuw.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    const newToken = crypto.randomUUID();
    sessionTokenRef.current = newToken;
    localStorage.setItem(STORAGE_KEY, newToken);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
