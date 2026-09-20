import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { UserManagement } from "../../src/UserManagement.js";

const administrator: api.AuthUser = { id: 7, name: "Narin Admin", email: "narin.admin@example.test", role: "ADMINISTRATOR", mustChangePassword: false };
const managedUser: api.ManagedUser = { id: 8, name: "Amina User", email: "amina@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false };

describe("Administrator User Management", () => {
  it("lists users with filters and management actions", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([managedUser]);
    render(<UserManagement user={administrator} />);
    expect(await screen.findByText("Amina User")).toBeInTheDocument();
    expect(screen.getByLabelText("Search users")).toBeInTheDocument(); expect(screen.getByLabelText("Role", { selector: "select#user-role" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
  });

  it("edits a user's role and active state", async () => {
    const user = userEvent.setup(); vi.spyOn(api, "getAdminUsers").mockResolvedValue([managedUser]);
    const update = vi.spyOn(api, "updateAdminUser").mockResolvedValue({ ...managedUser, role: "IT_STAFF", isActive: false });
    render(<UserManagement user={administrator} />); await screen.findByText("Amina User"); await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.selectOptions(screen.getByLabelText("Role", { selector: "select#edit-role" }), "IT_STAFF"); await user.click(screen.getByLabelText("Active account", { selector: "input#edit-active" })); await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(update).toHaveBeenCalledWith(8, expect.objectContaining({ role: "IT_STAFF", active: false })); expect(await screen.findByText("User details updated.")).toBeInTheDocument();
  });

  it("creates a user and resets an initial password", async () => {
    const user = userEvent.setup(); vi.spyOn(api, "getAdminUsers").mockResolvedValue([managedUser]);
    const create = vi.spyOn(api, "createAdminUser").mockResolvedValue(managedUser); const reset = vi.spyOn(api, "resetAdminPassword").mockResolvedValue();
    render(<UserManagement user={administrator} />); await screen.findByText("Amina User");
    await user.type(screen.getByLabelText("Name", { selector: "input#create-name" }), "New User"); await user.type(screen.getByLabelText("Email", { selector: "input#create-email" }), "new@example.test"); await user.type(screen.getByLabelText("Initial password", { selector: "input#create-password" }), "NewAccount!2026"); await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.test", active: true }));
    await user.click(screen.getByRole("button", { name: "Reset password" })); await user.type(screen.getByLabelText("New initial password"), "Replacement!2026"); await user.click(screen.getByRole("button", { name: "Reset initial password" }));
    expect(reset).toHaveBeenCalledWith(8, "Replacement!2026");
  });
});
