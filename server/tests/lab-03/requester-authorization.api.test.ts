import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { removeStoredAttachment } from "../../src/attachment-storage.js";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "./requester-session.js";

const prisma = getPrisma();
let owner: ReturnType<typeof request.agent>;
let other: ReturnType<typeof request.agent>;
let ticketId: number;
let attachmentId: number;
let ownerLegacyId: number;
let otherLegacyId: number;
let ownerUserId: number;
let mismatchedTicketId: number;
let mismatchedAttachmentId: number;

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.developmentRequester.findUniqueOrThrow({ where: { email: "amina.rahman@example.test" } }),
    prisma.developmentRequester.findUniqueOrThrow({ where: { email: "ben.carter@example.test" } }),
  ]);
  ownerLegacyId = a.id;
  otherLegacyId = b.id;
  ownerUserId = (await prisma.user.findUniqueOrThrow({ where: { email: a.email } })).id;
  owner = await requesterSession(a.email);
  other = await requesterSession(b.email);
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-20990101-AUTHZ001" },
    update: { requesterId: a.id, requesterUserId: (await prisma.user.findUniqueOrThrow({ where: { email: a.email } })).id },
    create: { ticketNumber: "TKT-20990101-AUTHZ001", requesterId: a.id, requesterUserId: (await prisma.user.findUniqueOrThrow({ where: { email: a.email } })).id, categoryId: category.id, relatedSystemId: system.id, summary: "Authorization regression", description: "A private ticket for requester authorization verification.", requestedPriority: "LOW" },
  });
  ticketId = ticket.id;
  const attachment = await prisma.attachment.create({ data: { ticketId, originalFilename: "private.pdf", storageKey: "authorization-fixture", mimeType: "application/pdf", byteSize: 10 } });
  attachmentId = attachment.id;
  const mismatched = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-20990101-MISMATCH" },
    update: { requesterId: b.id, requesterUserId: ownerUserId },
    create: { ticketNumber: "TKT-20990101-MISMATCH", requesterId: b.id, requesterUserId: ownerUserId, categoryId: category.id, relatedSystemId: system.id, summary: "Mismatched ownership regression", description: "The legacy requester and authenticated user deliberately disagree.", requestedPriority: "LOW" },
  });
  mismatchedTicketId = mismatched.id;
});

afterAll(async () => {
  if (mismatchedAttachmentId) {
    const attachment = await prisma.attachment.findUnique({ where: { id: mismatchedAttachmentId }, select: { storageKey: true } });
    if (attachment) {
      await removeStoredAttachment(attachment.storageKey);
      await prisma.attachment.delete({ where: { id: mismatchedAttachmentId } });
    }
  }
  if (mismatchedTicketId) await prisma.ticket.delete({ where: { id: mismatchedTicketId } });
  if (attachmentId) await prisma.attachment.delete({ where: { id: attachmentId } });
  if (ticketId) await prisma.ticket.delete({ where: { id: ticketId } });
  await Promise.all([restoreRequesterSession("amina.rahman@example.test"), restoreRequesterSession("ben.carter@example.test")]);
});

describe("requireRequesterSession authorization boundary", () => {
  it("requires a session and rejects staff or first-login Requesters", async () => {
    expect((await request(app).get("/api/tickets")).status).toBe(401);
    const staff = request.agent(app);
    expect((await staff.post("/auth/login").send({ email: "iris.nattapong@example.test", password: "Lab3Initial!2026" })).status).toBe(200);
    expect((await staff.get("/api/tickets")).status).toBe(403);
    await staff.post("/auth/logout");
    await prisma.user.update({ where: { email: "amina.rahman@example.test" }, data: { mustChangePassword: true } });
    expect((await owner.get("/api/tickets")).status).toBe(403);
    await prisma.user.update({ where: { email: "amina.rahman@example.test" }, data: { mustChangePassword: false } });
    expect((await owner.get("/api/tickets")).status).toBe(200);
  });

  it("ignores a forged requester header and keeps another user's ticket private", async () => {
    const ownerList = await owner.get("/api/tickets").set("X-Development-Requester-Id", String(otherLegacyId));
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.items.every((ticket: { requesterUserId: number }) => ticket.requesterUserId === ownerUserId)).toBe(true);
    const otherDetail = await other.get(`/api/tickets/${ticketId}`).set("X-Development-Requester-Id", String(ownerLegacyId));
    expect(otherDetail.status).toBe(404);
    expect(otherDetail.body).toEqual({ error: "The requested resource was not found." });
  });

  it("rejects unauthenticated writes and hides cross-owner Attachment operations", async () => {
    expect((await request(app).post("/api/tickets").send({})).status).toBe(401);
    expect((await request(app).get(`/api/tickets/${ticketId}/attachments`)).status).toBe(401);
    expect((await request(app).get(`/api/attachments/${attachmentId}/download`)).status).toBe(401);
    expect((await other.get(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerLegacyId))).status).toBe(404);
    expect((await other.post(`/api/tickets/${ticketId}/attachments`).attach("file", Buffer.from("%PDF-1.4\n%%EOF"), { filename: "new.pdf", contentType: "application/pdf" })).status).toBe(404);
    expect((await other.get(`/api/attachments/${attachmentId}/download`).set("X-Development-Requester-Id", String(ownerLegacyId))).status).toBe(404);
    expect((await other.delete(`/api/attachments/${attachmentId}`).send({ reason: "Not my file" })).status).toBe(404);
    expect((await prisma.attachment.findUniqueOrThrow({ where: { id: attachmentId } })).removedAt).toBeNull();
  });

  it("authorizes through requesterUserId even when the legacy requesterId belongs to someone else", async () => {
    const ownerList = await owner.get("/api/tickets").query({ search: "TKT-20990101-MISMATCH" });
    const otherList = await other.get("/api/tickets").query({ search: "TKT-20990101-MISMATCH" });
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: mismatchedTicketId, requesterId: otherLegacyId, requesterUserId: ownerUserId })]));
    expect(otherList.status).toBe(200);
    expect(otherList.body.items).toEqual([]);
    expect((await owner.get(`/api/tickets/${mismatchedTicketId}`)).status).toBe(200);
    expect((await other.get(`/api/tickets/${mismatchedTicketId}`)).status).toBe(404);

    const bytes = Buffer.from("%PDF-1.4\nAuthenticated ownership regression\n%%EOF");
    expect((await other.post(`/api/tickets/${mismatchedTicketId}/attachments`).attach("file", bytes, { filename: "denied.pdf", contentType: "application/pdf" })).status).toBe(404);
    const uploaded = await owner.post(`/api/tickets/${mismatchedTicketId}/attachments`).attach("file", bytes, { filename: "owned.pdf", contentType: "application/pdf" });
    expect(uploaded.status).toBe(201);
    mismatchedAttachmentId = uploaded.body.id;
    expect((await owner.get(`/api/tickets/${mismatchedTicketId}/attachments`)).status).toBe(200);
    expect((await other.get(`/api/tickets/${mismatchedTicketId}/attachments`)).status).toBe(404);
    expect((await owner.get(`/api/attachments/${mismatchedAttachmentId}/download`)).status).toBe(200);
    expect((await other.get(`/api/attachments/${mismatchedAttachmentId}/download`)).status).toBe(404);
    expect((await other.delete(`/api/attachments/${mismatchedAttachmentId}`).send({ reason: "Wrong legacy owner" })).status).toBe(404);
    expect((await owner.delete(`/api/attachments/${mismatchedAttachmentId}`).send({ reason: "Authenticated owner cleanup" })).status).toBe(204);
    const removed = await prisma.attachment.findUniqueOrThrow({ where: { id: mismatchedAttachmentId } });
    expect(removed.removedByUserId).toBe(ownerUserId);
    expect(removed.removedByRequesterId).toBe(ownerLegacyId);
  });
});
