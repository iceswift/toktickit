import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

let requesterId: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  const prisma = getPrisma();
  const requester = await prisma.developmentRequester.findFirstOrThrow({ where: { isActive: true } });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  requesterId = requester.id;
  categoryId = category.id;
  relatedSystemId = relatedSystem.id;
});

describe("POST /api/tickets", () => {
  it("creates a Ticket for the selected requester with backend-generated values", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Development-Requester-Id", String(requesterId))
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
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Development-Requester-Id", String(requesterId))
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
