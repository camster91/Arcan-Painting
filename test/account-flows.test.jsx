import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SignInPage from "@/app/account/signin/page";
import ForgotPasswordPage from "@/app/account/forgot-password/page";
import ResetPasswordPage from "@/app/account/reset-password/page";
import AcceptInvitePage from "@/app/account/accept-invite/page";
import ChangePasswordPage from "@/app/account/change-password/page";

function renderAt(ui, initialEntry) {
  return render(<MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>);
}

function jsonResponse(body, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

describe("account recovery and onboarding flows", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  test("sign-in submits credentials to the local authentication endpoint", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ success: true }));
    renderAt(<SignInPage />, "/account/signin?callbackUrl=%2Fadmin");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-horse-battery-staple" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledOnce());
    expect(global.fetch).toHaveBeenCalledWith("/api/local-auth/login", expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email: "owner@example.com", password: "correct-horse-battery-staple" }),
    }));
  });

  test("does not submit a malformed invitation link", () => {
    renderAt(<AcceptInvitePage />, "/account/accept-invite");

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Crew Member" } });
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: "safe-password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert")).toHaveTextContent("invitation link is incomplete or invalid");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("accepts an invitation through the public token endpoint", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ success: true }));
    const token = "a".repeat(64);
    renderAt(<AcceptInvitePage />, `/account/accept-invite?token=${token}`);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Crew Member" } });
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: "safe-password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledOnce());
    expect(global.fetch).toHaveBeenCalledWith("/api/team-invites/accept", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ token, name: "Crew Member", password: "safe-password" }),
    }));
    expect(await screen.findByRole("status")).toHaveTextContent("account is ready");
  });

  test("requests and confirms password resets without exposing account existence", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({ success: true }));
    const { unmount } = renderAt(<ForgotPasswordPage />, "/account/forgot-password");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email reset link" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/local-auth/password-reset/request", expect.objectContaining({
      body: JSON.stringify({ emailOrUsername: "owner@example.com" }),
    })));
    expect(await screen.findByRole("status")).toHaveTextContent("If an account exists");

    unmount();
    global.fetch.mockResolvedValueOnce(jsonResponse({ success: true }));
    renderAt(<ResetPasswordPage />, "/account/reset-password?token=reset-token");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "safe-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/local-auth/password-reset/confirm", expect.objectContaining({
      body: JSON.stringify({ token: "reset-token", newPassword: "safe-password" }),
    })));
    expect(await screen.findByRole("status")).toHaveTextContent("password was reset");
  });

  test("prevents a mismatched in-session password change from reaching the API", () => {
    renderAt(<ChangePasswordPage />, "/account/change-password");

    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "safe-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
