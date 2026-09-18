import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "../lab-03/requester-session.js";

let requesterId: number;
let categoryId: number;
let relatedSystemId: number;
let agent: ReturnType<typeof request.agent>;
let email: string;

beforeAll(async () => {
  const prisma = getPrisma();
  const requester = await prisma.developmentRequester.findFirstOrThrow({ where: { isActive: true } });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  requesterId = requester.id;
  email = requester.email;
  categoryId = category.id;
  relatedSystemId = relatedSystem.id;
  agent = await requesterSession(requester.email);
});
afterAll(async () => { if (email) await restoreRequesterSession(email); });

describe("POST /api/tickets", () => {
  it("creates a Ticket for the selected requester with backend-generated values", async () => {
    const response = await agent
      .post("/api/tickets")
      .send({
        categoryId,
        relatedSystemId,
        summary: "VPN disconnects during online exam",
        requestedPriority: "HIGH",
        description: "The VPN disconnects after approximately five minutes during the online exam.",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      requesterId,
      categoryId,
      relatedSystemId,
      currentStatus: "NEW",
      itPriority: "NOT_SET",
      requestedPriority: "HIGH",
    });
    expect(response.body.ticketNumber).toMatch(/^TKT-\d{8}-[A-Z0-9]{8}$/);
  });

  it("returns safe field errors and does not create a Ticket for invalid input", async () => {
    const response = await agent
      .post("/api/tickets")
      .send({
        categoryId: 0,
        relatedSystemId: "invalid",
        summary: "  ",
        requestedPriority: "URGENT",
        description: "too short",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: "Please correct the highlighted fields." });
    expect(response.body.fields).toMatchObject({
      categoryId: expect.any(String),
      relatedSystemId: expect.any(String),
      summary: expect.any(String),
      requestedPriority: expect.any(String),
      description: expect.any(String),
    });
  });
});
