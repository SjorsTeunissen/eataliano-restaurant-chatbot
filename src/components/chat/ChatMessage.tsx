"use client";

import type { ChatUIMessage } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatUIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`chat-message-${message.role}`}
    >
      <div
        className={`max-w-[80%] px-3 py-2 ${
          isUser
            ? "bg-crema text-oven rounded-base rounded-tr-sm"
            : "bg-oven/80 text-crema border border-fiamma/20 rounded-base rounded-tl-sm"
        }`}
      >
        <p className="text-sm font-body whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-oven/50" : "text-crema/50"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
