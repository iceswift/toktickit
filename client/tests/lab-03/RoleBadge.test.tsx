import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as api from "../../src/api.js";
import { RoleBadge } from "../../src/RoleBadge.js";
import { UserManagement } from "../../src/UserManagement.js";

describe("Lab 3 role badges", () => {
  it.each(["REQUESTER", "IT_STAFF", "ADMINISTRATOR"] as const)("renders %s with a text-bearing badge", (role) => {
    render(<RoleBadge role={role} />);
    expect(screen.getByLabelText(`Role: ${role}`)).toHaveClass("badge");
    expect(screen.getByLabelText(`Role: ${role}`)).toHaveTextContent(role);
  });

  it("uses role badges in both the desktop user table and mobile cards", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([
      { id: 8, name: "Amina", email: "amina@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false },
    ]);
    render(<UserManagement user={{ id: 7, name: "Narin", email: "narin@example.test", role: "ADMINISTRATOR", mustChangePassword: false }} />);
    const badges = await screen.findAllByLabelText("Role: REQUESTER");
    expect(badges).toHaveLength(2);
    badges.forEach((badge) => expect(badge).toHaveClass("badge"));
  });
});
