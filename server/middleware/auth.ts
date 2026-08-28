import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-buildathon";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
  tenantId?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token." });
  }
}
