import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateTicketForm } from "../../src/CreateTicketForm.js";
import * as api from "../../src/api.js";

describe("Zen Green form conventions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Network" }]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([{ id: 2, name: "Campus Wi-Fi" }]);
  });

  it("uses labelled required fields and a disabled-safe submit state", async () => {
    render(<CreateTicketForm requester={{ id: 1, displayName: "Amina Rahman", email: "amina@example.test" }} />);

    expect(await screen.findByLabelText("Ticket Summary *")).toHaveClass("form-control");
    expect(screen.getByLabelText("Description *")).toHaveAttribute("maxlength", "2000");
    expect(screen.getByRole("button", { name: "Create Ticket" })).toHaveClass("btn-success");
    expect(screen.getByLabelText("Requester")).toHaveAttribute("readonly");
  });
});
