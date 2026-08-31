import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./ticket-number.js";

// Export the Express app separately from app.listen() so Supertest can use it.
export const app = express();

app.use(cors());
app.use(express.json());

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
  const requesterId = Number(req.header("X-Development-Requester-Id"));
  const ticketId = Number(req.params.ticketId);
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    res.status(404).json({ error: "The requested resource was not found." });
    return;
  }

  try {
    const prisma = getPrisma();
    const requester = await prisma.developmentRequester.findFirst({ where: { id: requesterId, isActive: true }, select: { id: true } });
    if (!requester) {
      res.status(404).json({ error: "The requested resource was not found." });
      return;
    }
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, requesterId: requester.id },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: { orderBy: { uploadedAt: "asc" } },
      },
    });
    if (!ticket) {
      res.status(404).json({ error: "The requested resource was not found." });
      return;
    }
    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: "Unable to retrieve the Ticket." });
  }
});

export default app;
