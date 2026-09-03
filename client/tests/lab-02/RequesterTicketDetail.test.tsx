import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import { RequesterTicketDetail } from "../../src/RequesterTicketDetail.js";

const requester = { id: 1, displayName: "Amina Rahman", email: "amina.rahman@example.test" };
const ticket = {
  id: 8, ticketNumber: "TKT-20260830-AB12CD34", requesterId: 1, categoryId: 1, relatedSystemId: 2,
  summary: "VPN disconnects during online exam", description: "The VPN disconnects after approximately five minutes during the online exam.",
  requestedPriority: "HIGH" as const, itPriority: "NOT_SET" as const, currentStatus: "NEW" as const,
  createdAt: "2026-08-30T10:00:00.000Z", updatedAt: "2026-08-30T10:30:00.000Z",
  category: { id: 1, name: "Network" }, relatedSystem: { id: 2, name: "Campus VPN" }, attachments: [],
};

describe("RequesterTicketDetail", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders owner-scoped Ticket fields read-only and returns to My Tickets", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(ticket);
    const onBack = vi.fn();
    render(<RequesterTicketDetail requester={requester} ticketId={ticket.id} onBack={onBack} />);

    expect(await screen.findByText(ticket.ticketNumber)).toBeInTheDocument();
    expect(screen.getByText("Campus VPN")).toBeInTheDocument();
    expect(screen.getByText(/No attachments have been added/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Back to My Tickets/ }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("does not disclose Ticket data when the owner-scoped request fails", async () => {
    vi.spyOn(api, "getTicketDetail").mockRejectedValue(new Error("Not found"));
    render(<RequesterTicketDetail requester={requester} ticketId={ticket.id} onBack={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable or you do not have access/);
    expect(screen.queryByText(ticket.summary)).not.toBeInTheDocument();
  });

  it("uploads an allowed Attachment and requires a reason before soft removal", async () => {
    const attachment = { id: 31, originalFilename: "evidence.pdf", mimeType: "application/pdf", byteSize: 24, uploadedAt: "2026-08-30T10:00:00.000Z", removedAt: null, removalReason: null };
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...ticket, attachments: [attachment] });
    const uploadSpy = vi.spyOn(api, "uploadTicketAttachment").mockResolvedValue(attachment);
    const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue();
    render(<RequesterTicketDetail requester={requester} ticketId={ticket.id} onBack={vi.fn()} />);

    await screen.findByText("evidence.pdf");
    const file = new File(["%PDF-1.4"], "evidence.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Add attachment"), { target: { files: [file] } });
    await userEvent.click(screen.getByRole("button", { name: "Upload attachment" }));
    expect(uploadSpy).toHaveBeenCalledWith(requester.id, ticket.id, file);
    expect(await screen.findByText("Attachment uploaded.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.type(screen.getByLabelText("Removal reason"), "The file is obsolete.");
    await userEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
    expect(removeSpy).toHaveBeenCalledWith(requester.id, attachment.id, "The file is obsolete.");
  });
});
