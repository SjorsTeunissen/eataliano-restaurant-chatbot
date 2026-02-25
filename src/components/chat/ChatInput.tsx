"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Stel een vraag..."
        disabled={disabled}
        className="flex-1 rounded-base border border-crema/20 bg-oven/60 px-3 py-2 text-sm font-body text-crema placeholder:text-crema/40 focus:outline-none focus:ring-2 focus:ring-fiamma/30 disabled:opacity-50"
        aria-label="Chatbericht"
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={!value.trim() || isLoading}
        isLoading={isLoading}
        aria-label="Verstuur bericht"
      >
        <Send size={16} />
      </Button>
    </form>
  );
}
