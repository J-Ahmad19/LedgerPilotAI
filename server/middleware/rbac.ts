import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized. User or role not found." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    }

    next();
  };
}
