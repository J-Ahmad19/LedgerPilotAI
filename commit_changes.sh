#!/bin/bash
set -e

# Dependencies
git add package.json package-lock.json
git commit -m "chore: add logging, metrics, and testing dependencies"

# Utils
git add server/utils/logger.ts server/utils/metrics.ts
git commit -m "feat(utils): add logger and metrics utilities"

# Agents
git add server/agents/finance-agent.ts server/agents/tools.ts
git commit -m "feat(agents): add metrics and tenant security checks"

# Controllers
git add server/controllers/exceptions.controller.ts
git commit -m "feat(controllers): add tenant verification and comprehensive audit logging for exceptions"

git add server/controllers/reconciliation.controller.ts
git commit -m "feat(controllers): enforce tenantId checks in reconciliation endpoints"

git add server/controllers/audit.controller.ts server/controllers/reports.controller.ts
git commit -m "feat(controllers): add audit log and reports controllers"

# Services
git add server/services/cash.service.ts server/services/ingestion.service.ts server/services/reconciliation.service.ts
git commit -m "feat(services): add metrics to cash, ingestion, and reconciliation services"

# Queue
git add server/queue/reconciliation.queue.ts
git commit -m "feat(queue): add structured logging and metrics to reconciliation queue"

# Routes & Server Setup
git add server/routes/audit.routes.ts server/routes/reports.routes.ts
git commit -m "feat(routes): add audit and reports routes"

git add server/routes/index.ts server/index.ts
git commit -m "feat(server): integrate pino logger, metrics endpoint, and new routes"

# Tests
git add server/__tests__/audit.test.ts server/__tests__/rbac.test.ts
git commit -m "test: add tests for audit and RBAC"

# Frontend
git add src/App.tsx src/components/layout/Sidebar.tsx src/services/api.ts src/lib/export.ts src/pages/AuditLog.tsx src/pages/Reports.tsx tsconfig.tsbuildinfo
git commit -m "feat(frontend): add audit log, reports pages, and api endpoints"

# Push
git push
