import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import App from "../../src/App.js";

const requesters = [
  { id: 1, displayName: "Amina Rahman", email: "amina.rahman@example.test" },
  { id: 2, displayName: "Ben Carter", email: "ben.carter@example.test" },
];

describe("Development Requester selection", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores a selected requester for the application context", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockResolvedValue(requesters);
    render(<App />);

    const select = await screen.findByLabelText("Development Requester");
    await userEvent.selectOptions(select, "2");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Requester: Ben Carter")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("toktickit.developmentRequesterId")).toBe("2");
  });

  it("shows a safe failure message when requesters cannot load", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockRejectedValue(new Error("Network error"));
    render(<App />);

    expect(await screen.findByText(/Unable to load Development Requesters/)).toBeInTheDocument();
  });
});
