import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with a label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input error="Invalid" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("applies error border styling", () => {
    render(<Input error="Error" />);
    expect(screen.getByRole("textbox").className).toContain("border-red-500");
  });

  it("applies normal border when no error", () => {
    render(<Input />);
    expect(screen.getByRole("textbox").className).toContain("border-oven/20");
  });

  it("handles onChange events", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "hello");
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it("forwards placeholder prop", () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Input className="w-64" />);
    expect(screen.getByRole("textbox").className).toContain("w-64");
  });
});
