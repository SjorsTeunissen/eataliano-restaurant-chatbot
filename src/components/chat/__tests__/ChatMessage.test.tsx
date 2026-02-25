import { render, screen } from "@testing-library/react";
import { ChatMessage } from "../ChatMessage";
import type { ChatUIMessage } from "@/hooks/useChat";

const baseMessage: ChatUIMessage = {
  id: "1",
  role: "user",
  content: "Hello",
  timestamp: Date.now(),
};

describe("ChatMessage", () => {
  it("renders user message with right alignment", () => {
    render(<ChatMessage message={baseMessage} />);
    const wrapper = screen.getByTestId("chat-message-user");
    expect(wrapper).toHaveClass("justify-end");
  });

  it("renders assistant message with left alignment", () => {
    const assistantMsg: ChatUIMessage = {
      ...baseMessage,
      id: "2",
      role: "assistant",
      content: "Welkom!",
    };
    render(<ChatMessage message={assistantMsg} />);
    const wrapper = screen.getByTestId("chat-message-assistant");
    expect(wrapper).toHaveClass("justify-start");
  });

  it("displays message content text", () => {
    render(<ChatMessage message={{ ...baseMessage, content: "Test bericht" }} />);
    expect(screen.getByText("Test bericht")).toBeInTheDocument();
  });
});
