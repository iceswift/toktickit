import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "../lab-03/requester-session.js";

let ownerId: number;
let otherRequesterId: number;
let detailTicketId: number;
let ownerAgent: ReturnType<typeof request.agent>;
let otherAgent: ReturnType<typeof request.agent>;
let emails: string[] = [];

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, include: { migratedUser: { select: { id: true } } }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  ownerId = requesters[0].id;
  otherRequesterId = requesters[1].id;
  emails = requesters.map((requester) => requester.email);
  ownerAgent = await requesterSession(emails[0]);
  otherAgent = await requesterSession(emails[1]);
  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-20990101-DETAIL001" },
    update: { requesterId: ownerId, requesterUserId: requesters[0].migratedUser!.id, categoryId: category.id, relatedSystemId: relatedSystem.id },
    create: {
      ticketNumber: "TKT-20990101-DETAIL001", requesterId: ownerId, requesterUserId: requesters[0].migratedUser!.id, categoryId: category.id, relatedSystemId: relatedSystem.id,
      summary: "Requester-owned Ticket detail", description: "A sufficiently detailed description for a requester-owned Ticket detail test.", requestedPriority: "MEDIUM",
    },
  });
  detailTicketId = ticket.id;
});
afterAll(async () => { const prisma = getPrisma(); await prisma.publicComment.deleteMany({ where: { ticketId: detailTicketId, content: "The workaround helped me." } }); await prisma.ticket.update({ where: { id: detailTicketId }, data: { problemAppearsResolvedAt: null } }); await Promise.all(emails.map(restoreRequesterSession)); });

describe("GET /api/tickets/:ticketId", () => {
  it("returns the full read-only Ticket detail for its owner", async () => {
    const response = await ownerAgent.get(`/api/tickets/${detailTicketId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: detailTicketId, requesterId: ownerId, ticketNumber: "TKT-20990101-DETAIL001",
      category: { id: expect.any(Number), name: expect.any(String) },
      relatedSystem: { id: expect.any(Number), name: expect.any(String) }, attachments: expect.any(Array), publicComments: expect.any(Array), problemAppearsResolvedAt: null,
    });
  });

  it("allows only the owner to add Public Comments and record a non-final resolution indication", async () => {
    const comment = await ownerAgent.post(`/api/tickets/${detailTicketId}/public-comments`).send({ content: "The workaround helped me." });
    expect(comment.status).toBe(201); expect(comment.body).toMatchObject({ content: "The workaround helped me.", author: { id: expect.any(Number), role: "REQUESTER" } });
    expect((await otherAgent.post(`/api/tickets/${detailTicketId}/public-comments`).send({ content: "Not my Ticket" })).status).toBe(404);
    expect((await ownerAgent.post(`/api/tickets/${detailTicketId}/public-comments`).send({ content: " " })).status).toBe(400);
    const indication = await ownerAgent.patch(`/api/tickets/${detailTicketId}/problem-appears-resolved`).send({ appearsResolved: true });
    expect(indication.status).toBe(200); expect(indication.body.problemAppearsResolvedAt).toEqual(expect.any(String)); expect(indication.body.currentStatus).toBe("NEW");
    expect((await otherAgent.patch(`/api/tickets/${detailTicketId}/problem-appears-resolved`).send({ appearsResolved: true })).status).toBe(404);
  });

  it("uses the same safe 404 response for another Requester, invalid IDs, and missing Tickets", async () => {
    const expected = { error: "The requested resource was not found." };
    const otherRequester = await otherAgent.get(`/api/tickets/${detailTicketId}`);
    const invalidId = await ownerAgent.get("/api/tickets/not-a-ticket");
    const missing = await ownerAgent.get("/api/tickets/999999999");

    expect(otherRequester.status).toBe(404); expect(otherRequester.body).toEqual(expected);
    expect(invalidId.status).toBe(404); expect(invalidId.body).toEqual(expected);
    expect(missing.status).toBe(404); expect(missing.body).toEqual(expected);
  });
});
