import { pgTable, uuid, text, bigint, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dataSources = pgTable("data_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rawTransactions = pgTable("raw_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  dataSourceId: uuid("data_source_id")
    .notNull()
    .references(() => dataSources.id),
  externalId: text("external_id").notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => dataSources.id),
  externalId: text("external_id").notNull(),
  transactionType: text("transaction_type").notNull(),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),
  settlementDate: timestamp("settlement_date", { withTimezone: true }),
  merchantName: text("merchant_name"),
  customerName: text("customer_name"),
  referenceId: text("reference_id"),
  description: text("description"),
  normalizedReference: text("normalized_reference"),
  normalizedDescription: text("normalized_description"),
  status: text("status").notNull(),
  transactionHash: text("transaction_hash").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reconciliationRuns = pgTable("reconciliation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  status: text("status").notNull(), // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalRecords: bigint("total_records", { mode: "number" }),
  matchedRecords: bigint("matched_records", { mode: "number" }),
  partialMatches: bigint("partial_matches", { mode: "number" }),
  unmatchedRecords: bigint("unmatched_records", { mode: "number" }),
  matchRate: text("match_rate"), // or numeric
  totalAmountMinor: bigint("total_amount_minor", { mode: "bigint" }),
  matchedAmountMinor: bigint("matched_amount_minor", { mode: "bigint" }),
  unmatchedAmountMinor: bigint("unmatched_amount_minor", { mode: "bigint" }),
});

export const reconciliationMatches = pgTable("reconciliation_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => reconciliationRuns.id),
  sourceTransactionId: uuid("source_transaction_id")
    .notNull()
    .references(() => transactions.id),
  targetTransactionId: uuid("target_transaction_id")
    .notNull()
    .references(() => transactions.id),
  matchType: text("match_type").notNull(), // Exact, Fuzzy, AI
  confidenceScore: text("confidence_score").notNull(),
  amountScore: text("amount_score"),
  dateScore: text("date_score"),
  referenceScore: text("reference_score"),
  descriptionScore: text("description_score"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  actorType: text("actor_type").notNull(), // System, User, Agent
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exceptions = pgTable("exceptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .references(() => reconciliationRuns.id),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  confidence: text("confidence"), // Storing as string or numeric, PDF uses 17%
  reason: text("reason").notNull(),
  suggestedAction: text("suggested_action"),
  status: text("status").notNull(),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
