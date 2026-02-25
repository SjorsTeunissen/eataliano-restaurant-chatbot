import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatToggle } from "../ChatToggle";

describe("ChatToggle", () => {
  it('renders with "Open chat" aria-label when closed', () => {
    render(<ChatToggle isOpen={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
  });

  it('renders with "Sluit chat" aria-label when open', () => {
    render(<ChatToggle isOpen={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Sluit chat" })).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<ChatToggle isOpen={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
