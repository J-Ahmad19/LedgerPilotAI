import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requireRole } from '../middleware/rbac';
import { requireTenant } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';

// Mock DB and environment
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      transactions: { findMany: vi.fn() }
    },
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })),
  }
}));

const app = express();
app.use(express.json());

// Set up mock auth token decoding
const mockSecret = "test-secret";
process.env.JWT_SECRET = mockSecret;

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, mockSecret) as any;
      (req as any).user = decoded;
      (req as any).tenantId = decoded.tenantId;
    } catch(e) {}
  }
  next();
});

// Setup mock routes to test RBAC and tenant middleware
const adminAndFinance = ["ADMIN", "FINANCE_MANAGER"];
const reviewerRoles = ["ADMIN", "FINANCE_MANAGER", "REVIEWER"];

app.get('/protected/runs', requireTenant as any, requireRole(adminAndFinance), (req, res) => {
  res.status(200).json({ success: true });
});

app.post('/protected/exceptions/:id/resolve', requireTenant as any, requireRole(["ADMIN", "REVIEWER"]), (req, res) => {
  res.status(200).json({ success: true });
});

const generateToken = (role: string, tenantId: string = "t-1") => {
  return jwt.sign({ id: "user-1", tenantId, role }, mockSecret);
};

describe('RBAC Middleware & Tenant Enforcement', () => {

  it('should deny access if no tenant ID is present on a tenant-protected route', async () => {
    // Viewer user but missing tenant (e.g. not onboarded)
    const token = jwt.sign({ id: "user-1", role: "VIEWER" }, mockSecret);
    const res = await request(app)
      .get('/protected/runs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Tenant ID is missing");
  });

  it('should deny access if user lacks required role', async () => {
    const token = generateToken("VIEWER");
    const res = await request(app)
      .get('/protected/runs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Insufficient permissions");
  });

  it('should allow access if user has required role (ADMIN)', async () => {
    const token = generateToken("ADMIN");
    const res = await request(app)
      .get('/protected/runs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
  });

  it('should allow access if user has required role (FINANCE_MANAGER)', async () => {
    const token = generateToken("FINANCE_MANAGER");
    const res = await request(app)
      .get('/protected/runs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
  });

  it('should restrict exception resolution to ADMIN and REVIEWER', async () => {
    const adminToken = generateToken("ADMIN");
    const reviewerToken = generateToken("REVIEWER");
    const financeToken = generateToken("FINANCE_MANAGER");
    const viewerToken = generateToken("VIEWER");

    // Admins can resolve
    expect((await request(app).post('/protected/exceptions/1/resolve').set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
    // Reviewers can resolve
    expect((await request(app).post('/protected/exceptions/1/resolve').set('Authorization', `Bearer ${reviewerToken}`)).status).toBe(200);
    
    // Finance Managers cannot resolve exceptions
    expect((await request(app).post('/protected/exceptions/1/resolve').set('Authorization', `Bearer ${financeToken}`)).status).toBe(403);
    // Viewers cannot resolve
    expect((await request(app).post('/protected/exceptions/1/resolve').set('Authorization', `Bearer ${viewerToken}`)).status).toBe(403);
  });

});
