import { randomBytes } from "node:crypto";

export function generateTicketNumber(now = new Date()): string {
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("");
  const suffix = randomBytes(4).toString("hex").toUpperCase();

  return `TKT-${date}-${suffix}`;
}
