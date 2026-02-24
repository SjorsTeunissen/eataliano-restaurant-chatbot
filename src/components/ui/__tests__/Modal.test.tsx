import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("renders nothing when not open", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(
      <Modal isOpen onClose={() => {}}>
        Modal content
      </Modal>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <Modal isOpen onClose={() => {}} title="My Modal">
        Content
      </Modal>
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
  });

  it("has dialog role and aria-modal", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test">
        Content
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );
    const overlay = screen.getByRole("dialog");
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when content is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Click me</p>
      </Modal>
    );
    await user.click(screen.getByText("Click me"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has a close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );
    await user.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
