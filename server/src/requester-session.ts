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

/** IT Staff operate the queue; Administrators may inspect it without mutating it. */
export async function requireStaffQueueSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    if (user.mustChangePassword || (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR")) {
      return res.status(403).json({ error: "IT Staff or Administrator access is required." });
    }
    res.locals.staffUserId = user.id;
    res.locals.staffRole = user.role;
    return next();
  } catch {
    return res.status(500).json({ error: "Unable to complete the request." });
  }
}

/** Administrator operations are a separate backend boundary from IT Staff work. */
export async function requireAdministratorSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    if (user.role !== "ADMINISTRATOR" || user.mustChangePassword) return res.status(403).json({ error: "Administrator access is required." });
    res.locals.administratorUserId = user.id;
    return next();
  } catch {
    return res.status(500).json({ error: "Unable to complete the request." });
  }
}
