import { createHash } from "node:crypto";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const createdSessions = new Map<string, Set<string>>();

/** Create a cookie-preserving agent for requester-route regression tests. */
export async function requesterSession(email: string) {
  await getPrisma().user.update({ where: { email }, data: { mustChangePassword: false } });
  const agent = request.agent(app);
  const response = await agent.post("/auth/login").send({ email, password: "Lab3Initial!2026" });
  if (response.status !== 200) throw new Error(`Unable to create requester test session for ${email}.`);
  const rawCookies: unknown = response.headers["set-cookie"];
  const cookie = (Array.isArray(rawCookies) ? rawCookies : [rawCookies]).find((value): value is string => typeof value === "string" && value.startsWith("toktickit_session="));
  const token = cookie?.split(";", 1)[0].slice("toktickit_session=".length);
  if (!token) throw new Error(`Requester test session cookie was not returned for ${email}.`);
  const hashes = createdSessions.get(email) ?? new Set<string>();
  hashes.add(createHash("sha256").update(decodeURIComponent(token)).digest("hex"));
  createdSessions.set(email, hashes);
  return agent;
}

export async function restoreRequesterSession(email: string) {
  const user = await getPrisma().user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  const hashes = createdSessions.get(email);
  if (hashes?.size) {
    await getPrisma().authSession.updateMany({
      where: { userId: user.id, tokenHash: { in: [...hashes] }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    createdSessions.delete(email);
  }
  await getPrisma().user.update({ where: { id: user.id }, data: { mustChangePassword: true } });
}
