import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./ticket-number.js";
import { isPermittedAttachment, MAX_ATTACHMENT_BYTES, readStoredAttachment, removeStoredAttachment, storeAttachment } from "./attachment-storage.js";

// Export the Express app separately from app.listen() so Supertest can use it.
export const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 } });
const notFoundMessage = { error: "The requested resource was not found." };

function parseRequesterOrResourceId(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function attachmentMetadata(attachment: { id: number; originalFilename: string; mimeType: string; byteSize: number; uploadedAt: Date; removedAt: Date | null; removalReason: string | null }) {
  return {
    id: attachment.id,
    originalFilename: attachment.originalFilename,
    mimeType: attachment.mimeType,
    byteSize: attachment.byteSize,
    uploadedAt: attachment.uploadedAt,
    removedAt: attachment.removedAt,
    removalReason: attachment.removalReason,
  };
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Unable to retrieve categories." });
  }
});

app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    res.status(200).json(systems);
  } catch {
    res.status(500).json({ error: "Unable to retrieve related systems." });
  }
});

app.get("/api/development-requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().developmentRequester.findMany({
      where: { isActive: true },
      select: { id: true, displayName: true, email: true },
      orderBy: { displayName: "asc" },
    });

    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Unable to retrieve development requesters." });
  }
});

const priorities = new Set(["LOW", "MEDIUM", "HIGH"]);
const ticketSortFields = new Set(["createdAt", "updatedAt", "ticketNumber", "requestedPriority"]);
const ticketStatuses = new Set(["NEW"]);

function getFields(body: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!body || typeof body !== "object") return { form: "A ticket payload is required." };

  const value = body as Record<string, unknown>;
  if (!Number.isInteger(value.categoryId) || Number(value.categoryId) <= 0) fields.categoryId = "Choose an active category.";
  if (!Number.isInteger(value.relatedSystemId) || Number(value.relatedSystemId) <= 0) fields.relatedSystemId = "Choose an active related system.";
  if (typeof value.summary !== "string" || value.summary.trim().length < 5 || value.summary.trim().length > 120) fields.summary = "Summary must be 5 to 120 characters.";
  if (typeof value.requestedPriority !== "string" || !priorities.has(value.requestedPriority)) fields.requestedPriority = "Choose LOW, MEDIUM, or HIGH priority.";
  if (typeof value.description !== "string" || value.description.trim().length < 10 || value.description.trim().length > 2000) fields.description = "Description must be 10 to 2,000 characters.";

  return fields;
}

app.post("/api/tickets", async (req: Request, res: Response) => {
  const requesterId = Number(req.header("X-Development-Requester-Id"));
  const fields = getFields(req.body);
  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: "Please correct the highlighted fields.", fields });
    return;
  }

  const body = req.body as {
    categoryId: number;
    relatedSystemId: number;
    summary: string;
    requestedPriority: "LOW" | "MEDIUM" | "HIGH";
    description: string;
  };

  try {
    const prisma = getPrisma();
    const [requester, category, relatedSystem] = await Promise.all([
      prisma.developmentRequester.findFirst({ where: { id: requesterId, isActive: true }, select: { id: true } }),
      prisma.category.findFirst({ where: { id: body.categoryId, isActive: true }, select: { id: true } }),
      prisma.relatedSystem.findFirst({ where: { id: body.relatedSystemId, isActive: true }, select: { id: true } }),
    ]);

    if (!requester || !category || !relatedSystem) {
      res.status(404).json({ error: "The selected requester or reference data is unavailable." });
      return;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber: generateTicketNumber(),
            requesterId: requester.id,
            categoryId: category.id,
            relatedSystemId: relatedSystem.id,
            summary: body.summary.trim(),
            description: body.description.trim(),
            requestedPriority: body.requestedPriority,
          },
        });
        res.status(201).json(ticket);
        return;
      } catch (error: unknown) {
        const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined;
        if (code !== "P2002" || attempt === 2) break;
      }
    }

    res.status(409).json({ error: "Unable to allocate a unique Ticket Number. Please try again." });
  } catch {
    res.status(500).json({ error: "Unable to complete the request." });
  }
});

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

app.get("/api/tickets", async (req: Request, res: Response) => {
  const requesterId = Number(req.header("X-Development-Requester-Id"));
  const query = req.query;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const categoryId = query.categoryId === undefined ? undefined : parsePositiveInteger(query.categoryId);
  const page = query.page === undefined ? 1 : parsePositiveInteger(query.page);
  const pageSize = query.pageSize === undefined ? 10 : parsePositiveInteger(query.pageSize);
  const sortBy = query.sortBy === undefined ? "createdAt" : query.sortBy;
  const sortOrder = query.sortOrder === undefined ? "desc" : query.sortOrder;
  const requestedPriority = query.requestedPriority;
  const currentStatus = query.currentStatus;

  const invalid =
    (query.search !== undefined && typeof query.search !== "string") ||
    search.length > 120 ||
    (query.categoryId !== undefined && categoryId === undefined) ||
    page === undefined ||
    pageSize === undefined ||
    ![10, 20, 50].includes(pageSize) ||
    typeof sortBy !== "string" || !ticketSortFields.has(sortBy) ||
    typeof sortOrder !== "string" || !["asc", "desc"].includes(sortOrder) ||
    (requestedPriority !== undefined && (typeof requestedPriority !== "string" || !priorities.has(requestedPriority))) ||
    (currentStatus !== undefined && (typeof currentStatus !== "string" || !ticketStatuses.has(currentStatus)));

  if (invalid) {
    res.status(400).json({ error: "One or more list query values are invalid." });
    return;
  }

  try {
    const prisma = getPrisma();
    const requester = await prisma.developmentRequester.findFirst({ where: { id: requesterId, isActive: true }, select: { id: true } });
    if (!requester) {
      res.status(404).json({ error: "The requested resource was not found." });
      return;
    }

    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });
      if (!category) {
        res.status(400).json({ error: "One or more list query values are invalid." });
        return;
      }
    }

    const where = {
      requesterId: requester.id,
      ...(categoryId === undefined ? {} : { categoryId }),
      ...(requestedPriority === undefined ? {} : { requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH" }),
      ...(currentStatus === undefined ? {} : { currentStatus: currentStatus as "NEW" }),
      ...(search === "" ? {} : {
        OR: [
          { ticketNumber: { contains: search, mode: "insensitive" as const } },
          { summary: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };
    const totalItems = await prisma.ticket.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const items = await prisma.ticket.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ [sortBy]: sortOrder }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.status(200).json({ items, page, pageSize, totalItems, totalPages });
  } catch {
    res.status(500).json({ error: "Unable to retrieve Tickets." });
  }
});

app.get("/api/tickets/:ticketId", async (req: Request, res: Response) => {
  const requesterId = parseRequesterOrResourceId(req.header("X-Development-Requester-Id"));
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterId || !ticketId) {
    res.status(404).json(notFoundMessage);
    return;
  }

  try {
    const prisma = getPrisma();
    const requester = await prisma.developmentRequester.findFirst({ where: { id: requesterId, isActive: true }, select: { id: true } });
    if (!requester) {
      res.status(404).json(notFoundMessage);
      return;
    }
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, requesterId: requester.id },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: { orderBy: { uploadedAt: "asc" }, select: { id: true, originalFilename: true, mimeType: true, byteSize: true, uploadedAt: true, removedAt: true, removalReason: true } },
      },
    });
    if (!ticket) {
      res.status(404).json(notFoundMessage);
      return;
    }
    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: "Unable to retrieve the Ticket." });
  }
});

app.post("/api/tickets/:ticketId/attachments", upload.single("file"), async (req: Request, res: Response) => {
  const requesterId = parseRequesterOrResourceId(req.header("X-Development-Requester-Id"));
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterId || !ticketId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Choose one attachment file." });
    return;
  }
  if (!isPermittedAttachment(req.file)) {
    res.status(415).json({ error: "Only JPG, PNG, WEBP, and PDF files are supported." });
    return;
  }

  let storageKey: string | null = null;
  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterId, requester: { isActive: true } }, select: { id: true } });
    if (!ticket) {
      res.status(404).json(notFoundMessage);
      return;
    }
    const activeCount = await prisma.attachment.count({ where: { ticketId: ticket.id, removedAt: null } });
    if (activeCount >= 5) {
      res.status(409).json({ error: "A Ticket may have at most five active attachments." });
      return;
    }
    storageKey = await storeAttachment(req.file.buffer, req.file.originalname);
    const attachment = await prisma.attachment.create({ data: { ticketId: ticket.id, originalFilename: req.file.originalname, storageKey, mimeType: req.file.mimetype, byteSize: req.file.size } });
    res.status(201).json(attachmentMetadata(attachment));
  } catch {
    if (storageKey) await removeStoredAttachment(storageKey).catch(() => undefined);
    res.status(500).json({ error: "Unable to complete the request." });
  }
});

app.get("/api/tickets/:ticketId/attachments", async (req: Request, res: Response) => {
  const requesterId = parseRequesterOrResourceId(req.header("X-Development-Requester-Id"));
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterId || !ticketId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterId, requester: { isActive: true } }, select: { id: true } });
    if (!ticket) {
      res.status(404).json(notFoundMessage);
      return;
    }
    const attachments = await prisma.attachment.findMany({ where: { ticketId: ticket.id }, orderBy: { uploadedAt: "asc" }, select: { id: true, originalFilename: true, mimeType: true, byteSize: true, uploadedAt: true, removedAt: true, removalReason: true } });
    res.status(200).json(attachments.map(attachmentMetadata));
  } catch {
    res.status(500).json({ error: "Unable to complete the request." });
  }
});

app.get("/api/attachments/:attachmentId/download", async (req: Request, res: Response) => {
  const requesterId = parseRequesterOrResourceId(req.header("X-Development-Requester-Id"));
  const attachmentId = parseRequesterOrResourceId(req.params.attachmentId);
  if (!requesterId || !attachmentId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, removedAt: null, ticket: { requesterId, requester: { isActive: true } } } });
    if (!attachment) {
      res.status(404).json(notFoundMessage);
      return;
    }
    const bytes = await readStoredAttachment(attachment.storageKey).catch(() => null);
    if (!bytes) {
      res.status(404).json(notFoundMessage);
      return;
    }
    res.status(200).type(attachment.mimeType).set("Content-Disposition", `attachment; filename="${attachment.originalFilename.replace(/[\\\"]/g, "_")}"`).send(bytes);
  } catch {
    res.status(500).json({ error: "Unable to complete the request." });
  }
});

app.delete("/api/attachments/:attachmentId", async (req: Request, res: Response) => {
  const requesterId = parseRequesterOrResourceId(req.header("X-Development-Requester-Id"));
  const attachmentId = parseRequesterOrResourceId(req.params.attachmentId);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!requesterId || !attachmentId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  if (reason.length < 5 || reason.length > 250) {
    res.status(400).json({ error: "Removal reason must be 5 to 250 characters." });
    return;
  }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, removedAt: null, ticket: { requesterId, requester: { isActive: true } } }, select: { id: true } });
    if (!attachment) {
      res.status(404).json(notFoundMessage);
      return;
    }
    await getPrisma().attachment.update({ where: { id: attachment.id }, data: { removedAt: new Date(), removalReason: reason, removedByRequesterId: requesterId } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Unable to complete the request." });
  }
});

app.use((error: unknown, _req: Request, res: Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Attachment files must be 5 MB or smaller." });
    return;
  }
  next(error);
});

export default app;
