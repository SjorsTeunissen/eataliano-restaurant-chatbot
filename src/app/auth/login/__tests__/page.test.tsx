import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInWithPassword = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with email, password, and submit button", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("E-mailadres")).toBeInTheDocument();
    expect(screen.getByLabelText("Wachtwoord")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Inloggen" })
    ).toBeInTheDocument();
    expect(screen.getByText("Admin Inloggen")).toBeInTheDocument();
  });

  it("shows error message on invalid credentials", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mailadres"), "test@example.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(screen.getByText("Ongeldige inloggegevens")).toBeInTheDocument();
    });
  });

  it("redirects to /admin on successful login", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mailadres"), "admin@example.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "correctpassword");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("disables button while loading", async () => {
    const user = userEvent.setup();
    // Never resolve so the loading state persists
    mockSignInWithPassword.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mailadres"), "test@example.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  it("clears password field on error", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Wachtwoord");

    await user.type(screen.getByLabelText("E-mailadres"), "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(passwordInput).toHaveValue("");
    });
  });
});
