import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return res.status(403).json({ error: "Access denied. Tenant ID is missing. Please complete workspace onboarding." });
  }
  next();
}
