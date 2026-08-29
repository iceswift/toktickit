import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { CreateTicketForm } from "../../src/CreateTicketForm.js";

const requester = { id: 1, displayName: "Amina Rahman", email: "amina.rahman@example.test" };

describe("Create Ticket", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Software" }]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([{ id: 2, name: "VPN" }]);
  });

  it("shows field-level validation without calling the API", async () => {
    const createSpy = vi.spyOn(api, "createTicket");
    render(<CreateTicketForm requester={requester} />);

    await screen.findByLabelText("Category *");
    await userEvent.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(screen.getByText("Choose an active category.")).toBeInTheDocument();
    expect(screen.getByText("Summary must be 5 to 120 characters.")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("submits valid input and displays the backend Ticket Number", async () => {
    vi.spyOn(api, "createTicket").mockResolvedValue({
      id: 9,
      ticketNumber: "TKT-20260829-AB12CD34",
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 2,
      summary: "VPN disconnects during online exam",
      description: "The VPN disconnects after approximately five minutes during the online exam.",
      requestedPriority: "HIGH",
      itPriority: "NOT_SET",
      currentStatus: "NEW",
      createdAt: "2026-08-29T00:00:00.000Z",
      updatedAt: "2026-08-29T00:00:00.000Z",
    });
    render(<CreateTicketForm requester={requester} />);

    await userEvent.selectOptions(await screen.findByLabelText("Category *"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Related System *"), "2");
    await userEvent.type(screen.getByLabelText("Ticket Summary *"), "VPN disconnects during online exam");
    await userEvent.selectOptions(screen.getByLabelText("Requested Priority *"), "HIGH");
    await userEvent.type(screen.getByLabelText("Description *"), "The VPN disconnects after approximately five minutes during the online exam.");
    await userEvent.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(await screen.findByText(/TKT-20260829-AB12CD34/)).toBeInTheDocument();
  });
});
