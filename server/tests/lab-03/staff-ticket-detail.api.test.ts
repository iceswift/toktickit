import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
let staff: ReturnType<typeof request.agent>;
let admin: ReturnType<typeof request.agent>;
let requester: ReturnType<typeof request.agent>;
let ticketId = 0;

beforeAll(async () => {
  staff = request.agent(app); admin = request.agent(app); requester = request.agent(app);
  await prisma.user.updateMany({ where: { email: { in: ["iris.nattapong@example.test", "narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: false } });
  for (const [agent, email] of [[staff, "iris.nattapong@example.test"], [admin, "narin.admin@example.test"], [requester, "amina.rahman@example.test"]] as const) expect((await agent.post("/auth/login").send({ email, password: "Lab3Initial!2026" })).status).toBe(200);
  const [legacyRequester, requesterUser, category, relatedSystem] = await Promise.all([
    prisma.developmentRequester.findUniqueOrThrow({ where: { email: "amina.rahman@example.test" } }), prisma.user.findUniqueOrThrow({ where: { email: "amina.rahman@example.test" } }),
    prisma.category.findFirstOrThrow({ where: { isActive: true } }), prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
  ]);
  const ticket = await prisma.ticket.upsert({ where: { ticketNumber: "TKT-20990102-DETAIL01" }, update: { requesterUserId: requesterUser.id, currentStatus: "NEW", ownerUserId: null, itPriority: "NOT_SET" }, create: { ticketNumber: "TKT-20990102-DETAIL01", requesterId: legacyRequester.id, requesterUserId: requesterUser.id, categoryId: category.id, relatedSystemId: relatedSystem.id, summary: "Staff detail verification", description: "A Ticket used to verify staff Ticket operations.", requestedPriority: "HIGH" } });
  ticketId = ticket.id;
});

afterAll(async () => {
  await prisma.ticket.deleteMany({ where: { id: ticketId } });
  await prisma.user.updateMany({ where: { email: { in: ["iris.nattapong@example.test", "narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: true } });
});

describe("IT Staff Ticket operations", () => {
  it("returns operational detail only to IT Staff and Administrators", async () => {
    expect((await request(app).get(`/staff/tickets/${ticketId}`)).status).toBe(401);
    expect((await requester.get(`/staff/tickets/${ticketId}`)).status).toBe(403);
    expect((await staff.get(`/staff/tickets/${ticketId}`)).body).toEqual(expect.objectContaining({ id: ticketId, publicComments: [], internalNotes: [], attachments: expect.any(Array) }));
  });
  it("allows IT Staff to claim, prioritize, and use legal status transitions", async () => {
    expect((await staff.patch(`/staff/tickets/${ticketId}/owner`).send({ ownerUserId: null })).status).toBe(200);
    expect((await staff.patch(`/staff/tickets/${ticketId}/it-priority`).send({ itPriority: "URGENT" })).body.itPriority).toBe("URGENT");
    expect((await staff.patch(`/staff/tickets/${ticketId}/status`).send({ status: "OPEN" })).body.currentStatus).toBe("OPEN");
    expect((await staff.patch(`/staff/tickets/${ticketId}/status`).send({ status: "CLOSED" })).status).toBe(409);
    expect((await admin.patch(`/staff/tickets/${ticketId}/status`).send({ status: "IN_PROGRESS" })).status).toBe(403);
  });
  it("keeps Notes private and validates append-only communication", async () => {
    expect((await staff.post(`/staff/tickets/${ticketId}/public-comments`).send({ content: "We are investigating this issue." })).status).toBe(201);
    expect((await staff.post(`/staff/tickets/${ticketId}/internal-notes`).send({ content: "Check the device inventory before responding." })).status).toBe(201);
    expect((await staff.post(`/staff/tickets/${ticketId}/internal-notes`).send({ content: "   " })).status).toBe(400);
    expect((await staff.post(`/staff/tickets/${ticketId}/internal-notes`).send({ content: "x".repeat(2001) })).status).toBe(400);
    const detail = await staff.get(`/staff/tickets/${ticketId}`);
    expect(detail.body.publicComments).toHaveLength(1); expect(detail.body.internalNotes).toHaveLength(1);
    expect((await requester.get(`/staff/tickets/${ticketId}/internal-notes`)).status).toBe(403);
  });
});
