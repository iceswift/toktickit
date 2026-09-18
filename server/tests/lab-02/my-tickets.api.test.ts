import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "../lab-03/requester-session.js";

let requesterA: number;
let requesterB: number;
let categoryId: number;
let relatedSystemId: number;
let agent: ReturnType<typeof request.agent>;
let email: string;

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, include: { migratedUser: { select: { id: true } } }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  requesterA = requesters[0].id;
  email = requesters[0].email;
  requesterB = requesters[1].id;
  categoryId = category.id;
  relatedSystemId = relatedSystem.id;
  agent = await requesterSession(requesters[0].email);
  await prisma.ticket.createMany({
    data: [
      { ticketNumber: "TKT-20990101-OWNERA001", requesterId: requesterA, requesterUserId: requesters[0].migratedUser!.id, categoryId, relatedSystemId, summary: "Requester A searchable Ticket", description: "A sufficiently detailed Ticket description for the first requester.", requestedPriority: "HIGH" },
      { ticketNumber: "TKT-20990101-OWNERB001", requesterId: requesterB, requesterUserId: requesters[1].migratedUser!.id, categoryId, relatedSystemId, summary: "Requester B private Ticket", description: "A sufficiently detailed Ticket description for the second requester.", requestedPriority: "LOW" },
    ],
    skipDuplicates: true,
  });
  await prisma.ticket.update({ where: { ticketNumber: "TKT-20990101-OWNERA001" }, data: { requesterUserId: requesters[0].migratedUser!.id } });
  await prisma.ticket.update({ where: { ticketNumber: "TKT-20990101-OWNERB001" }, data: { requesterUserId: requesters[1].migratedUser!.id } });
});
afterAll(async () => { if (email) await restoreRequesterSession(email); });

describe("GET /api/tickets", () => {
  it("returns only the selected Requester's Tickets with documented query controls", async () => {
    const response = await agent
      .get("/api/tickets")
      .query({ search: "searchable", categoryId, requestedPriority: "HIGH", currentStatus: "NEW", sortBy: "ticketNumber", sortOrder: "asc", page: 1, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, totalItems: expect.any(Number), totalPages: expect.any(Number) });
    expect(response.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ requesterId: requesterA, ticketNumber: "TKT-20990101-OWNERA001", category: expect.objectContaining({ id: categoryId }) })]));
    expect(response.body.items.every((ticket: { requesterId: number }) => ticket.requesterId === requesterA)).toBe(true);
  });

  it("returns a safe 400 for invalid list query values", async () => {
    const response = await agent
      .get("/api/tickets")
      .query({ page: 0, pageSize: 15, sortBy: "owner", currentStatus: "CLOSED" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "One or more list query values are invalid." });
  });
});
