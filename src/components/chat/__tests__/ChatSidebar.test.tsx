import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatSidebar } from "../ChatSidebar";

// Mock useChat hook
vi.mock("@/hooks/useChat", () => ({
  useChat: () => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    clearChat: vi.fn(),
  }),
}));

describe("ChatSidebar", () => {
  it("has translate-x-full class when isOpen is false", () => {
    render(<ChatSidebar isOpen={false} onClose={vi.fn()} />);
    const sidebar = screen.getByRole("complementary", { name: "Chatpaneel" });
    expect(sidebar.className).toContain("translate-x-full");
  });

  it("has translate-x-0 class when isOpen is true", () => {
    render(<ChatSidebar isOpen={true} onClose={vi.fn()} />);
    const sidebar = screen.getByRole("complementary", { name: "Chatpaneel" });
    expect(sidebar.className).toContain("translate-x-0");
  });

  it('renders header with "Chat met Eataliano" title', () => {
    render(<ChatSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Chat met Eataliano")).toBeInTheDocument();
  });

  it("renders welcome message when no conversation exists", () => {
    render(<ChatSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId("welcome-message")).toBeInTheDocument();
    expect(
      screen.getByText(/Welkom bij Eataliano/)
    ).toBeInTheDocument();
  });

  it("close button calls onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ChatSidebar isOpen={true} onClose={onClose} />);

    // The sidebar header close button
    const closeButtons = screen.getAllByRole("button", { name: "Sluit chat" });
    await user.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
