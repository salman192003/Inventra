# Inventra

> **SaaS platform for small businesses** — inventory management, sales tracking, cashflow monitoring, customer analytics, and AI-powered demand forecasting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL via Supabase |
| **AI Service** | Python / Node.js microservice (forecasting + RAG) |
| **Auth** | Supabase Auth (JWT) |
| **File Storage** | Supabase Storage |
| **Vector Search** | pgvector (via Supabase) |
| **ORM** | Prisma |

---

## Project Structure

```
inventra/
├── backend/          # Express API server
├── frontend/         # Next.js web application
├── ai-service/       # AI forecasting + RAG microservice
├── shared/           # Shared TypeScript types
└── docs/             # Schema design, ADRs, API docs
```

---

## Getting Started

### Prerequisites
- Node.js >= 20
- PostgreSQL (or Supabase project)
- npm >= 9

### 1. Clone and install

```bash
git clone <repo-url>
cd inventra
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in your Supabase URL, anon key, service role key, and database connection string.

### 3. Run database migrations

```bash
cd backend
npx prisma migrate dev
```

### 4. Start development servers

```bash
# From the root
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## Feature Domains

- **Inventory Management** — Event-based ledger, full movement history
- **Sales Tracking** — Transactions, line items, payment tracking
- **Cashflow Monitoring** — Unified inflow/outflow ledger
- **Customer Tracking** — Profiles, purchase history, segmentation
- **Demand Forecasting** — AI-generated per-product forecasts
- **Inventory Optimization** — AI restock recommendations
- **Customer Analytics** — Behaviour insights from sales data
- **Document Uploads** — Invoices, receipts, contracts
- **AI Q&A (RAG)** — Ask questions over your business documents
- **Notifications** — Low stock alerts, forecast readiness, cashflow anomalies

---

## Architecture Decision Records

See `/docs/` for:
- `schema-design.md` — Full database schema proposal
- `api-design.md` — REST API structure
- `auth-flow.md` — Authentication and multi-tenancy strategy

---

## License

Private — All rights reserved.
