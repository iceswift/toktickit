import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { hash } from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const temporaryEmail = "auth-flow-test@example.test";

afterEach(async () => {
  await getPrisma().user.deleteMany({ where: { email: temporaryEmail } });
});

describe("Lab 3 authentication", () => {
  it("creates a session for a valid active User and revokes it on logout", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/auth/login").send({ email: "amina.rahman@example.test", password: "Lab3Initial!2026" });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ email: "amina.rahman@example.test", role: "REQUESTER", mustChangePassword: true });
    expect(login.headers["set-cookie"]?.[0]).toContain("toktickit_session=");

    const current = await agent.get("/auth/me");
    expect(current.status).toBe(200);
    expect(current.body.user.email).toBe("amina.rahman@example.test");

    expect((await agent.post("/auth/logout")).status).toBe(204);
    expect((await agent.get("/auth/me")).status).toBe(401);
  });

  it("uses the same safe response for invalid credentials and inactive accounts", async () => {
    const invalid = await request(app).post("/auth/login").send({ email: "amina.rahman@example.test", password: "wrong password" });
    const inactive = await request(app).post("/auth/login").send({ email: "beatrice.chen@example.test", password: "Lab3Initial!2026" });
    expect(invalid.status).toBe(401);
    expect(inactive.status).toBe(401);
    expect(invalid.body).toEqual({ error: "Invalid email or password." });
    expect(inactive.body).toEqual(invalid.body);
  });

  it("requires the current password, clears first-login state, and revokes the old session", async () => {
    await getPrisma().user.create({
      data: { name: "Authentication Flow Test", email: temporaryEmail, passwordHash: await hash("Lab3Initial!2026", 12), role: "REQUESTER", mustChangePassword: true },
    });
    const agent = request.agent(app);
    expect((await agent.post("/auth/login").send({ email: temporaryEmail, password: "Lab3Initial!2026" })).status).toBe(200);
    expect((await agent.post("/auth/change-password").send({ currentPassword: "wrong", newPassword: "Replacement!2026", confirmation: "Replacement!2026" })).status).toBe(400);
    expect((await agent.post("/auth/change-password").send({ currentPassword: "Lab3Initial!2026", newPassword: "Replacement!2026", confirmation: "Replacement!2026" })).status).toBe(204);
    expect((await agent.get("/auth/me")).status).toBe(401);
    const relogin = await request(app).post("/auth/login").send({ email: temporaryEmail, password: "Replacement!2026" });
    expect(relogin.status).toBe(200);
    expect(relogin.body.user.mustChangePassword).toBe(false);
  });
});
