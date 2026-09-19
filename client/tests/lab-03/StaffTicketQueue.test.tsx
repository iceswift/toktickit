import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { StaffTicketQueue } from "../../src/StaffTicketQueue.js";

describe("IT Staff Ticket Queue", () => {
  it("renders queue controls and an explicit no-results state", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
    render(<StaffTicketQueue />);
    expect(await screen.findByText("There are no Tickets in the queue.")).toBeInTheDocument();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort")).toBeInTheDocument();
  });
  it("sends a search query and distinguishes filtered no-results", async () => {
    const user = userEvent.setup(); const queue = vi.spyOn(api, "getStaffTickets").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
    render(<StaffTicketQueue />);
    await screen.findByRole("status"); await user.type(screen.getByLabelText("Search"), "missing");
    expect(await screen.findByText("No Tickets match these filters.")).toBeInTheDocument();
    expect(queue).toHaveBeenLastCalledWith(expect.objectContaining({ search: "missing" }));
  });
});
