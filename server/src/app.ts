import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./ticket-number.js";
import { isPermittedAttachment, MAX_ATTACHMENT_BYTES, readStoredAttachment, removeStoredAttachment, storeAttachment } from "./attachment-storage.js";
import { changePassword, currentUser, login, logout } from "./auth.js";
import { requireAdministratorSession, requireRequesterSession, requireStaffQueueSession } from "./requester-session.js";
import { hash } from "bcryptjs";

// Export the Express app separately from app.listen() so Supertest can use it.
export const app = express();

// Authentication uses an HttpOnly cookie. Credentialed browser requests need a
// concrete allowed origin rather than CORS's wildcard default. Vite may use
// either localhost or 127.0.0.1 during local verification.
const clientOrigins = new Set([process.env.CLIENT_ORIGIN ?? "http://localhost:5173", "http://127.0.0.1:5173"]);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || clientOrigins.has(origin)), credentials: true }));
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

app.post("/auth/login", (req, res) => { void login(req, res); });
app.post("/auth/logout", (req, res) => { void logout(req, res); });
app.post("/auth/change-password", (req, res) => { void changePassword(req, res); });
app.get("/auth/me", async (req, res) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: "Authentication is required." });
  return res.status(200).json({ user });
});

app.use(["/api/tickets", "/api/attachments"], requireRequesterSession);
app.use("/staff/tickets", requireStaffQueueSession);
app.use("/admin/users", requireAdministratorSession);

const userRoles = new Set(["REQUESTER", "IT_STAFF", "ADMINISTRATOR"]);
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;
function userPayload(body: unknown, passwordRequired: boolean) {
  const value = body as Record<string, unknown>; const fields: Record<string, string> = {};
  const name = typeof value?.name === "string" ? value.name.trim() : ""; const email = typeof value?.email === "string" ? value.email.trim().toLowerCase() : "";
  if (name.length < 2 || name.length > 120) fields.name = "Name must be 2 to 120 characters.";
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = "Enter a valid email address.";
  if (typeof value?.role !== "string" || !userRoles.has(value.role)) fields.role = "Choose one permitted role.";
  if (typeof value?.active !== "boolean") fields.active = "Choose an account status.";
  const initialPassword = typeof value?.initialPassword === "string" ? value.initialPassword : "";
  if (passwordRequired && !passwordPattern.test(initialPassword)) fields.initialPassword = "Password must be 12-128 characters with upper, lower, number, and symbol.";
  return { fields, name, email, role: value?.role as "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR", active: value?.active as boolean, initialPassword };
}

app.get("/admin/users", async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : ""; const role = req.query.role;
  if (search.length > 120 || (role !== undefined && (typeof role !== "string" || !userRoles.has(role)))) return res.status(400).json({ error: "One or more user query values are invalid." });
  try { return res.status(200).json(await getPrisma().user.findMany({ where: { ...(role ? { role: role as "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR" } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}) }, select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true }, orderBy: { name: "asc" } })); } catch { return res.status(500).json({ error: "Unable to retrieve users." }); }
});

app.post("/admin/users", async (req: Request, res: Response) => {
  const input = userPayload(req.body, true); if (Object.keys(input.fields).length) return res.status(400).json({ error: "Please correct the highlighted fields.", fields: input.fields });
  try { const existing = await getPrisma().user.findUnique({ where: { email: input.email }, select: { id: true } }); if (existing) return res.status(409).json({ error: "That email address is already in use." }); return res.status(201).json(await getPrisma().user.create({ data: { name: input.name, email: input.email, role: input.role, isActive: input.active, passwordHash: await hash(input.initialPassword, 12), mustChangePassword: true }, select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true } })); } catch { return res.status(500).json({ error: "Unable to create the user." }); }
});

app.patch("/admin/users/:userId", async (req: Request, res: Response) => {
  const userId = parseRequesterOrResourceId(req.params.userId); if (!userId) return res.status(404).json(notFoundMessage);
  const input = userPayload(req.body, false); if (Object.keys(input.fields).length) return res.status(400).json({ error: "Please correct the highlighted fields.", fields: input.fields });
  try {
    const prisma = getPrisma(); const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json(notFoundMessage);
    if (input.email !== target.email) { const duplicate = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }); if (duplicate) return res.status(409).json({ error: "That email address is already in use." }); }
    if (target.id === Number(res.locals.administratorUserId) && !input.active) return res.status(409).json({ error: "Administrators cannot deactivate their own account." });
    if (target.role === "ADMINISTRATOR" && target.isActive && (!input.active || input.role !== "ADMINISTRATOR")) { const activeAdmins = await prisma.user.count({ where: { role: "ADMINISTRATOR", isActive: true } }); if (activeAdmins <= 1) return res.status(409).json({ error: "At least one active Administrator must remain." }); }
    return res.status(200).json(await prisma.user.update({ where: { id: userId }, data: { name: input.name, email: input.email, role: input.role, isActive: input.active }, select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true } }));
  } catch { return res.status(500).json({ error: "Unable to update the user." }); }
});

app.post("/admin/users/:userId/initial-password", async (req: Request, res: Response) => {
  const userId = parseRequesterOrResourceId(req.params.userId); const initialPassword = typeof req.body?.initialPassword === "string" ? req.body.initialPassword : "";
  if (!userId) return res.status(404).json(notFoundMessage); if (!passwordPattern.test(initialPassword)) return res.status(400).json({ error: "Password must be 12-128 characters with upper, lower, number, and symbol." });
  try { const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { id: true } }); if (!user) return res.status(404).json(notFoundMessage); await getPrisma().$transaction([getPrisma().user.update({ where: { id: userId }, data: { passwordHash: await hash(initialPassword, 12), mustChangePassword: true } }), getPrisma().authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })]); return res.status(204).send(); } catch { return res.status(500).json({ error: "Unable to reset the initial password." }); }
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

const priorities = new Set(["LOW", "MEDIUM", "HIGH"]);
const ticketSortFields = new Set(["createdAt", "updatedAt", "ticketNumber", "requestedPriority"]);
const ticketStatuses = new Set(["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"]);
const itPriorities = new Set(["NOT_SET", "LOW", "MEDIUM", "HIGH", "URGENT"]);
const staffQueueSortFields = new Set(["updatedAt", "createdAt", "ticketNumber", "currentStatus", "requestedPriority", "itPriority"]);

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
  const requesterUserId = Number(res.locals.requesterUserId);
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
      prisma.developmentRequester.findFirst({
        where: { isActive: true, migratedUser: { is: { id: requesterUserId, isActive: true } } },
        select: { id: true, migratedUser: { select: { id: true } } },
      }),
      prisma.category.findFirst({ where: { id: body.categoryId, isActive: true }, select: { id: true } }),
      prisma.relatedSystem.findFirst({ where: { id: body.relatedSystemId, isActive: true }, select: { id: true } }),
    ]);

    if (!requester || !requester.migratedUser || !category || !relatedSystem) {
      res.status(404).json({ error: "The selected requester or reference data is unavailable." });
      return;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber: generateTicketNumber(),
            requesterId: requester.id,
            requesterUserId,
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

app.get("/staff/tickets", async (req: Request, res: Response) => {
  const query = req.query;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const ownerId = query.ownerId === undefined ? undefined : parsePositiveInteger(query.ownerId);
  const page = query.page === undefined ? 1 : parsePositiveInteger(query.page);
  const pageSize = query.pageSize === undefined ? 10 : parsePositiveInteger(query.pageSize);
  const sortBy = query.sortBy === undefined ? "updatedAt" : query.sortBy;
  const sortOrder = query.sortOrder === undefined ? "desc" : query.sortOrder;
  const invalid =
    (query.search !== undefined && typeof query.search !== "string") || search.length > 120 ||
    (query.ownerId !== undefined && ownerId === undefined) || page === undefined || pageSize === undefined ||
    ![10, 20, 50].includes(pageSize) || typeof sortBy !== "string" || !staffQueueSortFields.has(sortBy) ||
    typeof sortOrder !== "string" || !["asc", "desc"].includes(sortOrder) ||
    (query.status !== undefined && (typeof query.status !== "string" || !ticketStatuses.has(query.status))) ||
    (query.requestedPriority !== undefined && (typeof query.requestedPriority !== "string" || !priorities.has(query.requestedPriority))) ||
    (query.itPriority !== undefined && (typeof query.itPriority !== "string" || !itPriorities.has(query.itPriority)));
  if (invalid) return res.status(400).json({ error: "One or more queue query values are invalid." });

  try {
    const where = {
      ...(ownerId === undefined ? {} : { ownerUserId: ownerId }),
      ...(query.status === undefined ? {} : { currentStatus: query.status as "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED" }),
      ...(query.requestedPriority === undefined ? {} : { requestedPriority: query.requestedPriority as "LOW" | "MEDIUM" | "HIGH" }),
      ...(query.itPriority === undefined ? {} : { itPriority: query.itPriority as "NOT_SET" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" }),
      ...(search === "" ? {} : { OR: [{ ticketNumber: { contains: search, mode: "insensitive" as const } }, { summary: { contains: search, mode: "insensitive" as const } }] }),
    };
    const prisma = getPrisma();
    const totalItems = await prisma.ticket.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const items = await prisma.ticket.findMany({
      where, orderBy: [{ [sortBy]: sortOrder }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize,
      include: {
        requesterUser: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true } },
      },
    });
    return res.status(200).json({ items, page, pageSize, totalItems, totalPages });
  } catch {
    return res.status(500).json({ error: "Unable to retrieve the Ticket queue." });
  }
});

const staffTicketInclude = {
  requesterUser: { select: { id: true, name: true, email: true } },
  owner: { select: { id: true, name: true, role: true } },
  category: { select: { id: true, name: true } },
  relatedSystem: { select: { id: true, name: true } },
  attachments: { orderBy: { uploadedAt: "asc" as const }, select: { id: true, originalFilename: true, mimeType: true, byteSize: true, uploadedAt: true, removedAt: true, removalReason: true } },
  publicComments: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { id: true, name: true, role: true } } } },
  internalNotes: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { id: true, name: true, role: true } } } },
};

function staffTicketId(req: Request): number | null {
  return parseRequesterOrResourceId(req.params.ticketId);
}

function validEntryContent(body: unknown): string | null {
  const content = typeof (body as { content?: unknown })?.content === "string" ? (body as { content: string }).content.trim() : "";
  return content.length > 0 && content.length <= 2000 ? content : null;
}

const allowedStatusTransitions: Record<string, string[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  REOPENED: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  CANCELLED: [],
};

app.get("/staff/tickets/:ticketId", async (req: Request, res: Response) => {
  const ticketId = staffTicketId(req);
  if (!ticketId) return res.status(404).json(notFoundMessage);
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, include: staffTicketInclude });
    if (!ticket) return res.status(404).json(notFoundMessage);
    return res.status(200).json(ticket);
  } catch { return res.status(500).json({ error: "Unable to retrieve the Ticket." }); }
});

app.get("/staff/ticket-owners", async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(await getPrisma().user.findMany({
      where: { isActive: true, role: { in: ["IT_STAFF", "ADMINISTRATOR"] } },
      select: { id: true, name: true, role: true }, orderBy: [{ name: "asc" }, { id: "asc" }],
    }));
  } catch { return res.status(500).json({ error: "Unable to retrieve Ticket Owners." }); }
});

app.patch("/staff/tickets/:ticketId/owner", async (req: Request, res: Response) => {
  if (res.locals.staffRole !== "IT_STAFF") return res.status(403).json({ error: "IT Staff access is required." });
  const ticketId = staffTicketId(req);
  const requestedOwnerId = (req.body as { ownerUserId?: unknown })?.ownerUserId;
  if (!ticketId || (requestedOwnerId !== null && (!Number.isInteger(requestedOwnerId) || Number(requestedOwnerId) <= 0))) return res.status(400).json({ error: "Choose a valid active Ticket Owner." });
  const ownerUserId = requestedOwnerId === null ? Number(res.locals.staffUserId) : Number(requestedOwnerId);
  try {
    const [ticket, owner] = await Promise.all([
      getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } }),
      getPrisma().user.findFirst({ where: { id: ownerUserId, isActive: true, role: { in: ["IT_STAFF", "ADMINISTRATOR"] } }, select: { id: true } }),
    ]);
    if (!ticket) return res.status(404).json(notFoundMessage);
    if (!owner) return res.status(400).json({ error: "Choose a valid active Ticket Owner." });
    return res.status(200).json(await getPrisma().ticket.update({ where: { id: ticketId }, data: { ownerUserId }, include: staffTicketInclude }));
  } catch { return res.status(500).json({ error: "Unable to update Ticket ownership." }); }
});

app.patch("/staff/tickets/:ticketId/it-priority", async (req: Request, res: Response) => {
  const ticketId = staffTicketId(req); const itPriority = (req.body as { itPriority?: unknown })?.itPriority;
  if (!ticketId) return res.status(404).json(notFoundMessage);
  if (typeof itPriority !== "string" || !itPriorities.has(itPriority)) return res.status(400).json({ error: "Choose a valid IT Priority." });
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) return res.status(404).json(notFoundMessage);
    return res.status(200).json(await getPrisma().ticket.update({ where: { id: ticketId }, data: { itPriority: itPriority as "NOT_SET" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" }, include: staffTicketInclude }));
  } catch { return res.status(500).json({ error: "Unable to update IT Priority." }); }
});

app.patch("/staff/tickets/:ticketId/status", async (req: Request, res: Response) => {
  if (res.locals.staffRole !== "IT_STAFF") return res.status(403).json({ error: "IT Staff access is required." });
  const ticketId = staffTicketId(req); const status = (req.body as { status?: unknown })?.status;
  if (!ticketId) return res.status(404).json(notFoundMessage);
  if (typeof status !== "string" || !ticketStatuses.has(status)) return res.status(400).json({ error: "Choose a valid Ticket status." });
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true, currentStatus: true } });
    if (!ticket) return res.status(404).json(notFoundMessage);
    if (!allowedStatusTransitions[ticket.currentStatus].includes(status)) return res.status(409).json({ error: "That status transition is not permitted." });
    return res.status(200).json(await getPrisma().ticket.update({ where: { id: ticketId }, data: { currentStatus: status as "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED" }, include: staffTicketInclude }));
  } catch { return res.status(500).json({ error: "Unable to update Ticket status." }); }
});

app.post("/staff/tickets/:ticketId/public-comments", async (req: Request, res: Response) => {
  if (res.locals.staffRole !== "IT_STAFF") return res.status(403).json({ error: "IT Staff access is required." });
  const ticketId = staffTicketId(req); const content = validEntryContent(req.body);
  if (!ticketId) return res.status(404).json(notFoundMessage);
  if (!content) return res.status(400).json({ error: "Comment content must be 1 to 2,000 characters." });
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) return res.status(404).json(notFoundMessage);
    return res.status(201).json(await getPrisma().publicComment.create({ data: { ticketId, authorId: Number(res.locals.staffUserId), content }, include: { author: { select: { id: true, name: true, role: true } } } }));
  } catch { return res.status(500).json({ error: "Unable to add the Public Comment." }); }
});

app.get("/staff/tickets/:ticketId/internal-notes", async (req: Request, res: Response) => {
  const ticketId = staffTicketId(req); if (!ticketId) return res.status(404).json(notFoundMessage);
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) return res.status(404).json(notFoundMessage);
    return res.status(200).json(await getPrisma().internalNote.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, role: true } } } }));
  }
  catch { return res.status(500).json({ error: "Unable to retrieve Internal Notes." }); }
});

app.post("/staff/tickets/:ticketId/internal-notes", async (req: Request, res: Response) => {
  if (res.locals.staffRole !== "IT_STAFF") return res.status(403).json({ error: "IT Staff access is required." });
  const ticketId = staffTicketId(req); const content = validEntryContent(req.body);
  if (!ticketId) return res.status(404).json(notFoundMessage);
  if (!content) return res.status(400).json({ error: "Internal Note content must be 1 to 2,000 characters." });
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) return res.status(404).json(notFoundMessage);
    return res.status(201).json(await getPrisma().internalNote.create({ data: { ticketId, authorId: Number(res.locals.staffUserId), content }, include: { author: { select: { id: true, name: true, role: true } } } }));
  } catch { return res.status(500).json({ error: "Unable to add the Internal Note." }); }
});

app.get("/api/tickets", async (req: Request, res: Response) => {
  const requesterUserId = Number(res.locals.requesterUserId);
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
    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });
      if (!category) {
        res.status(400).json({ error: "One or more list query values are invalid." });
        return;
      }
    }

    const where = {
      requesterUserId,
      ...(categoryId === undefined ? {} : { categoryId }),
      ...(requestedPriority === undefined ? {} : { requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH" }),
      ...(currentStatus === undefined ? {} : { currentStatus: currentStatus as "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED" }),
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
  const requesterUserId = Number(res.locals.requesterUserId);
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterUserId || !ticketId) {
    res.status(404).json(notFoundMessage);
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, requesterUserId },
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
  const requesterUserId = Number(res.locals.requesterUserId);
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterUserId || !ticketId) {
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
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterUserId }, select: { id: true } });
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
  const requesterUserId = Number(res.locals.requesterUserId);
  const ticketId = parseRequesterOrResourceId(req.params.ticketId);
  if (!requesterUserId || !ticketId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterUserId }, select: { id: true } });
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
  const requesterUserId = Number(res.locals.requesterUserId);
  const attachmentId = parseRequesterOrResourceId(req.params.attachmentId);
  if (!requesterUserId || !attachmentId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, removedAt: null, ticket: { requesterUserId } } });
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
  const requesterUserId = Number(res.locals.requesterUserId);
  const attachmentId = parseRequesterOrResourceId(req.params.attachmentId);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!requesterUserId || !attachmentId) {
    res.status(404).json(notFoundMessage);
    return;
  }
  if (reason.length < 5 || reason.length > 250) {
    res.status(400).json({ error: "Removal reason must be 5 to 250 characters." });
    return;
  }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, removedAt: null, ticket: { requesterUserId } }, select: { id: true } });
    if (!attachment) {
      res.status(404).json(notFoundMessage);
      return;
    }
    const requester = await getPrisma().developmentRequester.findFirst({
      where: { migratedUser: { is: { id: requesterUserId } } },
      select: { id: true },
    });
    await getPrisma().attachment.update({
      where: { id: attachment.id },
      data: {
        removedAt: new Date(),
        removalReason: reason,
        removedByRequesterId: requester?.id ?? null,
        removedByUserId: requesterUserId,
      },
    });
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
