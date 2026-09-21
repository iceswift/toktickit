import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { StaffTicketDetail } from "../../src/StaffTicketDetail.js";

const ticket = { id: 7, ticketNumber: "TKT-7", requesterId: 1, categoryId: 1, relatedSystemId: 1, summary: "Printer offline", description: "Printer does not respond.", requestedPriority: "HIGH" as const, itPriority: "NOT_SET" as const, currentStatus: "NEW" as const, createdAt: "2026-09-20T00:00:00Z", updatedAt: "2026-09-20T00:00:00Z", category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Printer" }, attachments: [], requesterUser: { id: 1, name: "Amina", email: "amina@example.test" }, owner: null, publicComments: [], internalNotes: [] };

describe("IT Staff Ticket Detail", () => {
  it("separates Public Comments from Internal Notes and exposes staff controls", async () => {
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(ticket);
    render(<StaffTicketDetail ticketId={7} user={{ id: 2, name: "Iris", email: "iris@example.test", role: "IT_STAFF", mustChangePassword: false }} onBack={() => undefined} />);
    expect(await screen.findByText("IT Staff controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim Ticket" })).toBeInTheDocument();
    expect(screen.getByLabelText("Add Public Comment")).toBeInTheDocument();
    expect(screen.getByLabelText("Add Internal Note")).toBeInTheDocument();
  });
  it("posts a Public Comment through the staff API", async () => {
    const user = userEvent.setup(); vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(ticket); const post = vi.spyOn(api, "addStaffPublicComment").mockResolvedValue({ id: 1, ticketId: 7, content: "Working on it", createdAt: "2026-09-20T00:00:00Z", author: { id: 2, name: "Iris", role: "IT_STAFF" } });
    render(<StaffTicketDetail ticketId={7} user={{ id: 2, name: "Iris", email: "iris@example.test", role: "IT_STAFF", mustChangePassword: false }} onBack={() => undefined} />);
    await user.type(await screen.findByLabelText("Add Public Comment"), "Working on it"); await user.click(screen.getByRole("button", { name: "Post Public Comment" }));
    expect(post).toHaveBeenCalledWith(7, "Working on it");
  });
});
