import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../../src/api.js";
import App from "../../src/App.js";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  it("shows a loading state while the API request is pending", async () => {
    vi.spyOn(api, "checkSystem").mockReturnValue(new Promise(() => undefined));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Check System" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking system status and loading categories",
    );
  });

  it("shows Online and the categories returned by the API", async () => {
    const systemSpy = vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Check System" }));

    expect(await screen.findByText("Online")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "IT Request Categories" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(systemSpy).toHaveBeenCalledTimes(1);
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Network error"));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Check System" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("System Status: Offline");
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to reach the TokTickIT API");
  });
});
