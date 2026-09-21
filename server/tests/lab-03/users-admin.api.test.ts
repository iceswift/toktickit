import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const testEmail = "phase7.user@example.test";
let admin: ReturnType<typeof request.agent>;
let requester: ReturnType<typeof request.agent>;

beforeAll(async () => {
  admin = request.agent(app); requester = request.agent(app);
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.user.updateMany({ where: { email: { in: ["narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: false } });
  expect((await admin.post("/auth/login").send({ email: "narin.admin@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
  expect((await requester.post("/auth/login").send({ email: "amina.rahman@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.user.updateMany({ where: { email: { in: ["narin.admin@example.test", "amina.rahman@example.test"] } }, data: { mustChangePassword: true } });
});

describe("Administrator user management", () => {
  it("rejects anonymous and non-administrator access", async () => {
    expect((await request(app).get("/admin/users")).status).toBe(401);
    expect((await requester.get("/admin/users")).status).toBe(403);
  });

  it("creates, searches, edits, and resets a managed user", async () => {
    const created = await admin.post("/admin/users").send({ name: "Phase Seven User", email: testEmail, role: "REQUESTER", active: true, initialPassword: "Phase7Initial!2026" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ email: testEmail, role: "REQUESTER", isActive: true, mustChangePassword: true });

    const listed = await admin.get("/admin/users").query({ search: "phase seven", role: "REQUESTER" });
    expect(listed.status).toBe(200); expect(listed.body).toEqual([expect.objectContaining({ id: created.body.id, email: testEmail })]);

    const edited = await admin.patch(`/admin/users/${created.body.id}`).send({ name: "Phase Seven Staff", email: testEmail, role: "IT_STAFF", active: false });
    expect(edited.status).toBe(200); expect(edited.body).toMatchObject({ role: "IT_STAFF", isActive: false });
    expect((await admin.post(`/admin/users/${created.body.id}/initial-password`).send({ initialPassword: "Replacement!2026" })).status).toBe(204);
  });

  it("rejects invalid roles, weak passwords, and duplicate email addresses", async () => {
    expect((await admin.post("/admin/users").send({ name: "Invalid Role", email: "invalid-role@example.test", role: "OWNER", active: true, initialPassword: "Phase7Initial!2026" })).status).toBe(400);
    expect((await admin.post("/admin/users").send({ name: "Weak Password", email: "weak@example.test", role: "REQUESTER", active: true, initialPassword: "weak" })).status).toBe(400);
    expect((await admin.post("/admin/users").send({ name: "Duplicate", email: "narin.admin@example.test", role: "REQUESTER", active: true, initialPassword: "Phase7Initial!2026" })).status).toBe(409);
  });

  it("prevents an administrator from deactivating their own account", async () => {
    const me = await admin.get("/auth/me");
    const response = await admin.patch(`/admin/users/${me.body.user.id}`).send({ name: me.body.user.name, email: me.body.user.email, role: "ADMINISTRATOR", active: false });
    expect(response.status).toBe(409); expect(response.body.error).toMatch(/cannot deactivate/i);
  });
});
