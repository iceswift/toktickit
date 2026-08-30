import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

let requesterA: number;
let requesterB: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  requesterA = requesters[0].id;
  requesterB = requesters[1].id;
  categoryId = category.id;
  relatedSystemId = relatedSystem.id;
  await prisma.ticket.createMany({
    data: [
      { ticketNumber: "TKT-20990101-OWNERA001", requesterId: requesterA, categoryId, relatedSystemId, summary: "Requester A searchable Ticket", description: "A sufficiently detailed Ticket description for the first requester.", requestedPriority: "HIGH" },
      { ticketNumber: "TKT-20990101-OWNERB001", requesterId: requesterB, categoryId, relatedSystemId, summary: "Requester B private Ticket", description: "A sufficiently detailed Ticket description for the second requester.", requestedPriority: "LOW" },
    ],
    skipDuplicates: true,
  });
});

describe("GET /api/tickets", () => {
  it("returns only the selected Requester's Tickets with documented query controls", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("X-Development-Requester-Id", String(requesterA))
      .query({ search: "searchable", categoryId, requestedPriority: "HIGH", currentStatus: "NEW", sortBy: "ticketNumber", sortOrder: "asc", page: 1, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, totalItems: expect.any(Number), totalPages: expect.any(Number) });
    expect(response.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ requesterId: requesterA, ticketNumber: "TKT-20990101-OWNERA001", category: expect.objectContaining({ id: categoryId }) })]));
    expect(response.body.items.every((ticket: { requesterId: number }) => ticket.requesterId === requesterA)).toBe(true);
  });

  it("returns a safe 400 for invalid list query values", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("X-Development-Requester-Id", String(requesterA))
      .query({ page: 0, pageSize: 15, sortBy: "owner", currentStatus: "CLOSED" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "One or more list query values are invalid." });
  });
});
