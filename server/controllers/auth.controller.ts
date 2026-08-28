import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, tenants, auditLogs, transactions } from "../db/schema.js";
// ... existing imports stay the same, replacing line 5 with the updated import ...
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-buildathon";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: "PENDING", // Role will be set during workspace creation
      tenantId: null
    }).returning();

    const user = newUser[0];

    // No audit log yet since there is no tenantId for this user yet, 
    // or we could log it globally if auditLogs supported null tenantId.
    // For now, we skip the audit log until workspace creation.

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({ token, user: { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    let user = existingUsers[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Please reset your password or sign up again." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Audit log for login
    await db.insert(auditLogs).values({
      tenantId: user.tenantId,
      actorType: "User",
      actorId: user.id,
      action: "USER_LOGIN",
      entityType: "Session",
      entityId: user.id,
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
    });

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let hasData = false;
    if (user.tenantId) {
      const existingTransactions = await db.select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.tenantId, user.tenantId))
        .limit(1);
      hasData = existingTransactions.length > 0;
    }

    res.json({ user: { ...user, hasData } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
