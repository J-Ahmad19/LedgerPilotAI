import { Response } from "express";
import { db } from "../db/index.js";
import { auditLogs, users } from "../db/schema.js";
import { AuthRequest } from "../middleware/auth.js";
import { eq, desc, and, or, sql } from "drizzle-orm";

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action, entityType, actorType } = req.query;

    let conditions = [eq(auditLogs.tenantId, tenantId)];

    if (action && action !== 'All') {
      conditions.push(eq(auditLogs.action, action as string));
    }
    if (entityType && entityType !== 'All') {
      conditions.push(eq(auditLogs.entityType, entityType as string));
    }
    if (actorType && actorType !== 'All') {
      conditions.push(eq(auditLogs.actorType, actorType as string));
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorType: auditLogs.actorType,
        actorId: auditLogs.actorId,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        beforeState: auditLogs.beforeState,
        afterState: auditLogs.afterState,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);

    res.json({ logs });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
