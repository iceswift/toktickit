import type { NextFunction, Request, Response } from "express";
import { currentUser } from "./auth.js";

/** Keep the authenticated User, not the legacy requester row, as the access boundary. */
export async function requireRequesterSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    if (user.role !== "REQUESTER" || user.mustChangePassword) return res.status(403).json({ error: "Requester access is required." });
    res.locals.requesterUserId = user.id;
    return next();
  } catch {
    return res.status(500).json({ error: "Unable to complete the request." });
  }
}
