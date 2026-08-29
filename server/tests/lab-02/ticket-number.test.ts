import { describe, expect, it } from "vitest";
import { generateTicketNumber } from "../../src/ticket-number.js";

describe("generateTicketNumber", () => {
  it("creates the documented official Ticket Number format", () => {
    expect(generateTicketNumber(new Date("2026-08-29T12:00:00.000Z")))
      .toMatch(/^TKT-20260829-[A-Z0-9]{8}$/);
  });

  it("creates a fresh candidate for each retry attempt", () => {
    const first = generateTicketNumber(new Date("2026-08-29T12:00:00.000Z"));
    const second = generateTicketNumber(new Date("2026-08-29T12:00:00.000Z"));

    expect(first).not.toBe(second);
  });
});
