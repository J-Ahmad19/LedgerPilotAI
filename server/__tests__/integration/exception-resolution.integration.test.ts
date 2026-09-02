/**
 * Integration Tests: Exception Approval / Rejection + Audit Log Creation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveException } from '../../controllers/exceptions.controller';
import { db } from '../../db/index';
import { auditLogs } from '../../db/schema';
import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';

let capturedAuditLogs: any[] = [];

vi.mock('../../db/index', () => ({
  db: {
    transaction: vi.fn(async (cb: Function) => {
      capturedAuditLogs = [];
      const tx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          exception: {
            id: 'exc-1',
            transactionId: 'tx-1',
            status: 'OPEN',
            resolutionNote: null,
            type: 'AMBIGUOUS_MATCH',
          },
          transaction: {
            id: 'tx-1',
            tenantId: 'tenant-1',
            amountMinor: 10000n,
          },
        }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn((table: any) => ({
          values: vi.fn((vals: any) => {
            if (table === auditLogs) {
              const entries = Array.isArray(vals) ? vals : [vals];
              capturedAuditLogs.push(...entries);
            }
            return Promise.resolve([]);
          }),
        })),
      };
      await cb(tx);
    }),
  },
}));

const makeReq = (overrides = {}): Partial<AuthRequest> => ({
  tenantId: 'tenant-1',
  user: { id: 'user-1', email: 'admin@ledgerpilot.com', name: 'Admin', role: 'ADMIN', tenantId: 'tenant-1' } as any,
  params: { id: 'exc-1' },
  body: {},
  ...overrides,
});

const makeRes = (): Partial<Response> => ({
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
});

describe('Exception Resolution Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAuditLogs = [];
  });

  // ─── Approval ─────────────────────────────────────────────────────────────
  describe('exception approval', () => {
    it('creates EXCEPTION_APPROVED audit log on approval without note', async () => {
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      expect(db.transaction).toHaveBeenCalled();
      expect(capturedAuditLogs.length).toBe(1);
      expect(capturedAuditLogs[0].action).toBe('EXCEPTION_APPROVED');
      expect(capturedAuditLogs[0].actorType).toBe('User');
      expect(capturedAuditLogs[0].actorId).toBe('user-1');
    });

    it('includes beforeState and afterState in approval audit log', async () => {
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const log = capturedAuditLogs[0];
      expect(log.beforeState).toBeDefined();
      expect(log.afterState).toBeDefined();
      expect(log.afterState.decision).toBe('Approve Match');
    });

    it('does NOT create a RESOLUTION_NOTE_ADDED log when no note provided', async () => {
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const noteLog = capturedAuditLogs.find((l: any) => l.action === 'RESOLUTION_NOTE_ADDED');
      expect(noteLog).toBeUndefined();
    });

    it('returns 200 success on valid approval', async () => {
      const res = makeRes();
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ─── Rejection ────────────────────────────────────────────────────────────
  describe('exception rejection', () => {
    it('creates EXCEPTION_REJECTED audit log on rejection', async () => {
      const req = makeReq({ body: { decision: 'Reject Match' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const log = capturedAuditLogs.find((l: any) => l.action === 'EXCEPTION_REJECTED');
      expect(log).toBeDefined();
      expect(log.actorType).toBe('User');
    });

    it('creates EXCEPTION_REJECTED + RESOLUTION_NOTE_ADDED when note is provided', async () => {
      const req = makeReq({
        body: { decision: 'Reject Match', resolutionNote: 'Different fiscal period' },
      });
      await resolveException(req as AuthRequest, makeRes() as Response);

      expect(capturedAuditLogs.length).toBe(2);
      expect(capturedAuditLogs[0].action).toBe('EXCEPTION_REJECTED');
      expect(capturedAuditLogs[1].action).toBe('RESOLUTION_NOTE_ADDED');
      expect(capturedAuditLogs[1].afterState.resolutionNote).toBe('Different fiscal period');
    });

    it('note audit log has correct before/after state', async () => {
      const req = makeReq({
        body: { decision: 'Reject Match', resolutionNote: 'Wrong vendor' },
      });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const noteLog = capturedAuditLogs[1];
      expect(noteLog.beforeState.resolutionNote).toBeNull();
      expect(noteLog.afterState.resolutionNote).toBe('Wrong vendor');
    });
  });

  // ─── Keep Unmatched ───────────────────────────────────────────────────────
  describe('keep unmatched path', () => {
    it('creates TRANSACTION_MARKED_UNMATCHED audit log', async () => {
      const req = makeReq({ body: { decision: 'Keep Unmatched' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const log = capturedAuditLogs.find((l: any) => l.action === 'TRANSACTION_MARKED_UNMATCHED');
      expect(log).toBeDefined();
    });
  });

  // ─── Audit log structure ──────────────────────────────────────────────────
  describe('audit log creation correctness', () => {
    it('audit log always includes tenantId, actorId, entityType, entityId', async () => {
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      const log = capturedAuditLogs[0];
      expect(log.tenantId).toBe('tenant-1');
      expect(log.actorId).toBe('user-1');
      expect(log.entityType).toBe('Exception');
      expect(log.entityId).toBe('exc-1');
    });

    it('audit log metadata includes decision and sourceTxStatus', async () => {
      const req = makeReq({ body: { decision: 'Approve Match', targetTransactionId: 'tx-target-1' } });
      await resolveException(req as AuthRequest, makeRes() as Response);

      expect(capturedAuditLogs[0].metadata.decision).toBe('Approve Match');
      expect(capturedAuditLogs[0].metadata.sourceTxStatus).toBe('MATCHED');
    });
  });

  // ─── Tenant security ──────────────────────────────────────────────────────
  describe('tenant isolation in exception resolution', () => {
    it('does not resolve exceptions belonging to another tenant', async () => {
      // The inner join on transactions.tenantId enforces this at DB level.
      // We mock an empty result to simulate cross-tenant access attempt.
      const originalTransaction = (db.transaction as any).mock;
      (db.transaction as any).mockImplementationOnce(async (cb: Function) => {
        const tx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // Empty → not found
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
        };
        await cb(tx);
      });

      const res = makeRes();
      const req = makeReq({ tenantId: 'tenant-ATTACKER', body: { decision: 'Approve Match', targetTransactionId: 'tx-1' } });
      await resolveException(req as AuthRequest, res as Response);

      // Should return 500 with "Exception not found or access denied"
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
