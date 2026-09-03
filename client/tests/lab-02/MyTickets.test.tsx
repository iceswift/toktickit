import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { MyTickets } from "../../src/MyTickets.js";

const requester = { id: 1, displayName: "Amina Rahman", email: "amina.rahman@example.test" };
const ticket = {
  id: 8, ticketNumber: "TKT-20260830-AB12CD34", requesterId: 1, categoryId: 1, relatedSystemId: 2,
  summary: "VPN disconnects during online exam", description: "The VPN disconnects after approximately five minutes during the online exam.",
  requestedPriority: "HIGH" as const, itPriority: "NOT_SET" as const, currentStatus: "NEW" as const,
  createdAt: "2026-08-30T10:00:00.000Z", updatedAt: "2026-08-30T10:30:00.000Z", category: { id: 1, name: "Network" },
};

describe("My Tickets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Network" }]);
  });

  it("shows owned Ticket data and sends search/filter query controls", async () => {
    const listSpy = vi.spyOn(api, "getMyTickets").mockResolvedValue({ items: [ticket], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
    render(<MyTickets requester={requester} onCreateTicket={vi.fn()} onOpenTicket={vi.fn()} />);

    expect((await screen.findAllByText(ticket.ticketNumber)).length).toBeGreaterThan(0);
    await userEvent.type(screen.getByLabelText("Search"), "VPN");
    expect((await screen.findAllByText(ticket.ticketNumber)).length).toBeGreaterThan(0);
    expect(listSpy).toHaveBeenLastCalledWith(1, expect.objectContaining({ search: "VPN", page: 1 }));
  });

  it("distinguishes an empty Ticket list from no matching results", async () => {
    const listSpy = vi.spyOn(api, "getMyTickets").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
    render(<MyTickets requester={requester} onCreateTicket={vi.fn()} onOpenTicket={vi.fn()} />);

    expect(await screen.findByText(/No Tickets yet/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search"), "missing");
    expect(await screen.findByText(/No matching Tickets/)).toBeInTheDocument();
    expect(listSpy).toHaveBeenLastCalledWith(1, expect.objectContaining({ search: "missing" }));
  });
});
