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

export default app;
