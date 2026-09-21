import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { getPrisma } from "./prisma.js";

const COOKIE_NAME = "toktickit_session";
const SESSION_HOURS = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;
const failures = new Map<string, number[]>();

export type AuthenticatedUser = { id: number; name: string; email: string; role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR"; mustChangePassword: boolean };

function cookieToken(req: Request): string | null {
  const match = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : null;
}
function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }
function sourceKey(req: Request, email: string) { return `${email}|${req.ip}`; }
function failureAllowed(key: string) {
  const now = Date.now(); const recent = (failures.get(key) ?? []).filter((time) => now - time < 15 * 60_000);
  failures.set(key, recent); return recent.length < 5;
}
function recordFailure(key: string) { failures.set(key, [...(failures.get(key) ?? []), Date.now()]); }
function sessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_HOURS * 60 * 60 * 1000, path: "/" });
}
export function clearSessionCookie(res: Response) { res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" }); }

export async function currentUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = cookieToken(req); if (!token) return null;
  const session = await getPrisma().authSession.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;
  const { id, name, email, role, mustChangePassword } = session.user;
  return { id, name, email, role, mustChangePassword };
}

export async function login(req: Request, res: Response) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const key = sourceKey(req, email);
  if (!email || !password || !failureAllowed(key)) return res.status(401).json({ error: "Invalid email or password." });
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.isActive || !(await compare(password, user.passwordHash))) { recordFailure(key); return res.status(401).json({ error: "Invalid email or password." }); }
  failures.delete(key);
  const token = randomBytes(32).toString("base64url");
  await getPrisma().authSession.create({ data: { tokenHash: digest(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000) } });
  sessionCookie(res, token);
  return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
}

export async function logout(req: Request, res: Response) {
  const token = cookieToken(req); if (token) await getPrisma().authSession.updateMany({ where: { tokenHash: digest(token), revokedAt: null }, data: { revokedAt: new Date() } });
  clearSessionCookie(res); return res.status(204).send();
}

export async function changePassword(req: Request, res: Response) {
  const user = await currentUser(req); if (!user) return res.status(401).json({ error: "Authentication is required." });
  const { currentPassword, newPassword, confirmation } = req.body ?? {};
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmation !== "string" || newPassword !== confirmation || !PASSWORD_PATTERN.test(newPassword)) return res.status(400).json({ error: "Password requirements are not met." });
  const account = await getPrisma().user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await compare(currentPassword, account.passwordHash))) return res.status(400).json({ error: "Password requirements are not met." });
  await getPrisma().$transaction([
    getPrisma().user.update({ where: { id: user.id }, data: { passwordHash: await hash(newPassword, 12), mustChangePassword: false } }),
    getPrisma().authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  clearSessionCookie(res); return res.status(204).send();
}
