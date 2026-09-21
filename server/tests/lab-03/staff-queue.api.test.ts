import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
let staff: ReturnType<typeof request.agent>;
let admin: ReturnType<typeof request.agent>;
let requester: ReturnType<typeof request.agent>;
let ticketIds: number[] = [];

beforeAll(async () => {
  staff = request.agent(app); admin = request.agent(app); requester = request.agent(app);
  await prisma.user.updateMany({ where: { email: { in: ["iris.nattapong@example.test", "narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: false } });
  expect((await staff.post("/auth/login").send({ email: "iris.nattapong@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
  expect((await admin.post("/auth/login").send({ email: "narin.admin@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
  expect((await requester.post("/auth/login").send({ email: "amina.rahman@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
  const [legacyRequester, category, relatedSystem] = await Promise.all([
    prisma.developmentRequester.findUniqueOrThrow({ where: { email: "amina.rahman@example.test" } }),
    prisma.category.findFirstOrThrow({ where: { isActive: true } }), prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
  ]);
  const requesterUser = await prisma.user.findUniqueOrThrow({ where: { email: legacyRequester.email } });
  const tickets = await Promise.all(["Alpha printer offline", "Bravo email outage", "Charlie VPN request"].map((summary, index) => prisma.ticket.upsert({
    where: { ticketNumber: `TKT-20990102-QUEUE00${index}` },
    update: { summary, requesterUserId: requesterUser.id, currentStatus: index === 1 ? "OPEN" : "NEW", itPriority: index === 2 ? "URGENT" : "NOT_SET" },
    create: { ticketNumber: `TKT-20990102-QUEUE00${index}`, requesterId: legacyRequester.id, requesterUserId: requesterUser.id, categoryId: category.id, relatedSystemId: relatedSystem.id, summary, description: "Queue contract verification ticket description.", requestedPriority: "HIGH", currentStatus: index === 1 ? "OPEN" : "NEW", itPriority: index === 2 ? "URGENT" : "NOT_SET" },
  })));
  ticketIds = tickets.map((ticket) => ticket.id);
});

afterAll(async () => {
  await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });
  await prisma.user.updateMany({ where: { email: { in: ["iris.nattapong@example.test", "narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: true } });
});

describe("GET /staff/tickets", () => {
  it("authorizes IT Staff and Administrator but rejects Requesters and anonymous access", async () => {
    expect((await request(app).get("/staff/tickets")).status).toBe(401);
    expect((await requester.get("/staff/tickets")).status).toBe(403);
    expect((await staff.get("/staff/tickets")).status).toBe(200);
    expect((await admin.get("/staff/tickets")).status).toBe(200);
  });
  it("searches, filters, sorts, paginates, and returns queue metadata", async () => {
    const response = await staff.get("/staff/tickets").query({ search: "bravo", status: "OPEN", sortBy: "ticketNumber", sortOrder: "asc", page: 1, pageSize: 10 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
    expect(response.body.items).toEqual([expect.objectContaining({ summary: "Bravo email outage", requesterUser: expect.objectContaining({ name: expect.any(String) }), category: expect.any(Object) })]);
  });
  it("rejects invalid query values and keeps valid no-results requests successful", async () => {
    expect((await staff.get("/staff/tickets").query({ pageSize: 11 })).status).toBe(400);
    expect((await staff.get("/staff/tickets").query({ status: "INVALID" })).status).toBe(400);
    const empty = await staff.get("/staff/tickets").query({ search: "not-a-real-queue-ticket" });
    expect(empty.status).toBe(200); expect(empty.body.items).toEqual([]);
  });
});
