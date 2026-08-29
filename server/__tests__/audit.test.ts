import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveException } from '../controllers/exceptions.controller';
import { db } from '../db/index';
import { auditLogs } from '../db/schema';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { eq } from 'drizzle-orm';

let insertedAuditLogs: any[] = [];

vi.mock('../db/index', () => {
  return {
    db: {
      transaction: vi.fn(async (cb) => {
        insertedAuditLogs = []; // Reset on each transaction
        
        const tx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ 
            id: 'mock-exc-id', 
            transactionId: 'mock-tx-id',
            status: 'OPEN',
            resolutionNote: null
          }]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn((table) => {
            return {
              values: vi.fn((vals) => {
                if (table === auditLogs) {
                  if (Array.isArray(vals)) {
                    insertedAuditLogs.push(...vals);
                  } else {
                    insertedAuditLogs.push(vals);
                  }
                }
                return Promise.resolve([]);
              })
            };
          }),
        };
        await cb(tx);
      }),
    }
  };
});

describe('Exception Resolution Audit Logs', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      tenantId: 'tenant-1',
      user: { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'ADMIN', tenantId: 'tenant-1' } as any,
      params: { id: 'mock-exc-id' },
      body: {}
    };

    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  it('creates exactly one EXCEPTION_APPROVED audit event when approving a match without a note', async () => {
    req.body = { decision: 'Approve Match', targetTransactionId: 'target-tx-id' };
    
    await resolveException(req as AuthRequest, res as Response);
    
    expect(db.transaction).toHaveBeenCalled();
    expect(insertedAuditLogs.length).toBe(1);
    expect(insertedAuditLogs[0].action).toBe('EXCEPTION_APPROVED');
  });

  it('creates EXCEPTION_REJECTED and RESOLUTION_NOTE_ADDED when rejecting with a note', async () => {
    req.body = { decision: 'Reject Match', resolutionNote: 'Not a real match' };
    
    await resolveException(req as AuthRequest, res as Response);
    
    expect(db.transaction).toHaveBeenCalled();
    expect(insertedAuditLogs.length).toBe(2);
    expect(insertedAuditLogs[0].action).toBe('EXCEPTION_REJECTED');
    expect(insertedAuditLogs[1].action).toBe('RESOLUTION_NOTE_ADDED');
    expect(insertedAuditLogs[1].afterState.resolutionNote).toBe('Not a real match');
  });
});
