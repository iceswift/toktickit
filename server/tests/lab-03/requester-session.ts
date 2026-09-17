import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

/** Create a cookie-preserving agent for requester-route regression tests. */
export async function requesterSession(email: string) {
  await getPrisma().user.update({ where: { email }, data: { mustChangePassword: false } });
  const agent = request.agent(app);
  const response = await agent.post("/auth/login").send({ email, password: "Lab3Initial!2026" });
  if (response.status !== 200) throw new Error(`Unable to create requester test session for ${email}.`);
  return agent;
}

export async function restoreRequesterSession(email: string) {
  await getPrisma().user.update({ where: { email }, data: { mustChangePassword: true } });
}
