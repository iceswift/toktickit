import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

let ownerId: number;
let otherRequesterId: number;
let detailTicketId: number;

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  ownerId = requesters[0].id;
  otherRequesterId = requesters[1].id;
  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-20990101-DETAIL001" },
    update: { requesterId: ownerId, categoryId: category.id, relatedSystemId: relatedSystem.id },
    create: {
      ticketNumber: "TKT-20990101-DETAIL001", requesterId: ownerId, categoryId: category.id, relatedSystemId: relatedSystem.id,
      summary: "Requester-owned Ticket detail", description: "A sufficiently detailed description for a requester-owned Ticket detail test.", requestedPriority: "MEDIUM",
    },
  });
  detailTicketId = ticket.id;
});

describe("GET /api/tickets/:ticketId", () => {
  it("returns the full read-only Ticket detail for its owner", async () => {
    const response = await request(app).get(`/api/tickets/${detailTicketId}`).set("X-Development-Requester-Id", String(ownerId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: detailTicketId, requesterId: ownerId, ticketNumber: "TKT-20990101-DETAIL001",
      category: { id: expect.any(Number), name: expect.any(String) },
      relatedSystem: { id: expect.any(Number), name: expect.any(String) }, attachments: expect.any(Array),
    });
  });

  it("uses the same safe 404 response for another Requester, invalid IDs, and missing Tickets", async () => {
    const expected = { error: "The requested resource was not found." };
    const otherRequester = await request(app).get(`/api/tickets/${detailTicketId}`).set("X-Development-Requester-Id", String(otherRequesterId));
    const invalidId = await request(app).get("/api/tickets/not-a-ticket").set("X-Development-Requester-Id", String(ownerId));
    const missing = await request(app).get("/api/tickets/999999999").set("X-Development-Requester-Id", String(ownerId));

    expect(otherRequester.status).toBe(404); expect(otherRequester.body).toEqual(expected);
    expect(invalidId.status).toBe(404); expect(invalidId.body).toEqual(expected);
    expect(missing.status).toBe(404); expect(missing.body).toEqual(expected);
  });
});
