import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import App from "../../src/App.js";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // WORKED EXAMPLE — provided for you.
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  it("shows Online when the health API succeeds", async () => {
    const healthSpy = vi.spyOn(api, "checkHealth").mockResolvedValue({
      status: "ok",
      service: "TokTickIT API",
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Check System" }));

    expect(await screen.findByText("Online")).toBeInTheDocument();
    expect(healthSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a useful Offline message when the health API is unavailable", async () => {
    vi.spyOn(api, "checkHealth").mockRejectedValue(new Error("Network error"));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Check System" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("System Status: Offline");
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to reach the TokTickIT API");
  });

  // Issue 4 — write these yourself. Hint: mock the api module with
  // vi.spyOn(api, "checkSystem").mockResolvedValue(...) / .mockRejectedValue(...)
  // then click the button and assert the Online list / Offline message.
  it.todo("shows Online and the seeded categories on success");
  it.todo("shows an Offline error message when the API is unavailable");
});
