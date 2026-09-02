# LedgerPilotAI 🚀

> **Automated Financial Reconciliation Powered by Agentic AI**

LedgerPilotAI is an enterprise-grade financial reconciliation engine that leverages deterministic algorithms and Agentic AI to automate the matching of ledger entries, bank settlements, and payment gateways. Designed for multi-tenant SaaS environments, it dramatically reduces manual accounting work by autonomously resolving complex variances and flagging high-risk exceptions.

---

## 🛠 Technology Stack

LedgerPilotAI is built on a modern, type-safe, and high-performance stack:

### Frontend
- **React 18** & **Vite**: Blazing fast development and optimized production builds.
- **Tailwind CSS** & **Framer Motion**: Premium, responsive UI with staggered entrance animations and smooth page transitions.
- **Recharts**: Interactive data visualization for reconciliation trends.
- **React Router**: Declarative routing for single-page application flows.

### Backend (Node.js)
- **Express**: Robust and lightweight API gateway.
- **Drizzle ORM**: High-performance, type-safe SQL ORM for data modeling and migrations.
- **PostgreSQL**: Reliable, ACID-compliant relational database (multi-tenant architecture).
- **Zod**: Runtime schema validation for API payloads.

### Asynchronous Processing & AI
- **BullMQ & Redis**: Distributed task queue for scalable background reconciliation runs.
- **Google GenAI / Groq SDK**: LLM integration for the `Finance Agent`, enabling contextual fuzzy-matching and reasoning for complex exceptions.

### Observability
- **Pino**: High-throughput structured JSON logging.
- **Prometheus (prom-client)**: Real-time application metrics (match rates, queue latency, exception counts).

---

## 🏗 System Architecture

LedgerPilotAI operates on an event-driven, asynchronous architecture to handle high volumes of transaction data without blocking the API gateway.

```mermaid
graph TD
    %% User Interfaces
    Client[React SPA Frontend]

    %% API Gateway
    subgraph "API Gateway (Express)"
        Ingestion[Ingestion Service]
        Query[Query / Reports Service]
        QueueProducer[Job Producer]
    end

    %% Async Workers
    subgraph "Background Workers (BullMQ)"
        Worker[Reconciliation Worker]
        Engine[Matching Engine]
        Agent[Finance Agent / LLM]
    end

    %% Data Stores
    DB[(PostgreSQL Database)]
    Redis[(Redis Cache / Queue)]
    
    %% Connections
    Client -->|Uploads CSVs| Ingestion
    Client -->|Fetches Data| Query
    
    Ingestion -->|Normalizes & Saves| DB
    Ingestion -->|Triggers Run| QueueProducer
    QueueProducer -->|Enqueues Job| Redis
    
    Redis -->|Processes Job| Worker
    Worker -->|Reads Transactions| DB
    Worker -->|Executes Match| Engine
    
    Engine -->|Exact Match| DB
    Engine -->|Unresolved Variances| Agent
    
    Agent -->|Reasons over Data| Engine
    Agent -->|Writes Exceptions| DB
    
    Query -->|Reads State| DB
```

---

## 🔄 Core Workflows

### 1. Data Ingestion Pipeline
Users upload CSV files (Bank Statements, Internal Ledgers, Payment Gateway data). The `Ingestion Service` parses the data, validates the schema using Zod, normalizes currencies and dates, and securely writes the records to the database with strict multi-tenant isolation (`tenantId`).

### 2. Reconciliation Engine Workflow
When a reconciliation run is triggered, a job is enqueued in BullMQ. The background worker picks it up and processes it in stages:
1. **Deterministic Exact Matching**: The engine first attempts 1:1, 1:N, and N:M matching using precise identifiers (Transaction IDs, exact amounts, matching dates).
2. **Fuzzy Matching**: Uses string-similarity (Levenshtein distance) on reference fields and allows for configurable date windows (e.g., ±2 days) or minor cent variances (e.g., ±$0.05).
3. **AI Resolution Pipeline**: Any remaining unresolved transactions are bundled and passed to the `Finance Agent`.

### 3. Agentic AI Resolution (Finance Agent)
The `Finance Agent` acts as a virtual accountant. Provided with the unresolved data context and specific tools, it reasons over the variances. It can identify scenarios such as:
- **Foreign Exchange (FX) Variance**: Identifying that a $10.50 discrepancy is due to daily currency fluctuations.
- **Bundled Fees**: Recognizing that a bank settlement is exactly the ledger amount minus a standard 2.9% gateway fee.
- **Missing Data**: Flagging anomalies where a ledger entry has no corresponding bank deposit within a 30-day window.

The agent classifies the exception, suggests a resolution, and writes a detailed audit trail.

---

## 🧠 Design Decisions

- **Multi-Tenant First**: Every table in the Drizzle schema includes a `tenantId`. Database queries enforce tenant boundaries at the repository level, ensuring strict data isolation for SaaS deployments.
- **Asynchronous Reconciliation via BullMQ**: Reconciliation is computationally heavy. Offloading this to a Redis-backed queue prevents API timeouts, allows for horizontal scaling of worker nodes, and provides built-in retry mechanisms for transient failures.
- **Drizzle ORM over Prisma**: Drizzle was chosen for its edge-compatibility, zero-dependencies footprint, and SQL-like syntax, resulting in faster cold starts and lower latency query execution.
- **Staged Matching Pipeline**: By exhausting deterministic O(1) or O(N) matching algorithms before invoking the LLM, the system minimizes expensive API calls and drastically reduces end-to-end latency. The AI is reserved strictly for complex edge cases.
- **Framer Motion for UI**: To provide a premium, modern aesthetic, we utilized `framer-motion` for staggered list reveals and layout transitions, elevating the user experience beyond a standard enterprise dashboard.

---

## 🚀 Getting Started

Follow these instructions to run LedgerPilotAI locally for development.

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (Running locally or via Docker)
- **Redis** (Running locally or via Docker)

### 1. Clone & Install
```bash
git clone https://github.com/J-Ahmad19/LedgerPilotAI.git
cd LedgerPilotAI
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory based on the provided defaults. Ensure you have the following keys configured:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ledgerpilot

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs (Choose your preferred provider)
GOOGLE_GENAI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

### 3. Database Setup
Push the Drizzle schema to your PostgreSQL database:
```bash
npm run db:push
```

*(Optional)* You can open the Drizzle Studio to inspect your local database:
```bash
npm run db:studio
```

### 4. Run the Application
You will need two terminal windows to run the frontend and backend concurrently.

**Terminal 1 (Vite Frontend):**
```bash
npm run dev
```

**Terminal 2 (Express Backend & Workers):**
```bash
npm run dev:server
```

The application will be available at `http://localhost:5173`.

---

## 🧪 Testing

LedgerPilotAI includes a comprehensive test suite (Unit, Integration, E2E, and AI Agent evaluation).

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```
