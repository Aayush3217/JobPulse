# JobPulse — Full-Stack Job Ingestion Platform

JobPulse is a production-grade full-stack web application built for the Acdyon Technologies Frontend Challenge. It aggregates job listings from the **Adzuna Jobs Search API**, normalizes them into a unified data model, performs database deduplication, and presents listings in a responsive glassmorphic React dashboard.

---

## 1. Project Architecture

```text
                    ┌────────────────────────┐
                    │    Adzuna Jobs API     │
                    │   (Vetted Public API)  │
                    └────────────┬───────────┘
                                 │ (Axios + 10s Timeout)
                                 ▼
                    ┌────────────────────────┐
                    │   Node.js Ingestion    │
                    │       Service          │
                    │                        │
                    │ Fetch (Circuit Breaker)│
                    │ Validate (Zod)         │
                    │ Normalize (Zod Schema) │
                    │ Deduplicate (3-Tier)   │
                    │ Retry (Exp Backoff)    │
                    └────────────┬───────────┘
                                 │ (Prisma ORM)
                                 ▼
                    ┌────────────────────────┐
                    │  Neon PostgreSQL DB    │
                    │                        │
                    │ jobs                   │
                    │ sources                │
                    │ ingestion_runs         │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Express REST API    │
                    │                        │
                    │ /api/jobs              │
                    │ /api/sources           │
                    │ /api/ingestion         │
                    │ /api/health            │
                    └────────────┬───────────┘
                                 │ (JSON / HTTP)
                                 ▼
                    ┌────────────────────────┐
                    │     React Frontend     │
                    │                        │
                    │ Job Search (Local DB)  │
                    │ Sidebar Filters        │
                    │ Job Detail View        │
                    │ Ingestion Dashboard    │
                    └────────────────────────┘
```

---

## 2. Ingestion & Deduplication Pipeline

1. **Fetch**: The ingestion pipeline calls Adzuna's endpoint `GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}` with credentials `app_id` and `app_key`.
2. **Safe Mapping**:
   - `id` -> `externalId`
   - `title` -> `title`
   - `company.display_name` -> `companyName`
   - `location.display_name` -> `location`
   - `contract_type` -> `jobType` (e.g. `full-time`, `contract`)
   - `category.label` -> `category`
   - `description` -> `description`
   - `redirect_url` -> `url`
   - `created` -> `publishedAt`
3. **Zod Validation**: Validates the normalized schema structure.
4. **Primary Deduplication**: Checks `[externalId, source]`. If found, calculates a SHA-256 content hash of job fields. If identical, increments `skipped`. If changed, updates job details and increments `updated`.
5. **Secondary Deduplication**: Searches for existing database listings from the same company. Compares normalized titles (alphanumeric characters only) and URLs (excl. query search string parameters). If matched, increments `skipped`.
6. **Insert**: Saves new entries to Neon PostgreSQL.

---

## 3. Technology Stack

### Backend
- **Node.js** & **Express.js** REST API
- **Prisma ORM** & **PostgreSQL** (Neon cloud database)
- **Zod** (Input validation)
- **Helmet** & **CORS** (Security headers)
- **express-rate-limit** (Protection from abuse)
- **node-cron** (Scheduled aggregation)
- **Pino** & **pino-pretty** (Structured logging)

### Frontend
- **React.js** (Vite template)
- **Tailwind CSS v4** (CSS-first design system)
- **React Router** & **Axios**

---

## 4. Setup & Environment Variables

### Backend Configuration
Create `/backend/.env` file:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@<neon_host>/neondb?sslmode=require"

# Adzuna API Keys
ADZUNA_APP_ID="your_app_id"
ADZUNA_APP_KEY="your_app_key"

CORS_ALLOWED_ORIGINS=http://localhost:5173
INGESTION_CRON=0 */6 * * *
```

### Frontend Configuration
Create `/frontend/.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
*(Note: Never place ADZUNA_APP_ID or ADZUNA_APP_KEY in the frontend variables. The frontend queries only our Express API.)*

---

## 5. Setup & Running Local servers

### Database Migrations
Push the database schema directly to Neon:
```bash
cd backend
npm install
npx prisma db push
```

### Startup

**Backend Server:**
```bash
npm run dev
```

**Frontend React Client:**
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 6. API Endpoints

- `GET /api/jobs` - Paginated job listings from database. (e.g. `/api/jobs?keyword=java&location=Delhi&page=0&size=10`).
- `GET /api/jobs/:id` - Job details.
- `POST /api/ingestion/run` - Triggers Adzuna/Remotive manual ingestion.
- `GET /api/ingestion/runs` - History logs of runs.
- `GET /api/sources` - List registered sources.
- `GET /api/sources/:source/health` - Active circuit breaker state and health status.
- `GET /api/health` - App and database status.
```json
{
  "status": "UP",
  "database": "UP",
  "timestamp": "2026-08-19T20:30:00.000Z"
}
```

---

## 7. Retry, Rate Limits & Failure Handling

- **Circuit Breaker**: Suspends calls to Adzuna if 3 consecutive failures occur, preventing rate-limit suspensions. Falling back to cached DB jobs.
- **Backoff Retry**: Retries failed calls with exponential delay (500ms -> 1s -> 2s -> stop).
- **Concurrency Lock**: An in-memory lock prevents multiple ingestion requests from running simultaneously.
- **Neon Cloud Resilience**: Existing jobs remain fully available during API downtime.
