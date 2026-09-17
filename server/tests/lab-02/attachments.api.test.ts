import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { removeStoredAttachment } from "../../src/attachment-storage.js";
import { getPrisma } from "../../src/prisma.js";
import { requesterSession, restoreRequesterSession } from "../lab-03/requester-session.js";

let ownerId: number;
let otherRequesterId: number;
let ticketId: number;
let attachmentId: number;
let ownerAgent: ReturnType<typeof request.agent>;
let otherAgent: ReturnType<typeof request.agent>;
let emails: string[] = [];
const pdfBytes = Buffer.from("%PDF-1.4\nTokTickIT attachment test\n%%EOF");

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  ownerId = requesters[0].id;
  otherRequesterId = requesters[1].id;
  emails = requesters.map((requester) => requester.email);
  ownerAgent = await requesterSession(emails[0]);
  otherAgent = await requesterSession(emails[1]);
  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-20990101-ATTACH001" },
    update: { requesterId: ownerId, categoryId: category.id, relatedSystemId: relatedSystem.id },
    create: { ticketNumber: "TKT-20990101-ATTACH001", requesterId: ownerId, categoryId: category.id, relatedSystemId: relatedSystem.id, summary: "Attachment lifecycle API test", description: "A sufficiently detailed Ticket description for Attachment lifecycle API tests.", requestedPriority: "LOW" },
  });
  ticketId = ticket.id;
  const existing = await prisma.attachment.findMany({ where: { ticketId }, select: { storageKey: true } });
  await Promise.all(existing.map((attachment) => removeStoredAttachment(attachment.storageKey)));
  await prisma.attachment.deleteMany({ where: { ticketId } });
});

afterAll(async () => {
  const prisma = getPrisma();
  const attachments = await prisma.attachment.findMany({ where: { ticketId }, select: { storageKey: true } });
  await Promise.all(attachments.map((attachment) => removeStoredAttachment(attachment.storageKey)));
  await prisma.attachment.deleteMany({ where: { ticketId } });
  await Promise.all(emails.map(restoreRequesterSession));
});

describe("Attachment lifecycle APIs", () => {
  it("rejects a missing file and a file whose MIME content does not match an allowed type", async () => {
    const missing = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`);
    const fakePng = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", Buffer.from("not an image"), { filename: "fake.png", contentType: "image/png" });
    expect(missing.status).toBe(400);
    expect(fakePng.status).toBe(415);
  });

  it("rejects an attachment larger than 5 MB", async () => {
    const oversizedPdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(5 * 1024 * 1024)]);
    const response = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", oversizedPdf, { filename: "oversized.pdf", contentType: "application/pdf" });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Attachment files must be 5 MB or smaller." });
  });

  it("stores, lists, downloads, then soft-removes an owned permitted Attachment", async () => {
    const uploaded = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", pdfBytes, { filename: "evidence.pdf", contentType: "application/pdf" });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body).toMatchObject({ originalFilename: "evidence.pdf", mimeType: "application/pdf", removedAt: null });
    expect(uploaded.body.storageKey).toBeUndefined();
    attachmentId = uploaded.body.id;

    const listed = await ownerAgent.get(`/api/tickets/${ticketId}/attachments`);
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: attachmentId, removedAt: null })]));

    const downloaded = await ownerAgent.get(`/api/attachments/${attachmentId}/download`);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers["content-type"]).toContain("application/pdf");

    const removed = await ownerAgent.delete(`/api/attachments/${attachmentId}`).send({ reason: "Evidence is no longer relevant." });
    expect(removed.status).toBe(204);
    const afterRemoval = await ownerAgent.get(`/api/tickets/${ticketId}/attachments`);
    expect(afterRemoval.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: attachmentId, removalReason: "Evidence is no longer relevant." })]));
    const blockedDownload = await ownerAgent.get(`/api/attachments/${attachmentId}/download`);
    expect(blockedDownload.status).toBe(404);
  });

  it("uses a safe 404 for cross-requester Attachment access", async () => {
    const uploaded = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", pdfBytes, { filename: "private.pdf", contentType: "application/pdf" });
    const privateAttachmentId = uploaded.body.id as number;
    const list = await otherAgent.get(`/api/tickets/${ticketId}/attachments`);
    const download = await otherAgent.get(`/api/attachments/${privateAttachmentId}/download`);
    const removal = await otherAgent.delete(`/api/attachments/${privateAttachmentId}`).send({ reason: "Not the owner." });
    expect(list.status).toBe(404); expect(list.body).toEqual({ error: "The requested resource was not found." });
    expect(download.status).toBe(404); expect(download.body).toEqual({ error: "The requested resource was not found." });
    expect(removal.status).toBe(404); expect(removal.body).toEqual({ error: "The requested resource was not found." });
    await ownerAgent.delete(`/api/attachments/${privateAttachmentId}`).send({ reason: "Clean up private test evidence." });
  });

  it("rejects a sixth active attachment", async () => {
    for (let index = 0; index < 5; index += 1) {
      const upload = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", pdfBytes, { filename: `evidence-${index}.pdf`, contentType: "application/pdf" });
      expect(upload.status).toBe(201);
    }
    const sixth = await ownerAgent.post(`/api/tickets/${ticketId}/attachments`).attach("file", pdfBytes, { filename: "sixth.pdf", contentType: "application/pdf" });
    expect(sixth.status).toBe(409);
  });
});
