# Architectural Decisions - JobPulse

This document details key engineering decisions, trade-offs, and details regarding the Adzuna API integration on JobPulse.

---

### 1. Why Adzuna API was Selected
- **Legal Compliance**: Adzuna provides a well-documented public API that permits third-party job aggregation, avoiding scrape blocks or anti-bot evasions.
- **Rich Schema**: Adzuna returns structured payloads containing company, location area arrays, categories, and original redirect links, suitable for normalized ingestion.

### 2. Why Node.js/Express was Selected
- **Asynchronous I/O**: Excellent for handling multiple asynchronous API requests and database migrations concurrently.
- **Lightweight Framework**: Express allows setting up thin controllers and separating business logic (services) and database interactions (repositories) with minimal overhead.

### 3. Ingestion vs. Real-Time Search (PostgreSQL Database Caching)
- **Rate Limit Adherence**: Adzuna restricts query frequency. Making an API request for every user search would rapidly exhaust rate limit quotas.
- **Enhanced Performance**: Querying the local PostgreSQL database (Neon serverless) enables sub-10ms search, location filtering, and paginated queries, which is much faster than round-tripping to Adzuna's external servers.
- **Resilience**: If Adzuna is offline or degraded, existing job listings remain available to users without interruption.

### 4. How Duplicate Detection Works
We implement a robust, multi-tiered deduplication strategy:
- **Primary Tier**: Compares `externalId` + `source` (unique database index). If a match exists, we calculate and check the SHA-256 content hash of the job fields. If the hash is identical, the job is marked `SKIPPED`. If the hash differs, the job details are updated (`UPDATED`).
- **Secondary Tier**: Searches the database for jobs with the same company name. Normalizes both the existing and new titles (lowercased alphanumeric characters only) and URLs (stripping query parameters and trailing slashes). If a match is found, the job is marked `SKIPPED` as a duplicate listing.

### 5. Failure Handling and Rate Limits
- **Retry and Backoff**: API requests use Axios with a `10,000ms` timeout, wrapping failures in an exponential backoff retry loop (max 3 attempts). Permanent errors (HTTP 4xx) fail immediately.
- **Circuit Breaker**: An in-memory circuit breaker monitors source connection states. If 3 consecutive failures occur, it transitions to `OPEN` to reject subsequent API calls and run fallbacks (retaining previously cached jobs).
- **Concurrency Protection**: An in-memory lock (`isIngesting` flag) in the Ingestion Service prevents multiple manual aggregation runs from starting concurrently.

### 6. Engineering Trade-off
- **In-Memory Locks and Circuit Breaker States**: Given time constraints, concurrent run locks and circuit breaker states are stored in-memory. In a distributed multi-node production setup, these states should be stored in a shared store like Redis to ensure synchronization across horizontal replicas.

### 7. AI Usage and Collaboration Disclosure
- **Boilerplate and Code Setup**: Antigravity generated the structured repository, service, and controller modules.
- **Logic Design**: Antigravity implemented the Adzuna API adapter mapping, Zod input validation schemas, and structural pagination outputs.
- **Testing**: Antigravity wrote unit test suites for Adzuna search mapping and API paginated output structures, ensuring all 19 tests pass successfully.
