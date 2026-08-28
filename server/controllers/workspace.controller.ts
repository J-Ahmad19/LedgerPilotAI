import { Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { tenants, users, auditLogs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-buildathon";

export async function createWorkspace(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: "Workspace name and role are required" });
    }

    const validRoles = ["ADMIN", "FINANCE_MANAGER", "REVIEWER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Verify user doesn't already have a workspace
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    const user = existingUser[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.tenantId) {
      return res.status(400).json({ error: "User already belongs to a workspace" });
    }

    // Create Tenant
    const newTenant = await db.insert(tenants).values({
      name,
    }).returning();
    
    const tenantId = newTenant[0].id;

    // Update User
    const updatedUser = await db.update(users)
      .set({ tenantId, role })
      .where(eq(users.id, userId))
      .returning();

    const u = updatedUser[0];

    // Create Audit Log
    await db.insert(auditLogs).values({
      tenantId: tenantId,
      actorType: "User",
      actorId: u.id,
      action: "WORKSPACE_CREATED",
      entityType: "Tenant",
      entityId: tenantId,
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
    });

    // Generate new JWT with tenantId
    const token = jwt.sign(
      { id: u.id, tenantId: u.tenantId, role: u.role, email: u.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: { id: u.id, tenantId: u.tenantId, email: u.email, name: u.name, role: u.role }
    });

  } catch (error: any) {
    console.error("Create workspace error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
