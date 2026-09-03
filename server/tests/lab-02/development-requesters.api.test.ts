import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/development-requesters", () => {
  it("returns active requesters with the documented public fields", async () => {
    const response = await request(app).get("/api/development-requesters");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(4);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(Number), displayName: expect.any(String), email: expect.any(String) }),
    ]));
    expect(response.body).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ email: "former.requester@example.test" }),
    ]));
  });
});
