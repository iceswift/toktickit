import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { ChangePassword } from "../../src/ChangePassword.js";
import { Login } from "../../src/Login.js";

describe("Lab 3 authentication screens", () => {
  it("submits credentials and returns the authenticated user", async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    vi.spyOn(api, "login").mockResolvedValue({ id: 1, name: "Amina", email: "amina@example.test", role: "REQUESTER", mustChangePassword: false });
    render(<Login onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByLabelText("Email"), "amina@example.test");
    await user.type(screen.getByLabelText("Password"), "Password!2026");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ email: "amina@example.test" }));
  });

  it("keeps a mismatched password in the form and explains the problem", async () => {
    const user = userEvent.setup();
    const changePassword = vi.spyOn(api, "changePassword");
    render(<ChangePassword />);
    await user.type(screen.getByLabelText("Current password"), "OldPassword!2026");
    await user.type(screen.getByLabelText("New password"), "NewPassword!2026");
    await user.type(screen.getByLabelText("Confirm new password"), "Different!2026");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("must match");
    expect(changePassword).not.toHaveBeenCalled();
  });
});
