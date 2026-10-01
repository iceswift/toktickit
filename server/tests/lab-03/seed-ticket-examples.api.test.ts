import { describe, expect, it } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { seedTicketExamples, ticketExamples } from "../../prisma/seed-ticket-examples.js";

describe("Lab 3 realistic seed examples", () => {
  it("creates eight workflow examples with correct ownership and repeat-safe communication", async () => {
    const prisma = getPrisma();
    await seedTicketExamples(prisma);
    const where = { ticketNumber: { in: ticketExamples.map((example) => `TKT-20260901-${example.suffix}`) } };
    const read = () => prisma.ticket.findMany({ where, orderBy: { ticketNumber: "asc" }, include: { requesterUser: true, owner: true, publicComments: true, internalNotes: true } });
    const first = await read();
    expect(first).toHaveLength(8);
    expect(new Set(first.map((ticket) => ticket.currentStatus)).size).toBe(8);
    expect(new Set(first.map((ticket) => ticket.requesterUserId)).size).toBe(4);
    expect(new Set(first.map((ticket) => ticket.requestedPriority)).size).toBe(3);
    expect(first.some((ticket) => ticket.ownerUserId === null)).toBe(true);
    expect(first.some((ticket) => ticket.owner?.role === "IT_STAFF" && ticket.owner.isActive)).toBe(true);
    for (const ticket of first) {
      expect(ticket.requesterUser?.developmentRequesterId).toBe(ticket.requesterId);
      expect(ticket.publicComments.length).toBeGreaterThan(0);
      expect(ticket.internalNotes.length).toBeGreaterThan(0);
    }
    await seedTicketExamples(prisma);
    expect(await read()).toEqual(first);
  });

  it("preserves an existing worked Ticket and account credentials on a repeat run", async () => {
    const prisma = getPrisma();
    await seedTicketExamples(prisma);
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: "TKT-20260901-DEMO0001" } });
    const userBefore = await prisma.user.findUniqueOrThrow({ where: { id: ticket.requesterUserId! } });
    try {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { currentStatus: "IN_PROGRESS", summary: "Staff update that must survive reseeding", itPriority: "URGENT" } });
      await seedTicketExamples(prisma);
      expect(await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).toMatchObject({ currentStatus: "IN_PROGRESS", summary: "Staff update that must survive reseeding", itPriority: "URGENT" });
      const userAfter = await prisma.user.findUniqueOrThrow({ where: { id: userBefore.id } });
      expect(userAfter.passwordHash).toBe(userBefore.passwordHash);
      expect(userAfter.mustChangePassword).toBe(userBefore.mustChangePassword);
    } finally {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { currentStatus: ticket.currentStatus, summary: ticket.summary, itPriority: ticket.itPriority } });
    }
  });
});
