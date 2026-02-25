import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "../ChatInput";

describe("ChatInput", () => {
  it("renders input field and send button", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    expect(screen.getByPlaceholderText("Stel een vraag...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verstuur bericht" })).toBeInTheDocument();
  });

  it("calls onSend with input text on form submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} isLoading={false} />);

    const input = screen.getByPlaceholderText("Stel een vraag...");
    await user.type(input, "Hallo daar");
    await user.click(screen.getByRole("button", { name: "Verstuur bericht" }));

    expect(onSend).toHaveBeenCalledWith("Hallo daar");
  });

  it("does not call onSend when input is empty", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} isLoading={false} />);

    await user.click(screen.getByRole("button", { name: "Verstuur bericht" }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("submits via Enter key", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} isLoading={false} />);

    const input = screen.getByPlaceholderText("Stel een vraag...");
    await user.type(input, "Test{enter}");

    expect(onSend).toHaveBeenCalledWith("Test");
  });

  it("disables send button when isLoading is true", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />);

    const button = screen.getByRole("button", { name: "Verstuur bericht" });
    expect(button).toBeDisabled();
  });

  it("clears input after submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSend={onSend} isLoading={false} />);

    const input = screen.getByPlaceholderText("Stel een vraag...");
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: "Verstuur bericht" }));

    expect(input).toHaveValue("");
  });
});
