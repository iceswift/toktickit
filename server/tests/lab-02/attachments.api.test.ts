import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { removeStoredAttachment } from "../../src/attachment-storage.js";
import { getPrisma } from "../../src/prisma.js";

let ownerId: number;
let otherRequesterId: number;
let ticketId: number;
let attachmentId: number;
const pdfBytes = Buffer.from("%PDF-1.4\nTokTickIT attachment test\n%%EOF");

beforeAll(async () => {
  const prisma = getPrisma();
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true }, orderBy: { id: "asc" }, take: 2 });
  const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
  const relatedSystem = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });
  ownerId = requesters[0].id;
  otherRequesterId = requesters[1].id;
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
});

describe("Attachment lifecycle APIs", () => {
  it("rejects a missing file and a file whose MIME content does not match an allowed type", async () => {
    const missing = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId));
    const fakePng = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", Buffer.from("not an image"), { filename: "fake.png", contentType: "image/png" });
    expect(missing.status).toBe(400);
    expect(fakePng.status).toBe(415);
  });

  it("rejects an attachment larger than 5 MB", async () => {
    const oversizedPdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(5 * 1024 * 1024)]);
    const response = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", oversizedPdf, { filename: "oversized.pdf", contentType: "application/pdf" });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Attachment files must be 5 MB or smaller." });
  });

  it("stores, lists, downloads, then soft-removes an owned permitted Attachment", async () => {
    const uploaded = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", pdfBytes, { filename: "evidence.pdf", contentType: "application/pdf" });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body).toMatchObject({ originalFilename: "evidence.pdf", mimeType: "application/pdf", removedAt: null });
    expect(uploaded.body.storageKey).toBeUndefined();
    attachmentId = uploaded.body.id;

    const listed = await request(app).get(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId));
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: attachmentId, removedAt: null })]));

    const downloaded = await request(app).get(`/api/attachments/${attachmentId}/download`).set("X-Development-Requester-Id", String(ownerId));
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers["content-type"]).toContain("application/pdf");

    const removed = await request(app).delete(`/api/attachments/${attachmentId}`).set("X-Development-Requester-Id", String(ownerId)).send({ reason: "Evidence is no longer relevant." });
    expect(removed.status).toBe(204);
    const afterRemoval = await request(app).get(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId));
    expect(afterRemoval.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: attachmentId, removalReason: "Evidence is no longer relevant." })]));
    const blockedDownload = await request(app).get(`/api/attachments/${attachmentId}/download`).set("X-Development-Requester-Id", String(ownerId));
    expect(blockedDownload.status).toBe(404);
  });

  it("uses a safe 404 for cross-requester Attachment access", async () => {
    const uploaded = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", pdfBytes, { filename: "private.pdf", contentType: "application/pdf" });
    const privateAttachmentId = uploaded.body.id as number;
    const list = await request(app).get(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(otherRequesterId));
    const download = await request(app).get(`/api/attachments/${privateAttachmentId}/download`).set("X-Development-Requester-Id", String(otherRequesterId));
    const removal = await request(app).delete(`/api/attachments/${privateAttachmentId}`).set("X-Development-Requester-Id", String(otherRequesterId)).send({ reason: "Not the owner." });
    expect(list.status).toBe(404); expect(list.body).toEqual({ error: "The requested resource was not found." });
    expect(download.status).toBe(404); expect(download.body).toEqual({ error: "The requested resource was not found." });
    expect(removal.status).toBe(404); expect(removal.body).toEqual({ error: "The requested resource was not found." });
    await request(app).delete(`/api/attachments/${privateAttachmentId}`).set("X-Development-Requester-Id", String(ownerId)).send({ reason: "Clean up private test evidence." });
  });

  it("rejects a sixth active attachment", async () => {
    for (let index = 0; index < 5; index += 1) {
      const upload = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", pdfBytes, { filename: `evidence-${index}.pdf`, contentType: "application/pdf" });
      expect(upload.status).toBe(201);
    }
    const sixth = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("X-Development-Requester-Id", String(ownerId)).attach("file", pdfBytes, { filename: "sixth.pdf", contentType: "application/pdf" });
    expect(sixth.status).toBe(409);
  });
});
