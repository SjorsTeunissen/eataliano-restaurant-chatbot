"use client";

import { MessageCircle, X } from "lucide-react";

interface ChatToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatToggle({ isOpen, onToggle }: ChatToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? "Sluit chat" : "Open chat"}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-fiamma text-white shadow-warm-lg transition-transform duration-200 hover:bg-fiamma/90 hover:scale-105"
    >
      {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
    </button>
  );
}
