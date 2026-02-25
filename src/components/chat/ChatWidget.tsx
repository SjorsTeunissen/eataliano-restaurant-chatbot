"use client";

import { useState } from "react";
import { ChatToggle } from "./ChatToggle";
import { ChatSidebar } from "./ChatSidebar";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <ChatToggle isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} />
    </>
  );
}
