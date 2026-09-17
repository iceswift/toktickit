import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import App from "../../src/App.js";

describe("Authenticated requester identity replaces development selection", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(api, "getCurrentUser").mockRejectedValue(new api.ApiError("Not signed in"));
  });

  it("requires login and never offers a Development Requester selector", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Development Requester")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("toktickit.developmentRequesterId")).toBeNull();
  });

  it("uses the authenticated User for the requester shell", async () => {
    vi.spyOn(api, "login").mockResolvedValue({ id: 2, name: "Ben Carter", email: "ben.carter@example.test", role: "REQUESTER", mustChangePassword: false });
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
    render(<App />);
    await userEvent.type(await screen.findByLabelText("Email"), "ben.carter@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "Password!2026");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Ben Carter · Requester")).toBeInTheDocument();
    expect(screen.queryByLabelText("Development Requester")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("toktickit.developmentRequesterId")).toBeNull();
  });

  it("restores an existing requester session without another identity choice", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue({ id: 1, name: "Amina Rahman", email: "amina.rahman@example.test", role: "REQUESTER", mustChangePassword: false });
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
    render(<App />);
    expect(await screen.findByText("Amina Rahman · Requester")).toBeInTheDocument();
    expect(screen.queryByLabelText("Development Requester")).not.toBeInTheDocument();
  });

  it("blocks the requester shell until the first password change", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue({ id: 1, name: "Amina Rahman", email: "amina.rahman@example.test", role: "REQUESTER", mustChangePassword: true });
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Change password" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My Tickets" })).not.toBeInTheDocument();
  });
});
