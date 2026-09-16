import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { app } from "../../src/app.js";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Lab 3 user migration and seed regression", () => {
  it("keeps every legacy DevelopmentRequester mapped to exactly one Requester User", async () => {
    const legacyRequesters = await prisma.developmentRequester.findMany({
      orderBy: { id: "asc" },
      include: { migratedUser: true },
    });

    expect(legacyRequesters).toHaveLength(5);
    for (const legacyRequester of legacyRequesters) {
      expect(legacyRequester.migratedUser).not.toBeNull();
      expect(legacyRequester.migratedUser?.role).toBe("REQUESTER");
      expect(legacyRequester.migratedUser?.email).toBe(legacyRequester.email.toLowerCase());
      expect(legacyRequester.migratedUser?.isActive).toBe(legacyRequester.isActive);
    }
  });

  it("creates the required active and inactive role seed accounts without plaintext passwords", async () => {
    const groups = await prisma.user.groupBy({
      by: ["role", "isActive"],
      _count: { _all: true },
    });
    const count = (role: string, isActive: boolean) =>
      groups.find((group) => group.role === role && group.isActive === isActive)?._count._all ?? 0;

    expect(count("REQUESTER", true)).toBeGreaterThanOrEqual(4);
    expect(count("REQUESTER", false)).toBeGreaterThanOrEqual(1);
    expect(count("IT_STAFF", true)).toBeGreaterThanOrEqual(3);
    expect(count("IT_STAFF", false)).toBeGreaterThanOrEqual(1);
    expect(count("ADMINISTRATOR", true)).toBeGreaterThanOrEqual(1);

    const seededUser = await prisma.user.findUniqueOrThrow({
      where: { email: "amina.rahman@example.test" },
      select: { passwordHash: true, mustChangePassword: true },
    });
    expect(seededUser.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(seededUser.passwordHash).not.toContain("Lab3Initial!2026");
    expect(seededUser.mustChangePassword).toBe(true);
  });

  it("dual-writes a legacy requester Ticket to its migrated User during the transition", async () => {
    const requester = await prisma.developmentRequester.findFirstOrThrow({
      where: { isActive: true },
      include: { migratedUser: { select: { id: true } } },
    });
    const [category, relatedSystem] = await Promise.all([
      prisma.category.findFirstOrThrow({ where: { isActive: true } }),
      prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
    ]);

    const response = await request(app)
      .post("/api/tickets")
      .set("X-Development-Requester-Id", String(requester.id))
      .send({
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Migration dual-write verification",
        requestedPriority: "MEDIUM",
        description: "This Ticket verifies that the transition keeps the legacy requester and mapped User together.",
      })
      .expect(201);

    const createdTicket = await prisma.ticket.findUniqueOrThrow({
      where: { id: response.body.id },
      select: { requesterId: true, requesterUserId: true },
    });
    expect(createdTicket.requesterId).toBe(requester.id);
    expect(createdTicket.requesterUserId).toBe(requester.migratedUser?.id);

    await prisma.ticket.delete({ where: { id: response.body.id } });
  });
});
