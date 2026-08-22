import { z } from "zod";

export const transactionImportSchema = z.object({
  externalId: z.string().min(1),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/), // allow negative for refunds/payouts if needed, or simply assume positive based on type
  currency: z.string().length(3),
  transactionDate: z.coerce.date(),
  transactionType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  merchantName: z.string().optional(),
  customerName: z.string().optional(),
  status: z.string().optional().default("OPEN"),
  settlementDate: z.coerce.date().optional()
});

export type TransactionImportRecord = z.infer<typeof transactionImportSchema>;
