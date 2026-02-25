"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WELCOME_MESSAGE =
  "Welkom bij Eataliano! Hoe kan ik je helpen? Ik kan je vertellen over ons menu, een reservering maken, of een bestelling plaatsen.";

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const { messages, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-40 flex h-full w-full flex-col bg-oven transition-transform duration-300 ease-in-out sm:w-[400px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Chatpaneel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-crema/10 p-4">
          <h2 className="font-headline text-lg text-crema">Chat met Eataliano</h2>
          <button
            onClick={onClose}
            aria-label="Sluit chat"
            className="text-crema/60 transition-colors hover:text-crema"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex justify-start" data-testid="welcome-message">
              <div className="max-w-[80%] rounded-base rounded-tl-sm border border-fiamma/20 bg-oven/80 px-3 py-2 text-crema">
                <p className="text-sm font-body">{WELCOME_MESSAGE}</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start" data-testid="typing-indicator">
              <div className="rounded-base rounded-tl-sm border border-fiamma/20 bg-oven/80 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-crema/60 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-crema/60 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-crema/60 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-crema/10 p-4">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </aside>
    </>
  );
}
