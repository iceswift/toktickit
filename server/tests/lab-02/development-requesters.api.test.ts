import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Retired Lab 2 Development Requester API", () => {
  it("does not publicly enumerate migrated requester identities", async () => {
    const response = await request(app).get("/api/development-requesters");
    expect(response.status).toBe(404);
    expect(response.text).not.toContain("amina.rahman@example.test");
  });
});
