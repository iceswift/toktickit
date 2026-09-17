import { describe, expect, it } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "./requester-session.js";

describe("requesterSession test cleanup", () => {
  it("revokes only the sessions created by the test helper", async () => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirstOrThrow({
      where: { role: "REQUESTER", isActive: true, email: { notIn: ["amina.rahman@example.test", "ben.carter@example.test"] } },
      select: { id: true, email: true },
    });
    const existing = await prisma.authSession.findMany({ where: { userId: user.id }, select: { id: true } });
    const existingIds = new Set(existing.map((session) => session.id));
    try {
      const agent = await requesterSession(user.email);
      expect((await agent.get("/api/tickets")).status).toBe(200);
    } finally {
      await restoreRequesterSession(user.email);
    }
    const created = await prisma.authSession.findMany({
      where: { userId: user.id, id: { notIn: [...existingIds] } },
      select: { revokedAt: true },
    });
    expect(created.length).toBeGreaterThan(0);
    expect(created.every((session) => session.revokedAt !== null)).toBe(true);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).mustChangePassword).toBe(true);
  });
});
