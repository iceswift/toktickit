import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

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
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Unable to retrieve categories." });
  }
});

export default app;
